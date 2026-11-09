import React, { useEffect, useMemo, useState } from "react";
import parse from "html-react-parser";
import { createPortal } from "react-dom";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CopyIcon from "@mui/icons-material/Assignment";
import DownloadIcon from "@mui/icons-material/SaveAlt";
import SearchIcon from "@mui/icons-material/Search";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LinkIcon from "@mui/icons-material/Link";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask } from "@fortawesome/free-solid-svg-icons";
import DocumentListItem from "../lib_components/components/Documents/DocumentListItem";
import DocumentService from "../lib_components/service/DocumentService";
import InfoMessageCard from "../lib_components/components/Card/InfoMessageCard";
import DataProductAvailability from "../lib_components/components/DataProductAvailability/DataProductAvailability";
import { citationFile, safeUrl } from "./collectionProfile/profile";
import { dataProductCode, selectDocumentation } from "./collectionProfile/documentation";
import { archiveFilename, partitionResources } from "./collectionProfile/resources";
import styles from "./collectionProfile/Profile.module.css";
import CollectionDetails from "./collectionProfile/CollectionDetails";
import CollectionStatistics from "./collectionProfile/CollectionStatistics";

function Link({ href, children, button = false, external = false }) {
  const url = safeUrl(href);
  if (!url) return <span>{children}</span>;
  return (
    <a
      className={button ? styles.button : undefined}
      href={url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function SampleTypeNotice({ id, title, lead, message, links }) {
  return (
    <aside className={styles.notice} role="note" aria-labelledby={id}>
      <div className={styles.noticeHeader}>
        <LocalOfferIcon className={styles.noticeIcon} aria-hidden="true" />
        <h2 id={id} className={styles.noticeTitle}>{title}</h2>
        <InfoOutlinedIcon className={styles.noticeInfo} aria-hidden="true" />
      </div>
      <div className={styles.noticeBody}>
        <div className={styles.noticeMessage}>
          <p className={styles.noticeLead}>{lead}</p>
          <p>{message}</p>
        </div>
        <div className={styles.noticeActions}>
          {links.map(({ href, label }) => (
            <Link key={href} button href={href}>
              {label}
              <ChevronRightIcon fontSize="small" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

function DataDownloads({ resources, profile, clientRoot }) {
  const rows = [
    {
      key: "browse",
      title: "Browse Records",
      description: "Browse all records for this sample type.",
      Icon: FormatListBulletedIcon,
      action: "Browse",
      href: `${clientRoot}/collections/list.php?db=${profile.id}`,
      endIcon: <ChevronRightIcon />,
    },
    {
      key: "search",
      title: "Search Records",
      description: "Filter records to find and download a subset.",
      Icon: SearchIcon,
      action: "Search",
      href: `${clientRoot}/neon/search/index.php?db=${profile.id}`,
      endIcon: <ChevronRightIcon />,
    },
    ...resources.map((resource) => {
      const isArchive = resource.kind === "dwca";
      return {
        key: resource.kind,
        title: isArchive ? "Full Data Download" : "Metadata",
        description: isArchive ? "Darwin Core Archive (DwC-A)" : "Ecological Metadata Language (EML) File",
        filename: isArchive ? resource.filename ?? archiveFilename(resource.url) : "",
        size: isArchive && Number.isInteger(resource.sizeBytes) && resource.sizeBytes >= 0
          ? (resource.sizeBytes === 0 ? "0 B" : DocumentService.formatBytes(resource.sizeBytes))
          : "",
        Icon: isArchive ? DescriptionOutlinedIcon : LinkIcon,
        action: resource.action || (isArchive ? "Download" : "View"),
        href: resource.url,
        startIcon: isArchive ? (resource.actionIcon === "lock" ? <LockOutlinedIcon /> : <DownloadIcon />) : undefined,
        endIcon: isArchive ? undefined : <ChevronRightIcon />,
        external: resource.openInNewTab ?? true,
      };
    }),
  ];
  return (
    <ul className={styles.relatedList}>
      {rows.map(({ key, title, description, filename, size, Icon, action, href, startIcon, endIcon, external }) => {
        return (
          <li key={key} className={styles.relatedItem}>
            <Icon className={styles.relatedIcon} aria-hidden="true" />
            <div className={styles.relatedLabel}>
              <h3>{title}</h3>
              <p className={styles.relatedCode}>
                {description}
                {size && (
                  <>
                    <span className={styles.resourceSeparator} aria-hidden="true">|</span>
                    <span>{size}</span>
                  </>
                )}
                {filename && (
                  <>
                    <span className={styles.resourceSeparator} aria-hidden="true">|</span>
                    <span>{filename}</span>
                  </>
                )}
              </p>
            </div>
            <Button
              className={styles.relatedAction}
              variant="outlined"
              startIcon={startIcon}
              endIcon={endIcon}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {action}
              <span className={styles.srOnly}> {title}{external ? " (opens in a new tab)" : ""}</span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function Documentation({ resources }) {
  const [result, setResult] = useState({
    specs: [],
    loading: true,
    failed: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ specs: [], loading: true, failed: false });
    const ids = [
      ...new Set(
        resources
          .map((item) => dataProductCode(item.url))
          .filter(Boolean),
      ),
    ];
    const load = async () => {
      const responses = await Promise.allSettled(
        ids.map(async (id) => {
          const response = await fetch(
            `https://data.neonscience.org/api/v0/products/${id}`,
            { signal: controller.signal },
          );
          if (!response.ok) throw new Error("Unable to retrieve documentation");
          const body = await response.json();
          const specs = body.data?.specs || [];
          if (!Array.isArray(specs)) throw new Error("Invalid documentation response");
          return specs;
        }),
      );
      if (controller.signal.aborted) return;
      const specs = responses.flatMap((response) =>
        response.status === "fulfilled"
          ? response.value
          : [],
      );
      setResult({
        specs: selectDocumentation(specs),
        loading: false,
        failed: responses.some((response) => response.status === "rejected"),
      });
    };
    load();
    return () => controller.abort();
  }, [resources]);
  return (
    <>
      {result.loading && <p role="status">Loading documentation…</p>}
      {result.failed && (
        <p role="status">
          Some documentation could not be loaded. Use the data product links above
          to view their documentation.
        </p>
      )}
      {!result.loading && !result.failed && !result.specs.length && (
        <p>No documentation is currently available for this sample type.</p>
      )}
      {!!result.specs.length && (
        <ul className={styles.relatedList}>
          {result.specs.map((spec) => (
            <li key={spec.specNumber} className={styles.documentationItem}>
              <DocumentListItem
                document={{
                  name: spec.specNumber,
                  type: spec.specType || "application/pdf",
                  size: spec.specSize || 0,
                  description: spec.specDescription || spec.specNumber,
                }}
                containerComponent="div"
                makeDownloadableLink={false}
                enableDownloadButton
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Citation({ profile, clientRoot }) {
  const [status, setStatus] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.citationText);
      setStatus("Citation copied.");
    } catch {
      setStatus(
        "Unable to copy automatically. Select and copy the citation below.",
      );
    }
  };
  const download = (format) => {
    const description = new DOMParser().parseFromString(
      profile.description || "",
      "text/html",
    ).body.textContent;
    const blob = new Blob(
      [citationFile(profile.citation, format, description)],
      {
        type: `${format === "bib" ? "application/x-bibtex" : "application/x-research-info-systems"};charset=utf-8`,
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NEON-${profile.citation.title.replace(/[^a-zA-Z0-9]+/g, "-")}-${profile.citation.accessDate}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <p className={styles.citationInstructions}>
        Please use this citation in your publications.
        Publications involving physical samples must also include individual
        specimen citations. See{" "}
        <Link href={`${clientRoot}/misc/cite.php`}>
          Acknowledging and Citing the Biorepository
        </Link>
        {" "}for more info.
      </p>
      <div className={styles.citation}>
        <Typography component="div" variant="body2" className={styles.citationText}>
          {profile.citationText}
        </Typography>
        <div className={styles.citationActions}>
          <Tooltip
            placement="bottom-start"
            title="Click to copy the above plain text citation to the clipboard"
            describeChild
            slotProps={{ tooltip: { className: styles.citationTooltip } }}
          >
            <Button
              size="small"
              color="primary"
              variant="outlined"
              startIcon={<CopyIcon fontSize="small" />}
              aria-label="Copy citation"
              onClick={copy}
            >
              Copy
            </Button>
          </Tooltip>
          {[
            { format: "bib", label: "BibTeX", name: "BibTeX" },
            { format: "ris", label: "RIS", name: "Research Information Systems (RIS)" },
          ].map(({ format, label, name }) => (
            <Tooltip
              key={format}
              placement="bottom-start"
              title={`Click to download the ${profile.code || profile.title} citation as a file in ${name} format`}
              describeChild
              slotProps={{ tooltip: { className: styles.citationTooltip } }}
            >
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<DownloadIcon fontSize="small" />}
                onClick={() => download(format)}
              >
                Download ({label})
              </Button>
            </Tooltip>
          ))}
        </div>
        <p role="status" className={styles.status}>
          {status}
        </p>
      </div>
    </>
  );
}

function DatasetBadges({ datasetKey }) {
  if (!datasetKey) return null;
  return (
    <div className={styles.badges}>
      <div className={styles.gbifBadge}>
        <iframe
          title="GBIF citation count"
          src={`https://www.gbif.org/api/widgets/literature/button?gbifDatasetKey=${encodeURIComponent(datasetKey)}`}
          scrolling="no"
          frameBorder="0"
          tabIndex={-1}
          aria-hidden="true"
          style={{ width: 140, height: 24, border: 0 }}
        />
        {/* Keep the official chip, but preserve the dataset filter on its link. */}
        <Link
          href={`https://www.gbif.org/resource/search?contentType=literature&gbifDatasetKey=${encodeURIComponent(datasetKey)}`}
          external
        >
          <span className={styles.srOnly}>
            View GBIF citations for this dataset (opens in a new tab)
          </span>
        </Link>
      </div>
      <Link
        href={`https://bionomia.net/dataset/${encodeURIComponent(datasetKey)}`}
        external
      >
        <img
          src={`https://api.bionomia.net/dataset/${encodeURIComponent(datasetKey)}/badge.svg`}
          alt="Bionomia dataset"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </Link>
    </div>
  );
}

function Distribution({ distribution, profileUrl, recordsUrl }) {
  if (!distribution) return null;
  const geo = distribution.type === "geography";
  return (
    <section id={geo ? "geographystats" : "taxonomystats"}>
      <h2>{geo ? "Geographic Distribution" : "Taxonomic Distribution"}</h2>
      <ul>
        {Object.entries(distribution.rows || {}).map(([term, row]) => {
          const country = distribution.country || term;
          const state = distribution.country ? distribution.state || term : "";
          const drill = new URLSearchParams(
            geo
              ? { stat: "geography", country, state }
              : { stat: "taxonomy", family: term },
          );
          const search = new URLSearchParams(
            geo
              ? {
                  reset: "1",
                  usethes: "1",
                  country,
                  state,
                  county:
                    distribution.country && distribution.state ? term : "",
                }
              : {
                  reset: "1",
                  usethes: "1",
                  taxontype: distribution.family ? "2" : "3",
                  taxa: term,
                },
          );
          return (
            <li key={term}>
              {row.hasChild && (!geo || !distribution.state) ? (
                <Link
                  href={`${profileUrl}&${drill}#${geo ? "geographystats" : "taxonomystats"}`}
                >
                  {term}
                </Link>
              ) : (
                term
              )}{" "}
              (
              <Link href={`${recordsUrl}&${search}`}>
                {Number(row.cnt).toLocaleString()} records
              </Link>
              )
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const excludedDescriptionTags = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "link",
  "meta",
];

// Separate curator-authored photos for the details column without changing stored HTML.
function splitDescription(html = "") {
  const document = new DOMParser().parseFromString(html || "", "text/html");
  document
    .querySelectorAll(excludedDescriptionTags.join(","))
    .forEach((node) => node.remove());
  const images = [];
  document.body.querySelectorAll("img").forEach((image) => {
    const src = safeUrl(image.getAttribute("src"));
    const caption = image.closest("figure")?.querySelector("figcaption");
    if (src) {
      images.push({
        src,
        alt: image.getAttribute("alt") || "",
        href: safeUrl(image.closest("a")?.getAttribute("href")),
        caption: caption?.textContent.trim() || "",
      });
      caption?.remove();
    }
    let wrapper = image.parentElement;
    image.remove();
    // Remove image-only links and layout wrappers, retaining any surrounding text.
    while (
      wrapper &&
      ["A", "P", "DIV", "SPAN", "FIGURE", "PICTURE"].includes(
        wrapper.tagName,
      ) &&
      !wrapper.textContent.trim() &&
      !wrapper.querySelector(
        "img, video, audio, svg, iframe, object, embed, table, hr",
      )
    ) {
      const parent = wrapper.parentElement;
      wrapper.remove();
      wrapper = parent;
    }
  });
  return { html: document.body.innerHTML, images };
}

// Description HTML is curator-authored rich text. Keep its formatting while
// excluding executable content and unsafe URLs.
function Description({ html }) {
  const options = {
    replace: (node) => {
      if (excludedDescriptionTags.includes(node.name)) return <></>;
      if (node.attribs)
        Object.keys(node.attribs).forEach((key) => {
          if (
            /^on/i.test(key) ||
            ["srcdoc", "srcset"].includes(key) ||
            (["href", "src", "xlink:href"].includes(key) &&
              !safeUrl(node.attribs[key]))
          )
            delete node.attribs[key];
        });
    },
  };
  return (
    <div className={styles.description}>
      {html ? (
        parse(html, options)
      ) : (
        <p>No description is available for this sample type.</p>
      )}
    </div>
  );
}

export function CollectionProfile({
  profile,
  clientRoot = "",
  language = "en",
}) {
  const description = useMemo(
    () => splitDescription(profile.description),
    [profile.description],
  );
  const navigationHost = document.getElementById("biorepo-profile-navigation");
  const profileUrl = (id) =>
    `${clientRoot}/collections/misc/neoncollprofiles.php?collid=${id}`;
  const bulkSampleCollections = profile.bulkSampleCollections || [];
  const relatedSamples = Object.entries(profile.related || {}).sort(
    ([, firstTitle], [, secondTitle]) =>
      firstTitle.localeCompare(secondTitle, "en", { sensitivity: "base" }),
  );
  const resourceTitle = (resource) =>
    typeof resource.title === "string"
      ? resource.title
      : resource.title?.[language] || resource.title?.en || dataProductCode(resource.url) || "Linked resource";
  const resources = useMemo(() => profile.resources || [], [profile.resources]);
  const dataProducts = [...new Map(
    resources
      .filter((resource) => dataProductCode(resource.url) && safeUrl(resource.url))
      .map((resource) => [dataProductCode(resource.url), resource]),
  ).values()].sort((first, second) =>
    resourceTitle(first).localeCompare(resourceTitle(second), "en", { sensitivity: "base" }),
  );
  const { downloads, external: externalResources } = partitionResources([
    ...resources
      .filter((resource) => !dataProductCode(resource.url))
      .map((resource) => ({ ...resource, title: resourceTitle(resource) })),
    ...(profile.additionalResources || []),
  ]);
  const sections = [
    ["about", "About"],
    ["citation", "Citation"],
    ["data-downloads", "Data Downloads"],
    ...(relatedSamples.length
      ? [["related-sample-types", "Related Sample Types"]]
      : []),
    ["related-data-products", "Related Data Products"],
    ["documentation", "Documentation"],
    ["availability", "Availability"],
    ...(externalResources.length
      ? [["externally-hosted-data", "Externally Hosted Data"]]
      : []),
  ];
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.slice(1);
    return sections.some(([id]) => id === hash) ? hash : "about";
  });
  // Keep the selected link in sync with direct anchors and browser back/forward.
  const sectionIds = sections.map(([id]) => id).join(",");
  useEffect(() => {
    const syncSection = () => {
      const hash = window.location.hash.slice(1);
      setActiveSection(sectionIds.split(",").includes(hash) ? hash : "about");
    };
    window.addEventListener("hashchange", syncSection);
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView?.();
    return () => window.removeEventListener("hashchange", syncSection);
  }, [sectionIds]);
  const navigation = (
    <aside className={styles.sidebar}>
      <strong className={styles.sidebarTitle}>{profile.title}</strong>
      {profile.code && <p className={styles.code}>{profile.code}</p>}
      <nav className={styles.sidebarNav} aria-label="Sample type sections">
        <ul className={styles.sidebarItems}>
          {sections.map(([id, label]) => (
            <li key={id}>
              <a
                className={styles.sidebarLink}
                href={`#${id}`}
                aria-current={activeSection === id ? "location" : undefined}
                onClick={() => setActiveSection(id)}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarContact}>
        <p className={styles.sidebarContactText}>
          Have questions about samples?
        </p>
        <Link
          external
          href="https://www.neonscience.org/about/contact-neon-biorepository"
        >
          Contact the Biorepository
        </Link>
      </div>
    </aside>
  );
  if (!profile.id)
    return (
      <div className={`${styles.profile} ${styles.directory}`}>
        <h1>Sample Types</h1>
        {(profile.collections || []).map((collection) => (
          <div className={styles.resource} key={collection.id}>
            <Link href={profileUrl(collection.id)}>{collection.title}</Link>
            <span>{collection.code}</span>
          </div>
        ))}
        {!profile.collections?.length && <p>No sample types were found.</p>}
      </div>
    );
  return (
    <div className={styles.profile}>
      {navigationHost ? createPortal(navigation, navigationHost) : navigation}
      <div className={styles.main}>
        <header className={styles.header}>
          <h1>{profile.title}</h1>
          <div className={styles.headerControls}>
            <DatasetBadges datasetKey={profile.datasetKey} />
            <div className={styles.actions}>
              <Button
                variant="contained"
                href={`${clientRoot}/collections/list.php?db=${profile.id}`}
                endIcon={<FormatListBulletedIcon />}
              >
                Browse records
              </Button>
              <Button
                variant="contained"
                href={`${clientRoot}/neon/search/index.php?db=${profile.id}`}
                endIcon={<SearchIcon />}
              >
                Search this sample type
              </Button>
            </div>
          </div>
        </header>
        {!!profile.identificationCollectionId && (
          <SampleTypeNotice
            id="identification-notice-title"
            title="Taxonomic Identifications"
            lead="Looking for a specific taxon?"
            message="Taxonomic identifications derived from these samples are available through a related sample type."
            links={[{ href: profileUrl(profile.identificationCollectionId), label: "View related sample type" }]}
          />
        )}
        {bulkSampleCollections.length > 0 && (
          <SampleTypeNotice
            id="bulk-samples-notice-title"
            title="Bulk Samples"
            lead="Looking for bulk samples?"
            message={`Bulk samples associated with these taxonomic identifications are available through ${bulkSampleCollections.length === 1 ? "a related sample type" : "related sample types"}.`}
            links={bulkSampleCollections.map((collection) => ({
              href: profileUrl(collection.id),
              label: bulkSampleCollections.length === 1 ? "View related sample type" : `View related sample type: ${collection.title}`,
            }))}
          />
        )}
        <section
          id="about"
          className={styles.about}
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading">About</h2>
          <CollectionDetails
            id={profile.id}
            code={profile.code}
            collectionName={profile.collectionName || profile.title}
            clientRoot={clientRoot}
            siteCodes={profile.siteCodes}
            images={description.images}
            title={profile.title}
          >
            <Description html={description.html} />
          </CollectionDetails>
          <CollectionStatistics
            stats={profile.stats}
            extraStats={profile.extraStats}
          />
        </section>
        <section id="citation">
          <h2>Citation</h2>
          <Citation profile={profile} clientRoot={clientRoot} />
        </section>
        <section id="data-downloads" aria-labelledby="data-downloads-heading">
          <h2 id="data-downloads-heading">Data Downloads</h2>
          <DataDownloads resources={downloads} profile={profile} clientRoot={clientRoot} />
        </section>
        {!!relatedSamples.length && (
          <section id="related-sample-types" aria-labelledby="related-sample-types-heading">
            <h2 id="related-sample-types-heading">Related Sample Types</h2>
            <ul className={styles.relatedList}>
              {relatedSamples.map(([id, title]) => (
                <li key={id} className={styles.relatedItem}>
                  <FontAwesomeIcon icon={faFlask} className={styles.relatedIcon} aria-hidden="true" />
                  <div className={styles.relatedLabel}>
                    <h3>{title}</h3>
                    {profile.relatedCodes?.[id] && (
                      <p className={styles.relatedCode}>{profile.relatedCodes[id]}</p>
                    )}
                  </div>
                  <Button
                    className={styles.relatedAction}
                    variant="outlined"
                    endIcon={<ChevronRightIcon />}
                    href={profileUrl(id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore
                    <span className={styles.srOnly}> {title} (opens in a new tab)</span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section id="related-data-products" aria-labelledby="related-data-products-heading">
          <h2 id="related-data-products-heading">Related Data Products</h2>
          {dataProducts.length ? (
            <ul className={styles.relatedList}>
              {dataProducts.map((resource) => (
                <li key={dataProductCode(resource.url)} className={styles.relatedItem}>
                  <LinkIcon className={styles.relatedIcon} aria-hidden="true" />
                  <div className={styles.relatedLabel}>
                    <h3>{resourceTitle(resource)}</h3>
                    <p className={styles.relatedCode}>{dataProductCode(resource.url)}</p>
                  </div>
                  <Button
                    className={styles.relatedAction}
                    variant="outlined"
                    endIcon={<ChevronRightIcon />}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore
                    <span className={styles.srOnly}> {resourceTitle(resource)} (opens in a new tab)</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No related data products are currently available.</p>
          )}
        </section>
        <section id="documentation" aria-labelledby="documentation-heading">
          <h2 id="documentation-heading">Documentation</h2>
          <Documentation resources={resources} />
        </section>
        <section id="availability">
          <h2>Availability</h2>
          {profile.siteCodes?.length ? (
            <DataProductAvailability
              siteCodes={profile.siteCodes}
              view="sites"
            />
          ) : (
            <p>No site availability information is currently available.</p>
          )}
        </section>
        {!!externalResources.length && (
          <section
            id="externally-hosted-data"
            aria-labelledby="external-data-heading"
            className={styles.externalData}
          >
            <h2 id="external-data-heading">Externally Hosted Data</h2>
            <InfoMessageCard
              title={externalResources.length === 1 ? "External Host" : "External Hosts"}
              messageContent={(
                <>
                  <hr className={styles.externalDivider} />
                  <p className={styles.externalLead}>
                    Data for this sample type are available in other formats from{" "}
                    {externalResources.map((resource, index) => (
                      <React.Fragment key={resource.url}>
                        {index > 0 && (index === externalResources.length - 1 ? " and " : ", ")}
                        <Link
                          href={resource.title === "GBIF dataset" ? "https://www.gbif.org/" : resource.url}
                          external
                        >
                          {{
                            "GBIF dataset": "GBIF (Global Biodiversity Information Facility)",
                            "EDI dataset": "Environmental Data Initiative (EDI)",
                            "iDigBio dataset": "iDigBio",
                          }[resource.title] || resource.title}
                        </Link>
                      </React.Fragment>
                    ))}.
                  </p>
                  <ul className={styles.externalLinks}>
                    {externalResources.map((resource) => (
                      <li key={resource.url}>
                        <Link href={resource.url} external>
                          {resource.title === "GBIF dataset"
                            ? profile.collectionName || profile.title
                            : resource.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            />
          </section>
        )}
        <Distribution
          distribution={profile.distribution}
          profileUrl={profileUrl(profile.id)}
          recordsUrl={`${clientRoot}/collections/list.php?db=${profile.id}`}
        />
      </div>
    </div>
  );
}

export default function BiorepoCollectionPageContent() {
  try {
    const data = JSON.parse(
      document.getElementById("neon-collection-profile-data")?.textContent ||
        "null",
    );
    if (!data)
      return (
        <p role="alert">
          The sample type profile is unavailable. Please reload this page.
        </p>
      );
    return <CollectionProfile {...data} />;
  } catch {
    return (
      <p role="alert">
        The sample type profile could not be loaded. Please reload this page.
      </p>
    );
  }
}
