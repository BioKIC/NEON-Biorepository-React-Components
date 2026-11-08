import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [{ ...soil, id: 8, storageContainer: "Wrong jar" }, soil],
    }),
  });
  render(
    <CollectionDetails
      id={7}
      code="SOIC-DP"
      clientRoot="/portal"
      siteCodes={[]}
      keywords={["soil", "microbial ecology", "soil", ""]}
    />,
  );
  await screen.findByText("250 mL glass jar");
  expect(screen.getByText("Sample Type ID")).toBeTruthy();
  expect(screen.getByText("SOIC-DP")).toBeTruthy();
  expect(screen.queryByText("Wrong jar")).toBeNull();
  expect(screen.getByText("Dry Samples")).toBeTruthy();
  expect(screen.getByText(soil.protocols[0])).toBeTruthy();
  expect(screen.getByText("dry, ambient")).toBeTruthy();
  expect(screen.getByText("2014-01 through 2025-10")).toBeTruthy();
  expect(screen.getAllByText("soil")).toHaveLength(1);
  expect(global.fetch.mock.calls[0][0]).toBe(
    "/portal/neon-react/biorepo_lib/sample-catalog.php",
  );
});
test("failed metadata requests keep known dates and can be retried", async () => {
  global.fetch = jest
    .fn()
    .mockRejectedValueOnce(new Error("Network"))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [soil] }) });
  render(
    <CollectionDetails
      id={7}
      clientRoot=""
      siteCodes={[{ availableMonths: ["2024-01"] }]}
    />,
  );
  await screen.findByText("Sample details could not be loaded.");
  expect(screen.getByText("2024-01 through 2024-01")).toBeTruthy();
  expect(screen.queryByText("Scientific Keywords")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry details" }));
  await screen.findByText("250 mL glass jar");
  expect(screen.queryByText("Sample details could not be loaded.")).toBeNull();
});
test("missing metadata does not fabricate values or keywords", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: [{ id: 7 }] }),
  });
  render(<CollectionDetails id={7} clientRoot="" />);
  await screen.findByText("Preservation");
  expect(screen.getAllByText("Not specified")).toHaveLength(4);
  expect(screen.getByText("No dated site records")).toBeTruthy();
  expect(screen.queryByText("Scientific Keywords")).toBeNull();
});
test("date range ignores malformed months and handles empty site coverage", () => {
  expect(
    availableDates([
      { availableMonths: ["2020-13", "2019-00", null, "2021-04", "2015-01"] },
      {},
    ]),
  ).toBe("2015-01 through 2021-04");
  expect(availableDates([])).toBe("No dated site records");
});
