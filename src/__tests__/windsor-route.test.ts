/**
 * Tests for /api/windsor route — reads user ads data from BigQuery
 */

const mockGetUser = jest.fn();

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

import { NextRequest } from "next/server";
import { GET } from "@/app/api/windsor/route";
import { isBQConfigured, fetchBQAdsData } from "@/lib/bigquery";

const mockIsBQ = isBQConfigured as jest.Mock;
const mockFetchBQ = fetchBQAdsData as jest.Mock;

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/windsor");
  url.searchParams.set("date_from", params.date_from ?? "2024-01-01");
  url.searchParams.set("date_to", params.date_to ?? "2024-01-31");
  if (params.group_by) url.searchParams.set("group_by", params.group_by);
  return GET(new NextRequest(url.toString()));
}

const AUTHED_USER = () =>
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-123", user_metadata: {} } },
  });

const ADS_DATA = [{ date: "2024-01-01", impressions: 1000, clicks: 50, spend: 25, conversions: 3, conversion_value: 150 }];

beforeEach(() => {
  mockGetUser.mockReset();
  mockIsBQ.mockReturnValue(false);
  mockFetchBQ.mockReset();
});

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

describe("GET /api/windsor — BigQuery", () => {
  it("returns 503 when BigQuery not configured", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(false);

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toContain("BigQuery not configured");
  });

  it("returns data from BigQuery filtered by user id", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(true);
    mockFetchBQ.mockResolvedValue(ADS_DATA);

    const res = await makeRequest();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.source).toBe("bigquery");
    expect(json.data).toHaveLength(1);
    expect(mockFetchBQ).toHaveBeenCalledWith("2024-01-01", "2024-01-31", "date", "user-123");
  });

  it("passes group_by to BigQuery", async () => {
    AUTHED_USER();
    mockIsBQ.mockReturnValue(true);
    mockFetchBQ.mockResolvedValue([]);

    await makeRequest({ date_from: "2024-01-01", date_to: "2024-01-31", group_by: "date,campaign" });

    expect(mockFetchBQ).toHaveBeenCalledWith("2024-01-01", "2024-01-31", "date,campaign", "user-123");
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
});
