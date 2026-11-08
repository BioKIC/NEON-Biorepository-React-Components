import React from "react";
import { statistics } from "./profile";
import styles from "./Profile.module.css";

const groups = [
  [
    "Records",
    [
      "Specimen records",
      "Georeferenced records",
      "Records with images",
      "Images",
      "Sequenced records",
    ],
  ],
  [
    "Taxonomy",
    [
      "Families",
      "Genera",
      "Species",
      "Total taxa (including subspecies and varieties)",
      "Identified to species",
    ],
  ],
  [
    "Research",
    [
      "Research projects",
      "Research project specimens",
      "Publications",
      "Publication specimens",
    ],
  ],
];

export default function CollectionStatistics({ stats, extraStats }) {
  const values = new Map(statistics(stats, extraStats));
  return (
    <section
      id="statistics"
      className={styles.statistics}
      aria-labelledby="statistics-heading"
    >
      <h3 id="statistics-heading">Collection Statistics</h3>
      <div className={styles.statGroups}>
        {groups.map(([title, labels]) => {
          const rows = labels.filter((label) => values.has(label));
          if (!rows.length) return null;
          return (
            <div className={styles.statGroup} key={title}>
              <h4>{title}</h4>
              <dl>
                {rows.map((label) => (
                  <div className={styles.statRow} key={label}>
                    <dt>
                      {label.startsWith("Total taxa") ? (
                        <>
                          Total taxa
                          <small>Includes subspecies and varieties</small>
                        </>
                      ) : label === "Research projects" ? (
                        <>
                          Research projects
                          <small>Ongoing and completed studies supported by the Biorepository</small>
                        </>
                      ) : label === "Publications" ? (
                        <>
                          Publications
                          <small>Published works linked to specimens in this sample type</small>
                        </>
                      ) : (
                        label
                      )}
                    </dt>
                    <dd>{values.get(label)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
