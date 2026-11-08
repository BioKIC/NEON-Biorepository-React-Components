import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import { CollectionProfile } from "../BiorepoCollectionPageContent";
import DocumentListItem from "../../lib_components/components/Documents/DocumentListItem";
import { selectDocumentation } from "../collectionProfile/documentation";
import { archiveFilename, partitionResources } from "../collectionProfile/resources";
import {
  citationFile,
  statistics,
  safeUrl,
} from "../collectionProfile/profile";
jest.mock("../../lib_components/components/Documents/DocumentListItem", () => ({
  __esModule: true,
  default: jest.fn(({ document }) => <div>{document.name}</div>),
}));
jest.mock(
  "../../lib_components/components/DataProductAvailability/DataProductAvailability",
  () => ({
    __esModule: true,
    default: ({ siteCodes }) => (
      <div data-testid="availability">{JSON.stringify(siteCodes)}</div>
    ),
  }),
);
const citation = {
  title: "Ticks & nymphs",
  collectionCode: "TICKS",
  collectionId: 7,
  author: "NEON",
  url: "https://example.org/7",
  note: "Use & archive",
  accessDate: "2026-11-08",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
};
const profile = {
  id: 7,
  title: "Ticks",
  collectionName: "NEON Biorepository Tick Collection",
  code: "TICKS",
  description:
    '<p>Description</p><img src="/tick.jpg" alt="Tick"/><script>alert(1)</script><a href="javascript:alert(1)">unsafe</a>',
  identificationCollectionId: 8,
  stats: { recordcnt: 100, georefcnt: 20 },
  extraStats: {},
  citation,
  citationText: "NEON. Ticks.",
  related: { 9: "Tick extracts" },
  resources: [],
  additionalResources: [{ kind: "eml", title: "Collection metadata", url: "../datasets/emlhandler.php?collid=7", action: "View" }],
  contacts: [],
  siteCodes: [{ siteCode: "ABBY", availableMonths: ["2024-01"] }],
};
beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
});
afterEach(cleanup);
test("header embeds the GBIF count chip for the current dataset before its actions", async () => {
  const { rerender } = render(
    <CollectionProfile
      profile={{ ...profile, datasetKey: "dataset-one" }}
      clientRoot="/portal"
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const header = screen.getByRole("heading", { name: "Ticks", level: 1 })
    .closest("header");
  const widget = within(header).getByTitle("GBIF citation count");
  expect(widget.tagName).toBe("IFRAME");
  expect(widget.getAttribute("src")).toBe(
    "https://www.gbif.org/api/widgets/literature/button?gbifDatasetKey=dataset-one",
  );
  const citationLink = within(header).getByRole("link", {
    name: "View GBIF citations for this dataset (opens in a new tab)",
  });
  expect(citationLink.getAttribute("href")).toBe(
    "https://www.gbif.org/resource/search?contentType=literature&gbifDatasetKey=dataset-one",
  );
  expect(citationLink.getAttribute("target")).toBe("_blank");
  expect(citationLink.getAttribute("rel")).toBe("noopener noreferrer");
  expect(widget.parentElement).toBe(citationLink.parentElement);
  expect(widget.getAttribute("tabindex")).toBe("-1");
  expect(widget.getAttribute("aria-hidden")).toBe("true");
  expect(header.firstElementChild.nextElementSibling.firstElementChild).toBe(
    widget.parentElement.parentElement,
  );
  const browse = within(header).getByRole("link", { name: "Browse records" });
  const search = within(header).getByRole("link", {
    name: "Search this sample type",
  });
  expect(widget.parentElement.parentElement.nextElementSibling).toBe(browse.parentElement);
  expect(search.getAttribute("href")).toBe("/portal/neon/search/index.php?db=7");
  for (const action of [browse, search]) {
    expect(action.classList.contains("MuiButton-contained")).toBe(true);
  }
  expect(within(header).getByAltText("Bionomia dataset").getAttribute("src"))
    .toBe("https://api.bionomia.net/dataset/dataset-one/badge.svg");
  expect(global.fetch.mock.calls.some(([url]) => url.includes("api.gbif.org")))
    .toBe(false);

  rerender(
    <CollectionProfile
      profile={{ ...profile, datasetKey: "dataset-two" }}
      clientRoot="/portal"
    />,
  );
  expect(widget.getAttribute("src")).toContain("gbifDatasetKey=dataset-two");
  expect(citationLink.getAttribute("href")).toBe(
    "https://www.gbif.org/resource/search?contentType=literature&gbifDatasetKey=dataset-two",
  );
  expect(within(header).getByAltText("Bionomia dataset").getAttribute("src"))
    .toContain("/dataset/dataset-two/badge.svg");
});
test("omits dataset chips when the collection has no GBIF dataset", async () => {
  render(<CollectionProfile profile={profile} />);
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  expect(screen.queryByTitle("GBIF citation count")).toBeNull();
  expect(screen.queryByAltText("Bionomia dataset")).toBeNull();
  expect(screen.getByRole("link", { name: "Browse records" })).toBeTruthy();
});
test("profile preserves collection IDs, description images, and site availability", async () => {
  const titleFromPhp = document.title;
  render(<CollectionProfile profile={profile} clientRoot="/portal" />);
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  expect(
    screen.getByRole("link", { name: "Browse records" }).getAttribute("href"),
  ).toBe("/portal/collections/list.php?db=7");
  expect(
    screen
      .getByRole("link", { name: /Explore Tick extracts/ })
      .getAttribute("href"),
  ).toContain("collid=9");
  expect(
    screen
      .getByRole("link", { name: "Browse identifications" })
      .getAttribute("href"),
  ).toContain("collid=8");
  const notice = screen.getByRole("note", {
    name: "Taxonomic Identifications",
  });
  const about = screen.getByRole("region", { name: "About" });
  expect(notice.nextElementSibling).toBe(about);
  expect(within(about).queryByRole("note")).toBeNull();
  expect(
    within(notice).getByRole("link", { name: "Browse identifications" }),
  ).toBeTruthy();
  expect(screen.getByTestId("availability").textContent).toContain("2024-01");
  expect(document.title).toBe(titleFromPhp);
  expect(document.querySelector("script")).toBeNull();
  expect(screen.getByText("unsafe").getAttribute("href")).toBeNull();
  const details = screen.getByRole("complementary", {
    name: "Sample type details",
  });
  expect(within(details).getByAltText("Tick")).toBeTruthy();
  const gallery = within(details).getByRole("group", {
    name: "Sample type images",
  });
  expect(
    within(details).getByText("Sample Type ID").parentElement
      .nextElementSibling,
  ).toBe(within(details).getByText("Full Name").parentElement);
  expect(within(details).getByText(profile.collectionName)).toBeTruthy();
  expect(within(details).getByText("Full Name").parentElement.nextElementSibling)
    .toBe(gallery.parentElement);
  expect(
    screen.getByText("Description").parentElement.querySelector("img"),
  ).toBeNull();
});
test("linked sample type subtitles match collection IDs and omit unavailable codes", async () => {
  render(
    <CollectionProfile
      clientRoot="/portal"
      profile={{
        ...profile,
        related: { 9: "Tick extracts", 118: "Gastrointestinal Tracts", 208: "External collection" },
        relatedCodes: { 118: "MAMC-GI", 9: "TICK-DNA" },
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const section = screen.getByRole("region", { name: "Related Sample Types" });
  const rows = within(section).getAllByRole("listitem");
  expect(rows).toHaveLength(3);
  for (const [id, title, code] of [
    [9, "Tick extracts", "TICK-DNA"],
    [118, "Gastrointestinal Tracts", "MAMC-GI"],
    [208, "External collection", null],
  ]) {
    const titleElement = within(section).getByRole("heading", { name: title });
    const row = titleElement.closest("li");
    if (code) {
      expect(titleElement.nextElementSibling.textContent).toBe(code);
    } else {
      expect(titleElement.nextElementSibling).toBeNull();
    }
    expect(within(row).getByRole("link").getAttribute("href"))
      .toBe(`/portal/collections/misc/neoncollprofiles.php?collid=${id}`);
  }
});
test("moves multiple photos and captions into details while preserving links and surrounding text", async () => {
  render(
    <CollectionProfile
      profile={{
        ...profile,
        description:
          '<p>Before the photos</p><figure><a href="/full-photo"><img src="/one.jpg" alt="First photo" width="1200" height="900" style="width:1200px" onerror="alert(1)" /></a><figcaption>Photo credit</figcaption></figure><p>After the photos <img src="/two.jpg" /></p>',
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const details = screen.getByRole("complementary", {
    name: "Sample type details",
  });
  const images = within(details).getAllByRole("img");
  expect(images.map((image) => image.getAttribute("src"))).toEqual([
    "/one.jpg",
    "/two.jpg",
  ]);
  expect(images[0].closest("a").getAttribute("href")).toBe("/full-photo");
  expect(images[1].getAttribute("alt")).toBe("Ticks image 2");
  expect(images[1].closest("a").getAttribute("href")).toBe("/two.jpg");
  for (const attribute of ["width", "height", "style", "onerror"]) {
    expect(images[0].hasAttribute(attribute)).toBe(false);
  }
  expect(within(details).getByText("Photo credit")).toBeTruthy();
  const description = screen.getByText("Before the photos").parentElement;
  expect(description.querySelector("img, figure, a")).toBeNull();
  expect(within(description).getByText("After the photos")).toBeTruthy();
});
test.each([
  "<p>Text only</p>",
  '<p>Text only</p><a href="/empty"><img src="javascript:alert(1)" /></a><form><img src="/hidden.jpg" /></form>',
])(
  "omits the image block when the description has no usable photos: %s",
  async (description) => {
    render(<CollectionProfile profile={{ ...profile, description }} />);
    await waitFor(() =>
      expect(screen.queryByText("Loading documentation…")).toBeNull(),
    );
    const details = screen.getByRole("complementary", {
      name: "Sample type details",
    });
    expect(
      within(details).queryByRole("group", { name: "Sample type images" }),
    ).toBeNull();
    expect(within(details).queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link", { name: "" })).toBeNull();
  },
);
test("clipboard reports failure and copies canonical citation on success", async () => {
  const writeText = jest
    .fn()
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<CollectionProfile profile={profile} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy citation" }));
  await screen.findByText(/Unable to copy automatically/);
  fireEvent.click(screen.getByRole("button", { name: "Copy citation" }));
  await screen.findByText("Citation copied.");
  expect(writeText).toHaveBeenLastCalledWith(profile.citationText);
});
test("citation displays the guidance and keeps the canonical citation text", async () => {
  render(<CollectionProfile profile={profile} clientRoot="/portal" />);
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const guidance = screen.getByRole("link", {
    name: "Acknowledging and Citing the Biorepository",
  });
  expect(guidance.getAttribute("href")).toBe("/portal/misc/cite.php");
  expect(guidance.parentElement.textContent).toBe(
    "Please use this citation in your publications. Publications involving physical samples must also include individual specimen citations. See Acknowledging and Citing the Biorepository for more info.",
  );
  expect(screen.getByText(profile.citationText)).toBeTruthy();
  for (const name of ["Copy citation", "Download (BibTeX)", "Download (RIS)"]) {
    expect(screen.getByRole("button", { name }).classList.contains("MuiButton-outlined"))
      .toBe(true);
  }
});
test.each([
  ["Copy citation", "Click to copy the above plain text citation to the clipboard"],
  ["Download (BibTeX)", "Click to download the TICKS citation as a file in BibTeX format"],
  ["Download (RIS)", "Click to download the TICKS citation as a file in Research Information Systems (RIS) format"],
])("shows the data-product style help popup for %s", async (name, help) => {
  render(<CollectionProfile profile={profile} />);
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const button = screen.getByRole("button", { name });
  jest.spyOn(button, "getBoundingClientRect").mockReturnValue({
    x: 10, y: 10, top: 10, left: 10, right: 160, bottom: 42,
    width: 150, height: 32,
  });
  fireEvent.mouseOver(button);
  expect((await screen.findByRole("tooltip")).textContent).toBe(help);
});
test("citation downloads use a compact BibTeX note and preserve the full RIS note and metadata", async () => {
  const exportCitation = {
    ...citation,
    bibNote: "Use & archive",
    note: "Data accessed from https://example.org/7 on 2026-11-08. Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Use & archive",
  };
  render(
    <CollectionProfile
      profile={{
        ...profile,
        citation: exportCitation,
        description: "<p>Archive <strong>description</strong>.</p>",
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const blobs = [];
  const downloads = [];
  URL.createObjectURL = jest.fn((blob) => {
    blobs.push(blob);
    return `blob:citation-${blobs.length}`;
  });
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function () {
      downloads.push({ href: this.href, filename: this.download, attached: this.isConnected });
    });
  try {
    fireEvent.click(screen.getByRole("button", { name: "Download (BibTeX)" }));
    fireEvent.click(screen.getByRole("button", { name: "Download (RIS)" }));
    expect(downloads).toEqual([
      { href: "blob:citation-1", filename: "NEON-Ticks-nymphs-2026-11-08.bib", attached: true },
      { href: "blob:citation-2", filename: "NEON-Ticks-nymphs-2026-11-08.ris", attached: true },
    ]);
    expect(blobs.map((blob) => blob.type)).toEqual([
      "application/x-bibtex;charset=utf-8",
      "application/x-research-info-systems;charset=utf-8",
    ]);
    const [bib, ris] = await Promise.all(blobs.map((blob) => blob.text()));
    expect(bib).toBe(`@misc{TICKS/provisional,
    doi = {},
    url = {https://example.org/7},
    author = {{NEON}},
    language = {en},
    title = {{Ticks \\& nymphs}},
    publisher = {National Ecological Observatory Network (NEON)},
    note = {Use \\& archive},
    urldate = {2026-11-08},
    copyright = {CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)}
}`);
    expect(ris).toBe([
      "TY  - DATA", "T1  - Ticks & nymphs", "AU  - NEON", "DO  -",
      "UR  - https://example.org/7",
      "PB  - NEON (National Ecological Observatory Network) Biorepository",
      "Y2  - 2026-11-08", "LA  - en",
      "N1  - Data accessed from https://example.org/7 on 2026-11-08. Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Use & archive",
      "AB  - Archive description.", "ER  -", "",
    ].join("\r\n"));
    expect(document.querySelector('a[download]')).toBeNull();
  } finally {
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2), { timeout: 2000 });
    click.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});
test("About includes all collection statistics in their groups and supports old statistics links", async () => {
  window.history.replaceState(null, "", "/#statistics");
  render(
    <CollectionProfile
      profile={{
        ...profile,
        stats: {
          recordcnt: 1967,
          georefcnt: 1967,
          familycnt: 10,
          genuscnt: 36,
          speciescnt: 99,
        },
        extraStats: {
          imgcnt: "6418:1843",
          TotalTaxaCount: 98,
          SpecimensCountID: 1920,
          boldcnt: 60,
          refcnt: 141,
          researchProjectCount: 7,
          researchSpecimenCount: 123,
          publicationCount: 3,
          publicationSpecimenCount: 100,
          sequencedRecordCount: 65,
          gencnt: 12,
          geneticcnt: 4,
        },
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const about = screen.getByRole("region", { name: "About" });
  const stats = within(about).getByRole("region", {
    name: "Collection Statistics",
  });
  const groups = [
    ["Records", ["1,967", "1,967 (100%)", "1,843 (93.7%)", "6,418", "65"]],
    ["Taxonomy", ["10", "36", "99", "98", "1,920"]],
    ["Research", ["7", "123", "3", "100"]],
  ];
  for (const [title, expected] of groups) {
    const group = within(stats).getByRole("heading", {
      name: title,
    }).parentElement;
    expect(
      [...group.querySelectorAll("dd")].map((node) => node.textContent),
    ).toEqual(expected);
  }
  const nav = screen.getByRole("navigation", { name: "Sample type sections" });
  expect(
    nav.querySelector('[aria-current="location"]').getAttribute("href"),
  ).toBe("#about");
  expect(nav.querySelector('a[href="#statistics"]')).toBeNull();
  expect(stats.id).toBe("statistics");
  expect(within(stats).getByText("Research projects")).toBeTruthy();
  expect(within(stats).getByText("Research project specimens")).toBeTruthy();
  expect(within(stats).getByText("Publications")).toBeTruthy();
  expect(within(stats).getByText("Publication specimens")).toBeTruthy();
  expect(within(stats).getByText("Sequenced records")).toBeTruthy();
  expect(within(stats).queryByText("GenBank references")).toBeNull();
  expect(within(stats).queryByText("BOLD references")).toBeNull();
  expect(within(stats).queryByText("Other genetic references")).toBeNull();
  expect(within(stats).getByText("Ongoing and completed studies")).toBeTruthy();
  expect(within(stats).getByText("Published works")).toBeTruthy();
  expect(within(stats).queryByText("Publication references")).toBeNull();
  expect(within(stats).queryByText("141")).toBeNull();
  window.history.replaceState(null, "", "/");
});
test("partial documentation failures preserve successful documents and deduplicate products", async () => {
  global.fetch.mockImplementation(async (url) => {
    if (url.endsWith("sample-catalog.php"))
      return { ok: true, json: async () => ({ items: [] }) };
    if (url.includes("DP1.00002.001")) throw new Error("Unavailable");
    return {
      ok: true,
      json: async () => ({
        data: {
          specs: [
            {
              specNumber: "PROTO-1",
              specDescription: "Protocol and Procedure",
            },
          ],
        },
      }),
    };
  });
  render(
    <CollectionProfile
      profile={{
        ...profile,
        resources: [
          { url: "https://example.org/DP1.00001.001" },
          { url: "https://example.org/DP1.00001.001" },
          { url: "https://example.org/DP1.00002.001" },
          { url: "https://example.org/home" },
        ],
      }}
    />,
  );
  await screen.findByText("PROTO-1");
  expect(screen.getByText(/Some documentation could not be loaded/)).toBeTruthy();
  expect(
    global.fetch.mock.calls.filter(([url]) => url.includes("api/v0/products")),
  ).toHaveLength(2);
});
test("separates related data products from all eligible documentation", async () => {
  const protocol = {
    specNumber: "NEON.DOC.014050vN",
    specDescription: "TOS Protocol and Procedure: BET – Ground Beetle Sampling",
    specType: "application/pdf",
    specSize: 5090560,
  };
  const records = {
    "DP1.10022.001": [
      protocol,
      { specNumber: "CMNH_Receiving_SOP", specDescription: "Processing shipments of specimens for NEON at CMNH" },
      { specNumber: "NEON.DOC.000909vC", specDescription: "TOS Science Design for Ground Beetle Abundance and Diversity" },
      { specNumber: "NEON_beetle_userGuide_vG", specDescription: "NEON User Guide to Ground Beetles Sampled from Pitfall Traps" },
      { specNumber: "NEON.DOC.005424vA", specDescription: "NEON Algorithm Theoretical Basis Document (ATBD): OS Data Quality Control" },
    ],
    "DP1.10020.001": [
      protocol,
      { ...protocol, specNumber: "NEON.DOC.014050vL", specSize: 6000000 },
      { specNumber: "LAB_SOP", specDescription: "Laboratory standard operating procedure", specType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", specSize: 1024 },
      { specNumber: "NEON.QSG.DP1.10020.001v2", specDescription: "Quick Start Guide for Ground beetle sequences DNA barcode" },
    ],
  };
  global.fetch.mockImplementation(async (url) => ({
    ok: true,
    json: async () => url.includes("api/v0/products/")
      ? { data: { specs: records[url.split("/").pop()] } }
      : { items: [] },
  }));
  render(<CollectionProfile profile={{
    ...profile,
    resources: [
      { url: "https://data.neonscience.org/data-products/DP1.10022.001", title: { en: "Ground beetles sampled from pitfall traps" } },
      { url: "https://data.neonscience.org/data-products/DP1.10020.001", title: { en: "Ground beetle sequences DNA barcode" } },
      { url: "https://data.neonscience.org/data-products/DP1.10022.001", title: { en: "Ground beetles sampled from pitfall traps" } },
      { url: "https://example.org/field-resources", title: { en: "Field resources" } },
    ],
  }} />);
  await screen.findByText(protocol.specNumber);
  const products = screen.getByRole("region", { name: "Related Data Products" });
  const documentation = screen.getByRole("region", { name: "Documentation" });
  const productRows = within(products).getAllByRole("listitem");
  expect(productRows.map((row) => within(row).getByRole("heading").textContent))
    .toEqual(["Ground beetle sequences DNA barcode", "Ground beetles sampled from pitfall traps"]);
  expect(within(productRows[0]).getByText("DP1.10020.001")).toBeTruthy();
  expect(within(productRows[0]).getByRole("link").getAttribute("href"))
    .toBe("https://data.neonscience.org/data-products/DP1.10020.001");
  expect(within(documentation).getAllByRole("listitem").map((row) => row.textContent))
    .toEqual(["LAB_SOP", "CMNH_Receiving_SOP", protocol.specNumber, "NEON.DOC.000909vC"]);
  expect(within(documentation).getAllByText(protocol.specNumber)).toHaveLength(1);
  expect(within(documentation).queryByText("NEON.DOC.014050vL")).toBeNull();
  expect(within(products).queryByText(protocol.specNumber)).toBeNull();
  expect(within(products).queryByText("Field resources")).toBeNull();
  expect(screen.getByRole("region", { name: "Externally Hosted Data" }).textContent)
    .toContain("Field resources");
  const nav = screen.getByRole("navigation", { name: "Sample type sections" });
  expect(within(nav).getByRole("link", { name: "Related Data Products" }).getAttribute("href"))
    .toBe(`#${products.id}`);
  expect(within(nav).getByRole("link", { name: "Documentation" }).getAttribute("href"))
    .toBe(`#${documentation.id}`);
  expect(DocumentListItem).toHaveBeenCalledWith(expect.objectContaining({
    document: { name: protocol.specNumber, description: protocol.specDescription, type: protocol.specType, size: protocol.specSize },
    enableDownloadButton: true,
    makeDownloadableLink: false,
  }), undefined);
  expect(DocumentListItem).toHaveBeenCalledWith(expect.objectContaining({
    document: expect.objectContaining({ name: "LAB_SOP", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 1024 }),
  }), undefined);
});
test("documentation exclusions recognize titles and filenames while keeping other guides", () => {
  const specs = [
    { specNumber: "neon_beetle_userGuide_vG" },
    { specNumber: "NEON.QSG.DP1.10022.001v2.pdf" },
    { specNumber: "NEON_ATBD_v1" },
    { specNumber: "USER", specDescription: "NEON USER GUIDES to samples" },
    { specNumber: "QUICK", specDescription: "Quick-Start Guides to samples" },
    { specNumber: "ALGORITHM", specDescription: "NEON Algorithm Theoretical Basis Document: Quality control" },
    { specNumber: "FIELD", specDescription: "Field identification guide" },
    { specNumber: "LAB", specDescription: "External laboratory user guide" },
    { specNumber: "NEON.DOC.999999" },
    null,
    { specDescription: "Missing download identifier" },
  ];
  expect(selectDocumentation(specs).map((spec) => spec.specNumber))
    .toEqual(["LAB", "FIELD", "NEON.DOC.999999"]);
});
test("documentation keeps the newest revision regardless of product order or file size", () => {
  const title = "TOS Protocol and Procedure: MAM – Small Mammal Sampling";
  const older = {
    specNumber: "NEON.DOC.000481vO",
    specDescription: title,
    specType: "application/pdf",
    specSize: 3575644,
    specUrl: "https://data.neonscience.org/api/v0/documents/NEON.DOC.000481vO",
  };
  const newer = {
    ...older,
    specNumber: "NEON.DOC.000481vQ",
    specSize: 3502244,
    specUrl: "https://data.neonscience.org/api/v0/documents/NEON.DOC.000481vQ",
  };
  expect(selectDocumentation([older, newer, older])).toEqual([newer]);
  expect(selectDocumentation([newer, older])).toEqual([newer]);
  expect(selectDocumentation([older, newer])[0]).toBe(newer);

  const unrelated = { ...older, specNumber: "NEON.DOC.999999vA" };
  expect(selectDocumentation([older, newer, unrelated])).toEqual([newer, unrelated]);
});
test("documentation compares letter and numeric revisions without merging unversioned files", () => {
  const numbers = [
    "NEON.DOC.000001vZ",
    "NEON.DOC.000001vAA",
    "NEON.DOC.000002v2",
    "NEON.DOC.000002v10",
    "LAB_SOP_Rev2.pdf",
    "LAB_SOP_Rev10.pdf",
    "OTHER_SOP_v1.9",
    "OTHER_SOP_v1.10",
    "CMNH_Receiving_SOP",
    "CMNH_Receiving_SOP",
    "FIELD_SOP",
  ];
  expect(selectDocumentation(numbers.map((specNumber) => ({ specNumber })))
    .map((spec) => spec.specNumber).sort()).toEqual([
      "CMNH_Receiving_SOP",
      "FIELD_SOP",
      "LAB_SOP_Rev10.pdf",
      "NEON.DOC.000001vAA",
      "NEON.DOC.000002v10",
      "OTHER_SOP_v1.10",
    ]);
});
test("omits the superseded Essig beetle SOP even though its replacement was renamed", () => {
  const older = {
    specNumber: "ESSIG_carabidtaxonID_SOP2021_Rev3",
    specDescription: "Essig Museum of Entomology University of California, Berkeley. Standard Operating Procedures and Protocols for Ground Beetle Morphological Identification and Museum Services. Rev 3.",
  };
  const newer = {
    specNumber: "ESSIG_carabidTaxonID_SOP_2025_Rev6",
    specDescription: "Essig Museum of Entomology University of California, Berkeley. Standard Operating Procedures and Protocols for Ground Beetle Morphological Identification and Museum Services. Rev 6",
  };
  expect(selectDocumentation([older, newer])).toEqual([newer]);
  expect(selectDocumentation([older])).toEqual([]);
});
test("documentation handles empty and invalid responses without claiming success on failures", async () => {
  const { rerender } = render(<CollectionProfile profile={profile} />);
  await screen.findByText("No documentation is currently available for this sample type.");
  expect(global.fetch.mock.calls.filter(([url]) => url.includes("api/v0/products")))
    .toHaveLength(0);
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { specs: {} } }) });
  rerender(<CollectionProfile profile={{
    ...profile,
    resources: [{ url: "https://data.neonscience.org/data-products/DP1.10022.001" }],
  }} />);
  await screen.findByText(/Some documentation could not be loaded/);
  expect(screen.queryByText("No documentation is currently available for this sample type.")).toBeNull();
});
test("data downloads combine browse and search rows with the full archive and metadata", async () => {
  const archiveUrl = "/portal/content/dwca/NEON-TICKS_DwC-A.zip";
  const emlUrl = "../datasets/emlhandler.php?collid=7";
  const external = [
    { title: "GBIF dataset", url: "https://www.gbif.org/dataset/dataset-seven" },
    { title: "EDI dataset", url: "https://doi.org/10.6073/pasta/example" },
    { title: "iDigBio dataset", url: "https://www.idigbio.org/portal/recordsets/recordset-seven" },
  ];
  render(<CollectionProfile clientRoot="/portal" profile={{
    ...profile,
    additionalResources: [
      ...external,
      { kind: "eml", title: "Collection metadata", url: emlUrl },
      { kind: "dwca", title: "Full Data Download", url: archiveUrl, filename: "NEON-TICKS_DwC-A.zip", sizeBytes: 3491758, action: "Download", actionIcon: "download", openInNewTab: true },
    ],
  }} />);
  await waitFor(() => expect(screen.queryByText("Loading documentation…")).toBeNull());
  const downloads = screen.getByRole("region", { name: "Data Downloads" });
  const rows = within(downloads).getAllByRole("listitem");
  expect(rows.map((row) => within(row).getByRole("heading").textContent))
    .toEqual(["Browse Records", "Search Records", "Full Data Download", "Metadata"]);
  expect(within(downloads).getByText("Darwin Core Archive (DwC-A)")).toBeTruthy();
  expect(within(downloads).getByText("NEON-TICKS_DwC-A.zip")).toBeTruthy();
  expect(within(downloads).getByText("3.33 MB")).toBeTruthy();
  expect(within(downloads).getByText("Ecological Metadata Language (EML) File")).toBeTruthy();
  expect(within(downloads).getByRole("link", { name: /Download Full Data Download/ }).getAttribute("href"))
    .toBe(archiveUrl);
  expect(within(rows[0]).getByRole("link").getAttribute("href"))
    .toBe("/portal/collections/list.php?db=7");
  expect(within(rows[1]).getByRole("link").getAttribute("href"))
    .toBe("/portal/neon/search/index.php?db=7");
  expect(within(downloads).getByRole("link", { name: /View Metadata/ }).getAttribute("href"))
    .toBe(emlUrl);
  for (const action of within(downloads).getAllByRole("link")) {
    expect(action.classList.contains("MuiButton-outlined")).toBe(true);
  }
  for (const row of rows.slice(2)) {
    const action = within(row).getByRole("link");
    expect(action.getAttribute("target")).toBe("_blank");
    expect(action.getAttribute("rel")).toBe("noopener noreferrer");
  }
  const hosts = screen.getByRole("region", { name: "Externally Hosted Data" });
  expect(within(hosts).getByText("External Hosts")).toBeTruthy();
  for (const resource of external) {
    const label = resource.title === "GBIF dataset" ? profile.collectionName : resource.title;
    expect(within(hosts).getByRole("link", { name: label }).getAttribute("href"))
      .toBe(resource.url);
    expect(within(downloads).queryByText(resource.title)).toBeNull();
  }
  expect(within(hosts).queryByRole("link", { name: "GBIF dataset" })).toBeNull();
  const nav = screen.getByRole("navigation", { name: "Sample type sections" });
  expect(within(nav).getByRole("link", { name: "Data Downloads" }).getAttribute("href"))
    .toBe(`#${downloads.id}`);
  expect(within(nav).getByRole("link", { name: "Externally Hosted Data" }).getAttribute("href"))
    .toBe(`#${hosts.id}`);
  expect(screen.queryByText("Additional Resources")).toBeNull();
});
test("missing archives and external datasets do not create empty rows or external sections", async () => {
  render(<CollectionProfile profile={profile} />);
  await waitFor(() => expect(screen.queryByText("Loading documentation…")).toBeNull());
  const downloads = screen.getByRole("region", { name: "Data Downloads" });
  expect(within(downloads).getAllByRole("listitem")).toHaveLength(3);
  expect(within(downloads).queryByText("Full Data Download")).toBeNull();
  expect(screen.queryByRole("region", { name: "Externally Hosted Data" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Externally Hosted Data" })).toBeNull();
});
test("the full download button renders the PHP action without deciding login status in React", async () => {
  const loginUrl = "/portal/profile/index.php?refurl=%2Fportal%2Fcollections%2Fmisc%2Fneoncollprofiles.php%3Fcollid%3D7%23data-downloads";
  const archive = {
    kind: "dwca",
    filename: "",
    sizeBytes: 126976,
    url: loginUrl,
    action: "Log in to download",
    actionIcon: "lock",
    openInNewTab: false,
  };
  const downloadProfile = {
    ...profile,
    // Stale client flags must not override the action PHP supplied.
    isLoggedIn: true,
    additionalResources: [
      archive,
      ...profile.additionalResources,
    ],
  };
  const { rerender } = render(<CollectionProfile clientRoot="/portal" profile={downloadProfile} />);
  await waitFor(() => expect(screen.queryByText("Loading documentation…")).toBeNull());
  const downloads = screen.getByRole("region", { name: "Data Downloads" });
  const login = within(downloads).getByRole("link", { name: "Log in to download Full Data Download" });
  expect(login.getAttribute("href"))
    .toBe(loginUrl);
  expect(login.getAttribute("target")).toBeNull();
  expect(within(downloads).queryByText("public-archive.zip")).toBeNull();
  expect(within(downloads).queryByText("index.php")).toBeNull();
  expect(within(downloads).getByText("124 KB")).toBeTruthy();
  expect(document.querySelector('a[href="https://example.org/public-archive.zip"]')).toBeNull();
  expect(within(downloads).getByRole("link", { name: /View Metadata/ }).getAttribute("href"))
    .toBe("../datasets/emlhandler.php?collid=7");
  expect(within(downloads).getByRole("link", { name: "Browse Browse Records" }).getAttribute("href"))
    .toBe("/portal/collections/list.php?db=7");
  expect(within(downloads).getByRole("link", { name: "Search Search Records" }).getAttribute("href"))
    .toBe("/portal/neon/search/index.php?db=7");
  rerender(<CollectionProfile clientRoot="/portal" profile={{
    ...downloadProfile,
    isLoggedIn: false,
    additionalResources: [
      { ...archive, filename: "public-archive.zip", url: "/portal/content/dwca/public-archive.zip", action: "Download", actionIcon: "download", openInNewTab: true },
      ...profile.additionalResources,
    ],
  }} />);
  const download = within(downloads).getByRole("link", { name: /Download Full Data Download/ });
  expect(download.getAttribute("href"))
    .toBe("/portal/content/dwca/public-archive.zip");
  expect(within(downloads).queryByText("Log in to download")).toBeNull();
  expect(download.getAttribute("target")).toBe("_blank");
});
test.each([null, -1, 0])("archive size handles unavailable and empty files (%s)", async (sizeBytes) => {
  render(<CollectionProfile profile={{
    ...profile,
    additionalResources: [{ kind: "dwca", url: "https://example.org/archive.zip", sizeBytes }],
  }} />);
  await waitFor(() => expect(screen.queryByText("Loading documentation…")).toBeNull());
  const downloads = screen.getByRole("region", { name: "Data Downloads" });
  expect(downloads.textContent).not.toMatch(/NaN|Infinity|undefined/);
  expect(Boolean(within(downloads).queryByText("0 B"))).toBe(sizeBytes === 0);
});
test("resource grouping supports existing PHP profiles and preserves safe destinations", () => {
  const archive = { title: "Darwin Core Archive", url: "https://example.org/Sample%20Archive.zip?download=1#file" };
  const metadata = { title: "Collection metadata", url: "../datasets/emlhandler.php?collid=39" };
  const host = { title: "GBIF dataset", url: "https://www.gbif.org/dataset/example" };
  const result = partitionResources([host, metadata, archive, host, { kind: "dwca", url: "javascript:alert(1)" }]);
  expect(result.downloads).toEqual([{ ...archive, kind: "dwca" }, { ...metadata, kind: "eml" }]);
  expect(result.external).toEqual([host]);
  expect(archiveFilename(archive.url)).toBe("Sample Archive.zip");
});
test("empty availability and zero counts do not invent sites or percentages", async () => {
  render(
    <CollectionProfile
      profile={{
        ...profile,
        stats: {},
        siteCodes: [],
        identificationCollectionId: 0,
      }}
    />,
  );
  await screen.findByText(
    "No site availability information is currently available.",
  );
  expect(screen.queryByTestId("availability")).toBeNull();
  expect(
    screen.queryByRole("note", { name: "Taxonomic Identifications" }),
  ).toBeNull();
  expect(statistics({}, { SpecimensCountID: 1 }).flat().join(" ")).not.toMatch(
    /NaN|Infinity/,
  );
});
test("citation exports escape values and preserve dates and record boundaries", () => {
  expect(citationFile(citation, "bib")).toContain("Ticks \\& nymphs");
  expect(citationFile(citation, "bib")).toContain("2026-11-08");
  expect(citationFile({ ...citation, title: "One\nTwo" }, "ris")).toContain(
    "T1  - One Two\r\n",
  );
  expect(citationFile(citation, "ris")).toMatch(/ER  -\r\n$/);
  expect(safeUrl("javascript:alert(1)")).toBeUndefined();
});

test("uses the shared page sidebar without duplicating navigation", async () => {
  const host = document.createElement("div");
  host.id = "biorepo-profile-navigation";
  document.body.appendChild(host);
  const { container, unmount } = render(
    <CollectionProfile profile={profile} />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  expect(host.querySelector("nav")).not.toBeNull();
  expect(
    container.querySelector('nav[aria-label="Sample type sections"]'),
  ).toBeNull();
  expect(
    screen.getAllByRole("navigation", { name: "Sample type sections" }),
  ).toHaveLength(1);
  const contact = within(host).getByRole("link", { name: "Contact the Biorepository" });
  expect(contact.getAttribute("href"))
    .toBe("https://www.neonscience.org/about/contact-neon-biorepository");
  expect(contact.parentElement.previousElementSibling).toBe(host.querySelector("nav"));
  expect(contact.parentElement.textContent).toContain("Have questions about samples?");
  expect(container.querySelector("#contact")).toBeNull();
  expect(host.querySelector('a[href="#contact"]')).toBeNull();
  unmount();
  host.remove();
});

test("collection directory does not require product or documentation metadata", () => {
  render(<CollectionProfile clientRoot="/portal" profile={{
    collections: [{ id: 39, title: "Pinned Carabids", code: "CARC-PV" }],
  }} />);
  expect(screen.getByRole("link", { name: "Pinned Carabids" }).getAttribute("href"))
    .toBe("/portal/collections/misc/neoncollprofiles.php?collid=39");
  expect(screen.getByText("CARC-PV")).toBeTruthy();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("distribution drilldown keeps the selected collection and encodes geographic names", async () => {
  render(
    <CollectionProfile
      profile={{
        ...profile,
        distribution: {
          type: "geography",
          country: "United States",
          state: "",
          rows: { "New York": { cnt: 5, hasChild: true } },
        },
      }}
      clientRoot="/portal"
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const href = screen
    .getByRole("link", { name: "New York" })
    .getAttribute("href");
  expect(href).toContain(
    "collid=7&stat=geography&country=United+States&state=New+York",
  );
  expect(
    screen.getByRole("link", { name: "5 records" }).getAttribute("href"),
  ).toContain("db=7");
});

test("sidebar selects clicked sections and keeps one link per list item", async () => {
  window.history.replaceState(null, "", "/");
  render(<CollectionProfile profile={profile} />);
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const nav = screen.getByRole("navigation", { name: "Sample type sections" });
  const about = nav.querySelector('a[href="#about"]');
  const citationLink = nav.querySelector('a[href="#citation"]');
  expect(about.getAttribute("aria-current")).toBe("location");
  expect(nav.querySelectorAll("li")).toHaveLength(
    nav.querySelectorAll("a").length,
  );
  // Exercise React selection without jsdom scheduling a later document navigation.
  citationLink.addEventListener("click", (event) => event.preventDefault(), {
    once: true,
  });
  fireEvent.click(citationLink);
  expect(citationLink.getAttribute("aria-current")).toBe("location");
  expect(about.hasAttribute("aria-current")).toBe(false);
  expect(nav.querySelectorAll('[aria-current="location"]')).toHaveLength(1);
});

test("sidebar follows direct section links and back/forward hash changes", async () => {
  window.history.replaceState(null, "", "/#data-downloads");
  render(<CollectionProfile profile={profile} />);
  await waitFor(() =>
    expect(screen.queryByText("Loading documentation…")).toBeNull(),
  );
  const nav = screen.getByRole("navigation", { name: "Sample type sections" });
  expect(
    nav.querySelector('[aria-current="location"]').getAttribute("href"),
  ).toBe("#data-downloads");
  window.history.replaceState(null, "", "/#documentation");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(
    nav.querySelector('[aria-current="location"]').getAttribute("href"),
  ).toBe("#documentation");
  window.history.replaceState(null, "", "/");
});
