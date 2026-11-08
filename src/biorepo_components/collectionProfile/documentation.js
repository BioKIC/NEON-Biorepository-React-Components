// Add exclusions here as more document categories are identified. All other
// documents attached to the related data products remain available.
export const DOCUMENTATION_EXCLUSIONS = [
  /\bneon\b.*\buser\s*guides?\b/i,
  /\bquick\s*start\s*guides?\b|\bqsg\b/i,
  /\balgorithm\s+theoretical\s+basis\s+documents?\b|\batbd\b/i,
];

// Superseded documents whose renamed identifiers do not share a revision family.
const EXCLUDED_DOCUMENT_NUMBERS = new Set([
  "essig_carabidtaxonid_sop2021_rev3",
]);

export function dataProductCode(url) {
  return typeof url === "string"
    ? url.match(/\bDP\d\.\d{5}\.\d{3}\b/i)?.[0].toUpperCase()
    : undefined;
}

function documentRevision(specNumber) {
  const number = specNumber.trim().replace(/\.(?:pdf|docx?|xlsx?|csv|txt|zip)$/i, "");
  const match = number.match(/^(NEON\.DOC\.\d+)v([a-z]+|\d+(?:\.\d+)*)$/i)
    || number.match(/^(.*?)[_. -]+(?:rev(?:ision)?[_. -]*|v)([a-z]+|\d+(?:\.\d+)*)$/i);
  if (!match) return { key: specNumber.trim().toLowerCase(), revision: [] };

  const [, base, version] = match;
  const alphabetic = /^[a-z]+$/i.test(version);
  return {
    // Keep unrelated document numbers separate, even when their titles match.
    key: `${base.toLowerCase()}:${alphabetic ? "letter" : "number"}`,
    revision: alphabetic
      ? [version.length, ...version.toUpperCase().split("").map((letter) => letter.charCodeAt(0))]
      : version.split(".").map(Number),
  };
}

function compareRevisions(first, second) {
  for (let index = 0; index < Math.max(first.length, second.length); index += 1) {
    const difference = (first[index] || 0) - (second[index] || 0);
    if (difference) return difference;
  }
  return 0;
}

export function selectDocumentation(specs) {
  const documents = specs.filter((spec) => {
    if (typeof spec?.specNumber !== "string" || !spec.specNumber.trim())
      return false;
    if (EXCLUDED_DOCUMENT_NUMBERS.has(spec.specNumber.trim().toLowerCase()))
      return false;
    const title = `${spec.specDescription || ""} ${spec.specNumber}`
      .replace(/[_-]/g, " ");
    return !DOCUMENTATION_EXCLUSIONS.some((pattern) => pattern.test(title));
  });
  const latest = new Map();
  for (const spec of documents) {
    const { key, revision } = documentRevision(spec.specNumber);
    const previous = latest.get(key);
    if (!previous || compareRevisions(revision, previous.revision) > 0) {
      latest.set(key, { spec, revision });
    }
  }
  return [...latest.values()].map(({ spec }) => spec)
    .sort((first, second) =>
      (first.specDescription || first.specNumber).localeCompare(
        second.specDescription || second.specNumber,
        "en",
        { sensitivity: "base" },
      ),
    );
}
