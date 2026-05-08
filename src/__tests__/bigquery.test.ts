/**
 * Unit tests for src/lib/bigquery.ts
 * Mocks: fetch (for SA token + BQ query), crypto.createSign (for JWT signing)
 */

// Mock crypto so we don't need a real RSA key
jest.mock("crypto", () => ({
  createSign: jest.fn(() => ({
    update: jest.fn(),
    sign: jest.fn(() => "fake-sig"),
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { isBQConfigured, fetchBQAdsData, runBQQuery } from "@/lib/bigquery";

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.BQ_SERVICE_ACCOUNT_JSON;
  delete process.env.BQ_PROJECT_ID;
  delete process.env.BQ_DATASET_ID;
  delete process.env.BQ_TABLE;
});

const FULL_ENV = () => {
  process.env.BQ_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: "sa@project.iam.gserviceaccount.com",
    private_key: "fake-key",
  });
  process.env.BQ_PROJECT_ID = "my-project";
  process.env.BQ_DATASET_ID = "my-dataset";
  process.env.BQ_TABLE = "p_ads_CampaignStats_123";
};

const mockSAToken = () =>
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: "fake-access-token" }),
  });

// ─── isBQConfigured ───────────────────────────────────────────────────────────

describe("isBQConfigured", () => {
  it("returns false when no env vars set", () => {
    expect(isBQConfigured()).toBe(false);
  });

  it("returns false when partially configured", () => {
    process.env.BQ_PROJECT_ID = "my-project";
    process.env.BQ_DATASET_ID = "my-dataset";
    expect(isBQConfigured()).toBe(false);
  });

  it("returns true when all four vars set", () => {
    FULL_ENV();
    expect(isBQConfigured()).toBe(true);
  });
});

// ─── runBQQuery ───────────────────────────────────────────────────────────────

describe("runBQQuery", () => {
  beforeEach(FULL_ENV);

  it("throws when BQ_PROJECT_ID missing", async () => {
    delete process.env.BQ_PROJECT_ID;
    await expect(runBQQuery("SELECT 1")).rejects.toThrow("BQ_PROJECT_ID not set");
  });

  it("throws when BQ auth fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => "invalid_grant" });
    await expect(runBQQuery("SELECT 1")).rejects.toThrow("BQ auth failed");
  });

  it("throws when BQ query returns error", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => "Table not found" });
    await expect(runBQQuery("SELECT 1")).rejects.toThrow("BQ query error");
  });

  it("returns empty array when no rows in response", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobComplete: true,
        schema: { fields: [{ name: "date" }, { name: "clicks" }] },
      }),
    });
    const result = await runBQQuery("SELECT date, clicks FROM t");
    expect(result).toEqual([]);
  });

  it("parses rows and casts numeric fields", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobComplete: true,
        schema: {
          fields: [
            { name: "date" }, { name: "impressions" }, { name: "clicks" },
            { name: "spend" }, { name: "conversions" }, { name: "conversion_value" },
          ],
        },
        rows: [
          { f: [{ v: "2024-01-15" }, { v: "1000" }, { v: "50" }, { v: "25.5" }, { v: "3" }, { v: "150.0" }] },
        ],
      }),
    });

    const result = await runBQQuery("SELECT ...");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "2024-01-15",
      impressions: 1000,
      clicks: 50,
      spend: 25.5,
      conversions: 3,
      conversion_value: 150,
    });
  });

  it("sends parameterized query correctly", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobComplete: true, schema: { fields: [] } }),
    });

    await runBQQuery("SELECT * WHERE date = @date_from", { date_from: "2024-01-01" });

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.queryParameters).toEqual([
      { name: "date_from", parameterType: { type: "STRING" }, parameterValue: { value: "2024-01-01" } },
    ]);
  });
});

// ─── fetchBQAdsData ───────────────────────────────────────────────────────────

describe("fetchBQAdsData", () => {
  beforeEach(FULL_ENV);

  const mockBQResponse = (rows: { f: { v: string }[] }[] = []) => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobComplete: true,
        schema: {
          fields: [
            { name: "date" }, { name: "campaign" }, { name: "impressions" },
            { name: "clicks" }, { name: "spend" }, { name: "conversions" }, { name: "conversion_value" },
          ],
        },
        rows,
      }),
    });
  };

  it("returns empty array for no data", async () => {
    mockBQResponse([]);
    const result = await fetchBQAdsData("2024-01-01", "2024-01-31", "date,campaign");
    expect(result).toEqual([]);
  });

  it("builds query with date group by", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobComplete: true, schema: { fields: [] } }),
    });

    await fetchBQAdsData("2024-01-01", "2024-01-31", "date");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("FORMAT_DATE");
    expect(body.query).not.toContain("campaign_name");
    expect(body.query).toContain("GROUP BY 1");
  });

  it("builds query with campaign group by", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobComplete: true, schema: { fields: [] } }),
    });

    await fetchBQAdsData("2024-01-01", "2024-01-31", "campaign");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("campaign_name");
    expect(body.query).not.toContain("FORMAT_DATE");
    expect(body.query).toContain("GROUP BY 1");
  });

  it("builds query with date,campaign group by", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobComplete: true, schema: { fields: [] } }),
    });

    await fetchBQAdsData("2024-01-01", "2024-01-31", "date,campaign");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("FORMAT_DATE");
    expect(body.query).toContain("campaign_name");
    expect(body.query).toContain("GROUP BY 1, 2");
  });

  it("uses correct table name from env vars", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobComplete: true, schema: { fields: [] } }),
    });

    await fetchBQAdsData("2024-01-01", "2024-01-31", "date");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("`my-project.my-dataset.p_ads_CampaignStats_123`");
  });

  it("respects BQ_COL_COST and BQ_COST_DIVISOR overrides", async () => {
    process.env.BQ_COL_COST = "spend_uah";
    process.env.BQ_COST_DIVISOR = "1";
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobComplete: true, schema: { fields: [] } }),
    });

    await fetchBQAdsData("2024-01-01", "2024-01-31", "date");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("spend_uah");
    expect(body.query).toContain("/ 1 as spend");

    delete process.env.BQ_COL_COST;
    delete process.env.BQ_COST_DIVISOR;
  });
});
