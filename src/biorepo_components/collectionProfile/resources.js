import { safeUrl } from "./profile";

export function partitionResources(resources) {
  const downloads = new Map();
  const external = new Map();
  for (const resource of resources) {
    if (!safeUrl(resource?.url)) continue;
    let kind = resource.kind;
    // Also accept profiles rendered before PHP supplied explicit resource kinds.
    if (!kind) {
      if (resource.title === "Darwin Core Archive") kind = "dwca";
      else if (/\/emlhandler\.php(?:\?|$)/i.test(resource.url)) kind = "eml";
    }
    if (kind === "dwca" || kind === "eml") {
      downloads.set(kind, { ...resource, kind });
    } else {
      external.set(resource.url, resource);
    }
  }
  return {
    downloads: [downloads.get("dwca"), downloads.get("eml")].filter(Boolean),
    external: [...external.values()],
  };
}

export function archiveFilename(url) {
  try {
    const filename = new URL(url, "https://biorepo.neonscience.org/")
      .pathname.split("/").pop();
    return decodeURIComponent(filename);
  } catch {
    return "";
  }
}
