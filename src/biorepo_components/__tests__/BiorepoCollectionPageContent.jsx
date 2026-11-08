import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { CollectionProfile } from "../BiorepoCollectionPageContent";
import {
  citationFile,
  statistics,
  safeUrl,
} from "../collectionProfile/profile";
jest.mock("../../lib_components/components/Documents/DocumentListItem", () => ({
  __esModule: true,
  default: ({ document }) => <div>{document.name}</div>,
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
  additionalResources: [{ title: "Metadata", url: "/metadata?collid=7" }],
  contacts: [],
  siteCodes: [{ siteCode: "ABBY", availableMonths: ["2024-01"] }],
};
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(cleanup);
test("profile preserves collection IDs, description images, and site availability", async () => {
  render(<CollectionProfile profile={profile} clientRoot="/portal" />);
  await waitFor(() =>
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
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
  expect(screen.getByTestId("availability").textContent).toContain("2024-01");
  expect(document.querySelector("script")).toBeNull();
  expect(screen.getByText("unsafe").getAttribute("href")).toBeNull();
  expect(screen.getByAltText("Tick")).toBeTruthy();
});
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
test("partial protocol failures preserve successful protocols and deduplicate products", async () => {
  global.fetch
    .mockResolvedValueOnce({
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
    })
    .mockRejectedValueOnce(new Error());
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
  expect(screen.getByText(/Some protocols could not be loaded/)).toBeTruthy();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
test("empty availability and zero counts do not invent sites or percentages", async () => {
  render(
    <CollectionProfile profile={{ ...profile, stats: {}, siteCodes: [] }} />,
  );
  await screen.findByText(
    "No site availability information is currently available.",
  );
  expect(screen.queryByTestId("availability")).toBeNull();
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
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
  );
  expect(host.querySelector("nav")).not.toBeNull();
  expect(container.querySelector("aside")).toBeNull();
  expect(
    screen.getAllByRole("navigation", { name: "Sample type sections" }),
  ).toHaveLength(1);
  unmount();
  host.remove();
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
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
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
