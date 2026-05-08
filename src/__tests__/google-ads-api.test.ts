import { isGoogleAdsApiConfigured } from "@/lib/google-ads-api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  delete process.env.GOOGLE_ADS_CUSTOMER_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
});

describe("isGoogleAdsApiConfigured", () => {
  it("returns false when no env vars", () => {
    expect(isGoogleAdsApiConfigured()).toBe(false);
  });

  it("returns false when only developer token set", () => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "test-token";
    expect(isGoogleAdsApiConfigured()).toBe(false);
  });

  it("returns true when both vars set", () => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "test-token";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "123-456-7890";
    expect(isGoogleAdsApiConfigured()).toBe(true);
  });
});

describe("fetchGoogleAdsApiData", () => {
  beforeEach(() => {
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "dev-token-123";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "1234567890";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
  });

  it("refreshes access token before making API call", async () => {
    const { fetchGoogleAdsApiData } = await import("@/lib/google-ads-api");

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "new-access-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], nextPageToken: undefined }),
      });

    await fetchGoogleAdsApiData("2024-01-01", "2024-01-31", "date", "refresh-token-123");

    // First call is token refresh
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({ method: "POST" })
    );

    // Second call is Google Ads API
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("googleads.googleapis.com"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "developer-token": "dev-token-123",
          Authorization: "Bearer new-access-token",
        }),
      })
    );
  });

  it("maps API response to WindsorDataRow format", async () => {
    jest.resetModules();
    const { fetchGoogleAdsApiData } = await import("@/lib/google-ads-api");

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              segments: { date: "2024-01-15" },
              campaign: { name: "PMax: Summer Sale" },
              metrics: {
                impressions: "5000",
                clicks: "200",
                costMicros: "50000000",
                conversions: "10",
                conversionsValue: "500",
              },
            },
          ],
        }),
      });

    const result = await fetchGoogleAdsApiData("2024-01-01", "2024-01-31", "date,campaign", "refresh-token");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2024-01-15",
      campaign: "PMax: Summer Sale",
      impressions: 5000,
      clicks: 200,
      spend: 50,
      conversions: 10,
      conversion_value: 500,
    });
  });

  it("handles pagination with nextPageToken", async () => {
    jest.resetModules();
    const { fetchGoogleAdsApiData } = await import("@/lib/google-ads-api");

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      })
      // First page
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ segments: { date: "2024-01-01" }, campaign: { name: "Camp A" }, metrics: { impressions: "100", clicks: "10", costMicros: "1000000", conversions: "1", conversionsValue: "50" } }],
          nextPageToken: "token-page-2",
        }),
      })
      // Second page
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ segments: { date: "2024-01-02" }, campaign: { name: "Camp B" }, metrics: { impressions: "200", clicks: "20", costMicros: "2000000", conversions: "2", conversionsValue: "100" } }],
        }),
      });

    const result = await fetchGoogleAdsApiData("2024-01-01", "2024-01-31", "date,campaign", "refresh-token");
    expect(result).toHaveLength(2);
  });

  it("throws when token refresh fails", async () => {
    jest.resetModules();
    const { fetchGoogleAdsApiData } = await import("@/lib/google-ads-api");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "invalid_grant: Token has been expired",
    });

    await expect(
      fetchGoogleAdsApiData("2024-01-01", "2024-01-31", "date", "expired-refresh-token")
    ).rejects.toThrow("Token refresh failed");
  });
});
