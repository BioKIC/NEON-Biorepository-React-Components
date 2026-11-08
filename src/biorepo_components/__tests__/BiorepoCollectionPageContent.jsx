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
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });
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
  expect(document.title).toBe("NEON | Ticks");
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
  ).toBe(gallery.parentElement);
  expect(
    screen.getByText("Description").parentElement.querySelector("img"),
  ).toBeNull();
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
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
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
      expect(screen.queryByText("Loading protocols…")).toBeNull(),
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
          gencnt: 12,
          geneticcnt: 4,
        },
      }}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
  );
  const about = screen.getByRole("region", { name: "About" });
  const stats = within(about).getByRole("region", {
    name: "Collection Statistics",
  });
  const groups = [
    ["Records", ["1,967", "1,967 (100%)", "1,843 (93.7%)", "6,418"]],
    ["Taxonomy", ["10", "36", "99", "98", "1,920"]],
    ["References", ["12", "60", "4", "141"]],
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
  window.history.replaceState(null, "", "/");
});
test("partial protocol failures preserve successful protocols and deduplicate products", async () => {
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
  expect(screen.getByText(/Some protocols could not be loaded/)).toBeTruthy();
  expect(
    global.fetch.mock.calls.filter(([url]) => url.includes("api/v0/products")),
  ).toHaveLength(2);
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
  expect(
    container.querySelector('nav[aria-label="Sample type sections"]'),
  ).toBeNull();
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

test("sidebar selects clicked sections and keeps one link per list item", async () => {
  window.history.replaceState(null, "", "/");
  render(<CollectionProfile profile={profile} />);
  await waitFor(() =>
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
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
  window.history.replaceState(null, "", "/#resources");
  render(<CollectionProfile profile={profile} />);
  await waitFor(() =>
    expect(screen.queryByText("Loading protocols…")).toBeNull(),
  );
  const nav = screen.getByRole("navigation", { name: "Sample type sections" });
  expect(
    nav.querySelector('[aria-current="location"]').getAttribute("href"),
  ).toBe("#resources");
  window.history.replaceState(null, "", "/#documentation");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(
    nav.querySelector('[aria-current="location"]').getAttribute("href"),
  ).toBe("#documentation");
  window.history.replaceState(null, "", "/");
});
