import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  within,
} from "@testing-library/react";
import CollectionDetails, {
  availableDates,
} from "../collectionProfile/CollectionDetails";
const soil = {
  id: 7,
  preservation: ["Dry Samples"],
  protocols: ["SLS – Soil Biogeochemical and Microbial Sampling"],
  storageConditions: "dry, ambient",
  storageContainer: "250 mL glass jar",
  siteCodes: [{ availableMonths: ["2025-10", "2014-01", "2020-08"] }],
};
afterEach(cleanup);
test("loads the selected collection details and full catalog date range without hardcoding soil metadata", async () => {
  global.fetch = jest.fn().mockImplementation(async (url) => ({
    ok: true,
    json: async () =>
      url.endsWith("keywords.json")
        ? {
            7: [" soil ", "microbial ecology", "soil", "", null, 123],
            8: ["wrong keyword"],
          }
        : { items: [{ ...soil, id: 8, storageContainer: "Wrong jar" }, soil] },
  }));
  render(
    <CollectionDetails
      id={7}
      code="SOIC-DP"
      clientRoot="/portal"
      siteCodes={[]}
    />,
  );
  await screen.findByText("250 mL glass jar");
  expect(screen.getByText("Sample Type ID")).toBeTruthy();
  expect(screen.getByText("SOIC-DP")).toBeTruthy();
  expect(screen.queryByText("Wrong jar")).toBeNull();
  expect(screen.getByText("Dry Samples")).toBeTruthy();
  expect(screen.getByText(soil.protocols[0])).toBeTruthy();
  expect(screen.getByText("dry, ambient")).toBeTruthy();
  expect(screen.getByText("January 2014 – October 2025")).toBeTruthy();
  const details = screen.getByRole("group", {
    name: "Preservation and storage details",
  });
  expect(within(details).getByText("250 mL glass jar")).toBeTruthy();
  expect(within(details).getByText("Storage & container")).toBeTruthy();
  const media = screen.getByRole("complementary", {
    name: "Sample type details",
  });
  expect(within(media).getByText("SOIC-DP")).toBeTruthy();
  expect(within(media).getByText("soil")).toBeTruthy();
  expect(within(media).queryByText("250 mL glass jar")).toBeNull();
  expect(screen.getAllByText("soil")).toHaveLength(1);
  expect(screen.queryByText("wrong keyword")).toBeNull();
  expect(global.fetch).toHaveBeenCalledWith(
    "/portal/neon-react/biorepo_lib/keywords.json",
    expect.objectContaining({ cache: "no-store" }),
  );
  expect(global.fetch.mock.calls[0][0]).toBe(
    "/portal/neon-react/biorepo_lib/sample-catalog.php",
  );
});
test("failed metadata requests keep keywords and known dates and can be retried", async () => {
  const catalog = jest
    .fn()
    .mockRejectedValueOnce(new Error("Network"))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [soil] }) });
  global.fetch = jest
    .fn()
    .mockImplementation((url) =>
      url.endsWith("keywords.json")
        ? Promise.resolve({ ok: true, json: async () => ({ 7: ["soil"] }) })
        : catalog(),
    );
  render(
    <CollectionDetails
      id={7}
      clientRoot=""
      siteCodes={[{ availableMonths: ["2024-01"] }]}
    />,
  );
  await screen.findByText("Sample details could not be loaded.");
  expect(screen.getByText("January 2024 – January 2024")).toBeTruthy();
  expect(await screen.findByText("soil")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Retry details" }));
  await screen.findByText("250 mL glass jar");
  expect(screen.queryByText("Sample details could not be loaded.")).toBeNull();
});
test("missing metadata does not fabricate values or keywords", async () => {
  global.fetch = jest.fn().mockImplementation(async (url) => ({
    ok: true,
    json: async () =>
      url.endsWith("keywords.json") ? {} : { items: [{ id: 7 }] },
  }));
  render(<CollectionDetails id={7} clientRoot="" />);
  await screen.findByText("Preservation");
  expect(screen.getAllByText("Not specified")).toHaveLength(4);
  expect(screen.getByText("No dated site records")).toBeTruthy();
  expect(screen.queryByText("Scientific keywords")).toBeNull();
});
test.each(["http", "json"])(
  "a keyword %s failure leaves the other details available",
  async (failure) => {
    global.fetch = jest.fn().mockImplementation(async (url) =>
      url.endsWith("keywords.json")
        ? {
            ok: failure !== "http",
            json: async () => {
              throw new SyntaxError("Invalid JSON");
            },
          }
        : { ok: true, json: async () => ({ items: [soil] }) },
    );
    render(<CollectionDetails id={7} />);
    await screen.findByText("250 mL glass jar");
    expect(screen.queryByText("Scientific keywords")).toBeNull();
    expect(
      screen.queryByText("Sample details could not be loaded."),
    ).toBeNull();
  },
);
test("changing collections ignores a late keyword response from the previous collection", async () => {
  let resolvePrevious;
  const previous = new Promise((resolve) => {
    resolvePrevious = resolve;
  });
  const keywordRequests = jest
    .fn()
    .mockReturnValueOnce(previous)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 8: ["zooplankton"] }),
    });
  global.fetch = jest
    .fn()
    .mockImplementation((url) =>
      url.endsWith("keywords.json")
        ? keywordRequests()
        : Promise.resolve({ ok: true, json: async () => ({ items: [soil] }) }),
    );
  const { rerender } = render(<CollectionDetails id={7} />);
  await screen.findByText("250 mL glass jar");
  rerender(<CollectionDetails id={8} />);
  await screen.findByText("zooplankton");
  await act(async () => {
    resolvePrevious({ ok: true, json: async () => ({ 7: ["soil"] }) });
  });
  expect(screen.queryByText("soil")).toBeNull();
  expect(screen.getByText("zooplankton")).toBeTruthy();
});
test("date range ignores malformed months and handles empty site coverage", () => {
  expect(
    availableDates([
      { availableMonths: ["2020-13", "2019-00", null, "2021-04", "2015-01"] },
      {},
    ]),
  ).toBe("January 2015 – April 2021");
  expect(availableDates([])).toBe("No dated site records");
});
