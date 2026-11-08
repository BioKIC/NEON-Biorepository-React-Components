import React, { useEffect, useState } from "react";
import SampleTypeChip from "../SampleTypeChip";
import styles from "./Profile.module.css";

export function availableDates(siteCodes = []) {
  const formatMonth = (month) =>
    new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  const months = siteCodes
    .flatMap((site) =>
      Array.isArray(site.availableMonths) ? site.availableMonths : [],
    )
    .filter(
      (month) =>
        typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
    )
    .sort();
  return months.length
    ? `${formatMonth(months[0])} – ${formatMonth(months[months.length - 1])}`
    : "No dated site records";
}

const terms = (values) =>
  Array.isArray(values)
    ? [
        ...new Set(
          values
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      ]
    : [];

export default function CollectionDetails({
  id,
  code = "",
  clientRoot = "",
  siteCodes = [],
  images = [],
  title = "Sample type",
  children,
}) {
  const [result, setResult] = useState({
    id,
    loading: true,
    item: null,
    error: false,
  });
  const [keywords, setKeywords] = useState({ id, values: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult({ id, loading: true, item: null, error: false });
    setKeywords({ id, values: [] });
    async function load() {
      try {
        // Reuse the public cached catalog rather than querying or changing backend classes.
        const response = await fetch(
          `${clientRoot}/neon-react/biorepo_lib/sample-catalog.php`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Unable to load sample details");
        const data = await response.json();
        if (!Array.isArray(data.items))
          throw new Error("Invalid sample catalog");
        const item =
          data.items.find((entry) => Number(entry.id) === Number(id)) || null;
        if (!controller.signal.aborted)
          setResult({ id, loading: false, item, error: false });
      } catch {
        if (!controller.signal.aborted)
          setResult({ id, loading: false, item: null, error: true });
      }
    }
    async function loadKeywords() {
      try {
        // Keep editable terms in the portal so updates do not require a React rebuild.
        const response = await fetch(
          `${clientRoot}/neon-react/biorepo_lib/keywords.json`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Unable to load keywords");
        const data = await response.json();
        if (!controller.signal.aborted)
          setKeywords({ id, values: terms(data?.[String(id)]) });
      } catch {
        // Optional keywords must not prevent the rest of the profile from loading.
        if (!controller.signal.aborted) setKeywords({ id, values: [] });
      }
    }
    load();
    loadKeywords();
    return () => controller.abort();
  }, [id, clientRoot, attempt]);
  const item = result.id === id ? result.item : null;
  const loading = result.id !== id || result.loading;
  const keywordTerms = keywords.id === id ? keywords.values : [];
  const identifier = code || item?.collectionCode;
  const rows = item
    ? [
        ["Protocol", terms(item.protocols).join("; ")],
        ["Preservation", terms(item.preservation).join(", ")],
      ]
    : [];
  // Match the dates shown on the catalog card; use profile coverage if the snapshot is unavailable.
  const coverage =
    item && Array.isArray(item.siteCodes) ? item.siteCodes : siteCodes;
  return (
    <>
      <div className={styles.aboutLayout}>
        <div className={styles.aboutDescription}>{children}</div>
        <aside className={styles.details} aria-label="Sample type details">
          {identifier && (
            <div className={styles.detail}>
              <h3 className={styles.keywordHeading}>Sample Type ID</h3>
              <SampleTypeChip label={identifier} variant="outlined" />
            </div>
          )}
          {images.length > 0 && (
            <div className={styles.detail}>
              <div
                className={styles.imageGallery}
                role="group"
                aria-label="Sample type images"
              >
                {images.map((image, index) => (
                  <figure
                    className={styles.imageFigure}
                    key={`${image.src}-${index}`}
                  >
                    <a
                      href={image.href || image.src}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={image.src}
                        alt={image.alt || `${title} image ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                      />
                    </a>
                    {image.caption && (
                      <figcaption className={styles.imageCaption}>
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}
          {keywordTerms.length > 0 && (
            <div className={styles.detail}>
              <h3 className={styles.keywordHeading}>Scientific keywords</h3>
              <ul className={styles.keywords}>
                {keywordTerms.map((keyword) => (
                  <li key={keyword} className={styles.keyword}>
                    <SampleTypeChip label={keyword} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      <div
        className={styles.detailsBand}
        role="group"
        aria-label="Preservation and storage details"
      >
        {loading && (
          <p className={styles.detailsStatus} role="status">
            Loading sample details…
          </p>
        )}
        {!loading && result.error && (
          <div role="status">
            <p className={styles.detailsStatus}>
              Sample details could not be loaded.
            </p>
            <button
              className={styles.button}
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry details
            </button>
          </div>
        )}
        {!loading && !result.error && !item && (
          <p className={styles.detailsStatus}>
            Additional details are not available for this sample type.
          </p>
        )}
        <dl className={styles.detailsList}>
          {rows.map(([label, value]) => (
            <div className={styles.detail} key={label}>
              <dt>{label}</dt>
              <dd>
                {typeof value === "string" && value.trim()
                  ? value
                  : "Not specified"}
              </dd>
            </div>
          ))}
          {item && (
            <div className={styles.detail}>
              <dt>Storage &amp; container</dt>
              <dd>
                <span className={styles.storageValue}>
                  {typeof item.storageConditions === "string" &&
                  item.storageConditions.trim()
                    ? item.storageConditions
                    : "Not specified"}
                </span>
                <span className={styles.storageValue}>
                  {typeof item.storageContainer === "string" &&
                  item.storageContainer.trim()
                    ? item.storageContainer
                    : "Not specified"}
                </span>
              </dd>
            </div>
          )}
          <div className={styles.detail}>
            <dt>Available dates</dt>
            <dd>{availableDates(coverage)}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
