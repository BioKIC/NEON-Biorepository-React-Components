export function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value, "https://biorepo.neonscience.org/");
    return ["https:", "http:"].includes(url.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function statistics(stats = {}, extra = {}) {
  const count = (value) => Number(value || 0).toLocaleString();
  const percent = (value) =>
    Number(stats.recordcnt) > 0
      ? ` (${Number(((100 * Number(value)) / Number(stats.recordcnt)).toFixed(2))}%)`
      : "";
  const rows = [
    ["Specimen records", count(stats.recordcnt)],
    [
      "Georeferenced records",
      count(stats.georefcnt) + percent(stats.georefcnt),
    ],
  ];
  if (extra.imgcnt) {
    const parts = String(extra.imgcnt).split(":");
    const records = parts.length > 1 ? parts[1] : parts[0];
    if (Number(records) > 0) rows.push(["Records with images", count(records) + percent(records)]);
    if (parts.length > 1 && Number(parts[0]) > 0) rows.push(["Images", count(parts[0])]);
  }
  if (Number(extra.sequencedRecordCount) > 0) {
    rows.push(["Sequenced records", count(extra.sequencedRecordCount) + percent(extra.sequencedRecordCount)]);
  }
  [
    ["Families", "familycnt"],
    ["Genera", "genuscnt"],
    ["Species", "speciescnt"],
  ].forEach(([label, key]) => {
    if (Number(stats[key])) rows.push([label, count(stats[key])]);
  });
  [
    ["Total taxa (including subspecies and varieties)", "TotalTaxaCount"],
    ["Identified to species", "SpecimensCountID"],
    ["Research projects", "researchProjectCount"],
    ["Research project specimens", "researchSpecimenCount"],
    ["Publications", "publicationCount"],
    ["Publication specimens", "publicationSpecimenCount"],
  ].forEach(([label, key]) => {
    if (Number(extra[key])) rows.push([label, count(extra[key])]);
  });
  return rows;
}

export function citationFile(citation, format, description = "") {
  const escape = (value) =>
    String(value ?? "").replace(
      /[\\{}&%$#_~^]/g,
      (character) =>
        ({
          "\\": "\\textbackslash{}",
          "{": "\\{",
          "}": "\\}",
          "&": "\\&",
          "%": "\\%",
          $: "\\$",
          "#": "\\#",
          _: "\\_",
          "~": "\\textasciitilde{}",
          "^": "\\textasciicircum{}",
        })[character],
    );
  const line = (value) => String(value ?? "").replace(/[\r\n]+/g, " ");
  if (format === "bib") {
    const key =
      citation.collectionCode.replace(/[^a-zA-Z0-9._-]/g, "") ||
      `NEON${citation.collectionId}`;
    return `@misc{${key}/provisional,
    doi = {},
    url = {${escape(citation.url)}},
    author = {{${escape(citation.author)}}},
    language = {en},
    title = {{${escape(citation.title)}}},
    publisher = {National Ecological Observatory Network (NEON)},
    note = {${escape(citation.bibNote ?? citation.note)}},
    urldate = {${citation.accessDate}},
    copyright = {${escape(`${citation.license} (${citation.licenseUrl})`)}}
}`;
  }
  return [
    `TY  - DATA`,
    `T1  - ${line(citation.title)}`,
    `AU  - ${line(citation.author)}`,
    "DO  -",
    `UR  - ${line(citation.url)}`,
    "PB  - NEON (National Ecological Observatory Network) Biorepository",
    `Y2  - ${citation.accessDate}`,
    "LA  - en",
    `N1  - ${line(citation.note)}`,
    ...(description ? [`AB  - ${line(description)}`] : []),
    "ER  -",
    "",
  ].join("\r\n");
}
