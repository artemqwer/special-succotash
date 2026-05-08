/**
 * Unit tests for src/lib/bigquery.ts
 */

jest.mock("crypto", () => ({
  createSign: jest.fn(() => ({
    update: jest.fn(),
    sign: jest.fn(() => "fake-sig"),
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { isBQConfigured, fetchBQAdsData, runBQQuery, writeBQAdsRows } from "@/lib/bigquery";

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
  process.env.BQ_TABLE = "ads_data";
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
});

// ─── writeBQAdsRows ───────────────────────────────────────────────────────────

describe("writeBQAdsRows", () => {
  beforeEach(FULL_ENV);

  const ROW = { date: "2024-01-01", campaign: "PMax", impressions: 1000, clicks: 50, spend: 25, conversions: 3, conversion_value: 150 };

  it("does nothing when rows array is empty", async () => {
    await writeBQAdsRows("user-1", []);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends rows to BQ insertAll endpoint", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await writeBQAdsRows("user-1", [ROW]);

    const [url, opts] = mockFetch.mock.calls[1];
    expect(url).toContain("insertAll");
    const body = JSON.parse(opts.body);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].json.user_id).toBe("user-1");
    expect(body.rows[0].json.campaign).toBe("PMax");
  });

  it("uses deterministic insertId for deduplication", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await writeBQAdsRows("user-1", [ROW]);

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.rows[0].insertId).toBe("user-1-2024-01-01-PMax");
  });

  it("throws on BQ insert errors", async () => {
    mockSAToken();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ insertErrors: [{ index: 0, errors: [{ reason: "invalid" }] }] }),
    });

    await expect(writeBQAdsRows("user-1", [ROW])).rejects.toThrow("BQ insert errors");
  });
});

// ─── fetchBQAdsData ───────────────────────────────────────────────────────────

describe("fetchBQAdsData", () => {
  beforeEach(FULL_ENV);

  const mockBQResponse = () => {
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
        rows: [],
      }),
    });
  };

  it("filters by user_id", async () => {
    mockBQResponse();
    await fetchBQAdsData("2024-01-01", "2024-01-31", "date", "user-abc");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("user_id = @user_id");
    const userParam = body.queryParameters.find((p: { name: string }) => p.name === "user_id");
    expect(userParam.parameterValue.value).toBe("user-abc");
  });

  it("selects only date when group_by is date", async () => {
    mockBQResponse();
    await fetchBQAdsData("2024-01-01", "2024-01-31", "date", "user-1");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("GROUP BY 1");
  });

  it("selects date and campaign when group_by is date,campaign", async () => {
    mockBQResponse();
    await fetchBQAdsData("2024-01-01", "2024-01-31", "date,campaign", "user-1");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("GROUP BY 1, 2");
  });

  it("uses correct table from env vars", async () => {
    mockBQResponse();
    await fetchBQAdsData("2024-01-01", "2024-01-31", "date", "user-1");

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.query).toContain("`my-project.my-dataset.ads_data`");
  });
});
