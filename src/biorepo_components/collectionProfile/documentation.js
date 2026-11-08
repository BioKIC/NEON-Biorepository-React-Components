// Add exclusions here as more document categories are identified. All other
// documents attached to the related data products remain available.
export const DOCUMENTATION_EXCLUSIONS = [
  /\bneon\b.*\buser\s*guides?\b/i,
  /\bquick\s*start\s*guides?\b|\bqsg\b/i,
  /\balgorithm\s+theoretical\s+basis\s+documents?\b|\batbd\b/i,
];

export function dataProductCode(url) {
  return typeof url === "string"
    ? url.match(/\bDP\d\.\d{5}\.\d{3}\b/i)?.[0].toUpperCase()
    : undefined;
}

export function selectDocumentation(specs) {
  const documents = specs.filter((spec) => {
    if (typeof spec?.specNumber !== "string" || !spec.specNumber.trim())
      return false;
    const title = `${spec.specDescription || ""} ${spec.specNumber}`
      .replace(/[_-]/g, " ");
    return !DOCUMENTATION_EXCLUSIONS.some((pattern) => pattern.test(title));
  });
  return [...new Map(documents.map((spec) => [spec.specNumber, spec])).values()]
    .sort((first, second) =>
      (first.specDescription || first.specNumber).localeCompare(
        second.specDescription || second.specNumber,
        "en",
        { sensitivity: "base" },
      ),
    );
}
