import React, { useEffect, useState } from "react";
import parse from "html-react-parser";
import { createPortal } from "react-dom";
import DocumentListItem from "../lib_components/components/Documents/DocumentListItem";
import DataProductAvailability from "../lib_components/components/DataProductAvailability/DataProductAvailability";
import { citationFile, safeUrl, statistics } from "./collectionProfile/profile";
import styles from "./collectionProfile/Profile.module.css";

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
      <p>
        Use this citation for both data and physical sample use. Publications
        using physical samples must also meet the specimen citation requirements
        in{" "}
        <Link href={`${clientRoot}/misc/cite.php`}>
          Acknowledging and Citing the Biorepository
        </Link>
        .
      </p>
      <div className={styles.citation}>
        <p>{profile.citationText}</p>
        <div className={styles.actions}>
          <button type="button" onClick={copy}>
            Copy citation
          </button>
          <button type="button" onClick={() => download("bib")}>
            Download BibTeX
          </button>
          <button type="button" onClick={() => download("ris")}>
            Download RIS
          </button>
        </div>
        <p role="status" className={styles.status}>
          {status}
        </p>
      </div>
    </>
  );
}

function DatasetBadges({ datasetKey }) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!datasetKey) return undefined;
    const controller = new AbortController();
    fetch(
      `https://api.gbif.org/v1/literature/search?gbifDatasetKey=${encodeURIComponent(datasetKey)}&limit=0`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setCount(data.count))
      .catch(() => {});
    return () => controller.abort();
  }, [datasetKey]);
  if (!datasetKey) return null;
  return (
    <div className={styles.badges}>
      <Link
        href={`https://www.gbif.org/resource/search?contentType=literature&gbifDatasetKey=${encodeURIComponent(datasetKey)}`}
        external
      >
        GBIF citations
        {count !== null ? `: ${Number(count).toLocaleString()}` : ""}
      </Link>
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
      <h2>{geo ? "Geographic distribution" : "Taxonomic distribution"}</h2>
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

// Description HTML is curator-authored rich text. Parse it into React, retaining
// formatting and images while excluding executable content and unsafe URLs.
function Description({ html }) {
  const options = {
    replace: (node) => {
      if (
        [
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
        ].includes(node.name)
      )
        return <></>;
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
  const navigationHost = document.getElementById("biorepo-profile-navigation");
  const profileUrl = (id) =>
    `${clientRoot}/collections/misc/neoncollprofiles.php?collid=${id}`;
  const sections = [
    ["about", "About"],
    ["statistics", "Statistics"],
    ["citation", "Citation"],
    ...(Object.keys(profile.related || {}).length
      ? [["related", "Related sample types"]]
      : []),
    ["documentation", "Data products and protocols"],
    ["availability", "Sample availability"],
    ["resources", "Additional resources"],
    ["contact", "Contact"],
  ];
  const [activeSection, setActiveSection] = useState(() =>
    sections.some(([id]) => `#${id}` === window.location.hash)
      ? window.location.hash.slice(1)
      : "about",
  );
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
        <h1>Sample types</h1>
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
          <p className={styles.eyebrow}>NEON Biorepository · Sample type</p>
          <h1>{profile.title}</h1>
          <div className={styles.actions}>
            <Link
              button
              href={`${clientRoot}/collections/list.php?db=${profile.id}`}
            >
              Browse records
            </Link>
            <Link
              button
              href={`${clientRoot}/neon/search/index.php?db=${profile.id}`}
            >
              Search this sample type
            </Link>
          </div>
          <DatasetBadges datasetKey={profile.datasetKey} />
        </header>
        <section id="about">
          <h2>About</h2>
          {!!profile.identificationCollectionId && (
            <div className={styles.notice}>
              <strong>Looking for a specific taxon?</strong>
              <p>
                Taxonomic identifications derived from these samples are
                available through a related sample type.
              </p>
              <Link href={profileUrl(profile.identificationCollectionId)}>
                Browse identifications
              </Link>
            </div>
          )}
          <Description html={profile.description} />
        </section>
        <section id="statistics">
          <h2>Sample type statistics</h2>
          <dl className={styles.stats}>
            {statistics(profile.stats, profile.extraStats).map(
              ([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ),
            )}
          </dl>
        </section>
        <section id="citation">
          <h2>Citation</h2>
          <Citation profile={profile} clientRoot={clientRoot} />
        </section>
        {!!Object.keys(profile.related || {}).length && (
          <section id="related">
            <h2>Related sample types</h2>
            {Object.entries(profile.related).map(([id, title]) => (
              <Resource key={id} title={title} url={profileUrl(id)} />
            ))}
          </section>
        )}
        <section id="documentation">
          <h2>Data products and protocols</h2>
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
          <h2>Sample availability</h2>
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
          <h2>Additional resources</h2>
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
