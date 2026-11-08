import React, { useEffect, useState } from "react";
import styles from "./Profile.module.css";

export function availableDates(siteCodes = []) {
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
    ? `${months[0]} through ${months[months.length - 1]}`
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
        ["Preservation", terms(item.preservation).join(", ")],
        ["Protocol", terms(item.protocols).join("; ")],
        ["Storage", item.storageConditions],
        ["Container", item.storageContainer],
      ]
    : [];
  // Match the dates shown on the catalog card; use profile coverage if the snapshot is unavailable.
  const coverage =
    item && Array.isArray(item.siteCodes) ? item.siteCodes : siteCodes;
  return (
    <aside className={styles.details} aria-label="Sample type details">
      {identifier && (
        <div className={styles.detail}>
          <h3 className={styles.keywordHeading}>Sample Type ID</h3>
          <span className={styles.identifierChip}>{identifier}</span>
        </div>
      )}
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
        <div className={styles.detail}>
          <dt>Available Dates</dt>
          <dd>{availableDates(coverage)}</dd>
        </div>
      </dl>
      {keywordTerms.length > 0 && (
        <div className={styles.detail}>
          <h3 className={styles.keywordHeading}>Scientific Keywords</h3>
          <ul className={styles.keywords}>
            {keywordTerms.map((keyword) => (
              <li key={keyword} className={styles.keyword}>
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
