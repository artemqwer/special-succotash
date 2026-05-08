/**
 * Tests for /api/windsor route — data source routing logic
 * Mocks: @supabase/ssr, next/headers, @/lib/bigquery, @/lib/google-ads-api, fetch
 */

const mockGetUser = jest.fn();
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve({ getAll: () => [] })),
}));

jest.mock("@/lib/bigquery", () => ({
  isBQConfigured: jest.fn(),
  fetchBQAdsData: jest.fn(),
}));

jest.mock("@/lib/google-ads-api", () => ({
  isGoogleAdsApiConfigured: jest.fn(),
  fetchGoogleAdsApiData: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/windsor/route";
import { isBQConfigured, fetchBQAdsData } from "@/lib/bigquery";
import { isGoogleAdsApiConfigured, fetchGoogleAdsApiData } from "@/lib/google-ads-api";

const mockIsBQ = isBQConfigured as jest.Mock;
const mockFetchBQ = fetchBQAdsData as jest.Mock;
const mockIsGAds = isGoogleAdsApiConfigured as jest.Mock;
const mockFetchGAds = fetchGoogleAdsApiData as jest.Mock;

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/windsor");
  url.searchParams.set("date_from", params.date_from ?? "2024-01-01");
  url.searchParams.set("date_to", params.date_to ?? "2024-01-31");
  if (params.group_by) url.searchParams.set("group_by", params.group_by);
  return GET(new NextRequest(url.toString()));
}

const AUTHED_USER = (extra: Record<string, unknown> = {}) =>
  mockGetUser.mockResolvedValue({
    data: { user: { id: "u1", user_metadata: extra } },
  });

beforeEach(() => {
  mockFetch.mockReset();
  mockGetUser.mockReset();
  mockIsBQ.mockReturnValue(false);
  mockFetchBQ.mockReset();
  mockIsGAds.mockReturnValue(false);
  mockFetchGAds.mockReset();
});

const BQ_DATA = [{ date: "2024-01-01", impressions: 1000, clicks: 50, spend: 25, conversions: 3, conversion_value: 150 }];

describe("GET /api/windsor — auth", () => {
  it("returns 400 when date params missing", async () => {
    AUTHED_USER();
    const req = new NextRequest("http://localhost/api/windsor");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await makeRequest();
    expect(res.status).toBe(401);
  });
});

describe("GET /api/windsor — BigQuery priority", () => {
  it("uses BigQuery when configured", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(true);
    mockFetchBQ.mockResolvedValue(BQ_DATA);

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.source).toBe("bigquery");
    expect(json.data).toHaveLength(1);
    expect(mockFetchBQ).toHaveBeenCalledWith("2024-01-01", "2024-01-31", "date");
  });

  it("returns 500 when BigQuery throws", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(true);
    mockFetchBQ.mockRejectedValue(new Error("BQ connection failed"));

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("BQ connection failed");
  });

  it("passes group_by param to BigQuery", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(true);
    mockFetchBQ.mockResolvedValue([]);

    await makeRequest({ date_from: "2024-01-01", date_to: "2024-01-31", group_by: "date,campaign" });

    expect(mockFetchBQ).toHaveBeenCalledWith("2024-01-01", "2024-01-31", "date,campaign");
  });
});

describe("GET /api/windsor — Google Ads API priority", () => {
  it("uses Google Ads API when configured and user has refresh token", async () => {
    AUTHED_USER({ google_ads_refresh_token: "refresh-xyz" });
    mockIsBQ.mockReturnValue(false);
    mockIsGAds.mockReturnValue(true);
    mockFetchGAds.mockResolvedValue(BQ_DATA);

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.source).toBe("google-ads-api");
    expect(mockFetchGAds).toHaveBeenCalledWith("2024-01-01", "2024-01-31", "date", "refresh-xyz");
  });

  it("skips Google Ads API when user has no refresh token", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(false);
    mockIsGAds.mockReturnValue(true);

    await makeRequest();

    expect(mockFetchGAds).not.toHaveBeenCalled();
  });

  it("BigQuery takes priority over Google Ads API", async () => {
    AUTHED_USER({ google_ads_refresh_token: "refresh-xyz" });
    mockIsBQ.mockReturnValue(true);
    mockIsGAds.mockReturnValue(true);
    mockFetchBQ.mockResolvedValue(BQ_DATA);

    const res = await makeRequest();
    const json = await res.json();

    expect(json.source).toBe("bigquery");
    expect(mockFetchGAds).not.toHaveBeenCalled();
  });
});

describe("GET /api/windsor — Windsor fallback", () => {
  it("uses Windsor when only windsor_api_key present", async () => {
    AUTHED_USER({ windsor_api_key: "w-key-123" });
    mockIsBQ.mockReturnValue(false);
    mockIsGAds.mockReturnValue(false);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: BQ_DATA }),
    });

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.source).toBe("windsor");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("windsor.ai"),
      expect.any(Object)
    );
  });

  it("returns 400 with message when no data source configured", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(false);
    mockIsGAds.mockReturnValue(false);

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("No data source configured");
  });

  it("returns Windsor API error status on failure", async () => {
    AUTHED_USER({ windsor_api_key: "w-key-123" });
    mockIsBQ.mockReturnValue(false);
    mockIsGAds.mockReturnValue(false);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    });

    const res = await makeRequest();
    expect(res.status).toBe(403);
  });
});
