import React, { useEffect, useMemo, useState } from "react";
import parse from "html-react-parser";
import { createPortal } from "react-dom";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CopyIcon from "@mui/icons-material/Assignment";
import DownloadIcon from "@mui/icons-material/SaveAlt";
import SearchIcon from "@mui/icons-material/Search";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DocumentListItem from "../lib_components/components/Documents/DocumentListItem";
import DataProductAvailability from "../lib_components/components/DataProductAvailability/DataProductAvailability";
import { citationFile, safeUrl } from "./collectionProfile/profile";
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

function Resource({ title, description, url, action = "Explore" }) {
  return (
    <div className={styles.resource}>
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <Link href={url} button external>
        {action}
        <span className={styles.srOnly}> {title} (opens in a new tab)</span>
      </Link>
    </div>
  );
}

function Protocols({ resources }) {
  const [result, setResult] = useState({
    specs: [],
    loading: true,
    failed: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    const ids = [
      ...new Set(
        resources
          .map((item) => item.url.match(/DP\d\.\d{5}\.\d{3}/)?.[0])
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
          if (!response.ok) throw new Error("Unable to retrieve protocols");
          return response.json();
        }),
      );
      if (controller.signal.aborted) return;
      const specs = responses.flatMap((response) =>
        response.status === "fulfilled"
          ? (response.value.data?.specs || []).filter((spec) =>
              spec.specDescription?.includes("Protocol and Procedure"),
            )
          : [],
      );
      setResult({
        specs: [
          ...new Map(specs.map((spec) => [spec.specNumber, spec])).values(),
        ],
        loading: false,
        failed: responses.some((response) => response.status === "rejected"),
      });
    };
    load();
    return () => controller.abort();
  }, [resources]);
  return (
    <>
      {result.loading && <p role="status">Loading protocols…</p>}
      {result.failed && (
        <p role="status">
          Some protocols could not be loaded. Use the data product links above
          to view their documentation.
        </p>
      )}
      {result.specs.map((spec) => (
        <DocumentListItem
          key={spec.specNumber}
          document={{
            name: spec.specNumber,
            type: spec.specType || "application/pdf",
            size: spec.specSize || 0,
            description: spec.specDescription,
          }}
          containerComponent="div"
          enableDownloadButton
        />
      ))}
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
        Please use the citation below when referencing this sample type. This
        citation is required for both data-only and physical sample use.
        Publications involving physical samples must also include the additional
        specimen citation requirements. See{" "}
        <Link href={`${clientRoot}/misc/cite.php`}>
          Acknowledging and Citing the Biorepository
        </Link>
        {" "}for full guidance.
      </p>
      <div className={styles.citation}>
        <p className={styles.citationText}>{profile.citationText}</p>
        <div className={styles.citationActions}>
          <Tooltip
            placement="bottom-start"
            title="Click to copy the above plain text citation to the clipboard"
            describeChild
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
  const sections = [
    ["about", "About"],
    ["citation", "Citation"],
    ...(Object.keys(profile.related || {}).length
      ? [["related", "Related Sample Types"]]
      : []),
    ["documentation", "Data Products and Protocols"],
    ["availability", "Sample Availability"],
    ["resources", "Additional Resources"],
    ["contact", "Contact"],
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
          <aside
            className={styles.notice}
            role="note"
            aria-labelledby="identification-notice-title"
          >
            <div className={styles.noticeHeader}>
              <LocalOfferIcon
                className={styles.noticeIcon}
                aria-hidden="true"
              />
              <h2
                id="identification-notice-title"
                className={styles.noticeTitle}
              >
                Taxonomic Identifications
              </h2>
              <InfoOutlinedIcon
                className={styles.noticeInfo}
                aria-hidden="true"
              />
            </div>
            <div className={styles.noticeBody}>
              <div className={styles.noticeMessage}>
                <p className={styles.noticeLead}>
                  Looking for a specific taxon?
                </p>
                <p>
                  Taxonomic identifications derived from these samples are
                  available through a related sample type.
                </p>
              </div>
              <div className={styles.noticeActions}>
                <Link
                  button
                  href={profileUrl(profile.identificationCollectionId)}
                >
                  Browse identifications
                  <ChevronRightIcon fontSize="small" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
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
        {!!Object.keys(profile.related || {}).length && (
          <section id="related">
            <h2>Related Sample Types</h2>
            {Object.entries(profile.related).map(([id, title]) => (
              <Resource key={id} title={title} url={profileUrl(id)} />
            ))}
          </section>
        )}
        <section id="documentation">
          <h2>Data Products and Protocols</h2>
          {profile.resources.map((resource, index) => (
            <Resource
              key={`${resource.url}-${index}`}
              title={
                resource.title?.[language] ||
                resource.title?.en ||
                "Linked resource"
              }
              description={resource.url.split("/").pop()}
              url={resource.url}
            />
          ))}
          <Protocols resources={profile.resources} />
        </section>
        <section id="availability">
          <h2>Sample Availability</h2>
          {profile.siteCodes?.length ? (
            <DataProductAvailability
              siteCodes={profile.siteCodes}
              view="sites"
            />
          ) : (
            <p>No site availability information is currently available.</p>
          )}
        </section>
        <section id="resources">
          <h2>Additional Resources</h2>
          {profile.additionalResources.map((resource) => (
            <Resource key={resource.url} {...resource} />
          ))}
        </section>
        <section id="contact">
          <h2>Contact</h2>
          {profile.contacts
            .filter((contact) => contact && typeof contact === "object")
            .map((contact, index) => (
              <p key={index}>
                {contact.role ? `${contact.role}: ` : ""}
                {[contact.firstName, contact.lastName]
                  .filter(Boolean)
                  .join(" ")}
                {contact.orcid && (
                  <>
                    {" "}
                    (
                    <Link href={`https://orcid.org/${contact.orcid}`} external>
                      ORCID: {contact.orcid}
                    </Link>
                    )
                  </>
                )}
              </p>
            ))}
          <Link
            button
            external
            href="https://www.neonscience.org/about/contact-neon-biorepository"
          >
            Contact the Biorepository
          </Link>
        </section>
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
