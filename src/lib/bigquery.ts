import crypto from "crypto";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

// Supports both raw JSON string and base64-encoded JSON
function parseServiceAccount(): ServiceAccount {
  const raw = process.env.BQ_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("BQ_SERVICE_ACCOUNT_JSON not set");
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  }
}

function buildJWT(sa: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/bigquery.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const sig = signer.sign(sa.private_key, "base64url");
  return `${header}.${payload}.${sig}`;
}

async function getServiceAccountToken(): Promise<string> {
  const sa = parseServiceAccount();
  const jwt = buildJWT(sa);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`BQ auth failed: ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token as string;
}

export interface BQRow {
  [key: string]: string | number | null;
}

function parseBQRows(data: {
  schema?: { fields: { name: string }[] };
  rows?: { f: { v: string | null }[] }[];
}): BQRow[] {
  if (!data.rows || !data.schema) return [];
  const fields = data.schema.fields.map((f) => f.name);
  const numericFields = new Set(["impressions", "clicks", "spend", "conversions", "conversion_value"]);
  return data.rows.map((row) =>
    Object.fromEntries(
      row.f.map((cell, i) => [
        fields[i],
        numericFields.has(fields[i]) ? parseFloat(cell.v ?? "0") || 0 : (cell.v ?? null),
      ])
    )
  );
}

async function pollJob(projectId: string, jobId: string, token: string): Promise<BQRow[]> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/jobs/${jobId}/getQueryResults?timeoutMs=5000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (data.jobComplete) return parseBQRows(data);
  }
  throw new Error("BigQuery job timed out");
}

export async function runBQQuery(
  query: string,
  params: Record<string, string> = {}
): Promise<BQRow[]> {
  const projectId = process.env.BQ_PROJECT_ID;
  if (!projectId) throw new Error("BQ_PROJECT_ID not set");
  const token = await getServiceAccountToken();

  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        useLegacySql: false,
        timeoutMs: 30000,
        maxResults: 50000,
        queryParameters: Object.entries(params).map(([name, value]) => ({
          name,
          parameterType: { type: "STRING" },
          parameterValue: { value },
        })),
      }),
    }
  );

  if (!res.ok) throw new Error(`BQ query error: ${await res.text()}`);
  const data = await res.json();
  if (!data.jobComplete) return pollJob(projectId, data.jobReference.jobId, token);
  return parseBQRows(data);
}

export function isBQConfigured(): boolean {
  return !!(
    process.env.BQ_SERVICE_ACCOUNT_JSON &&
    process.env.BQ_PROJECT_ID &&
    process.env.BQ_DATASET_ID &&
    process.env.BQ_TABLE
  );
}

// ─── Google Ads → BigQuery Transfer schema ────────────────────────────────────
// Default column names match the standard Google Ads BQ Data Transfer tables:
// p_ads_CampaignStats_{customer_id}
//
// If your schema differs, override via env vars:
//   BQ_COL_DATE            (default: _DATA_DATE)
//   BQ_COL_CAMPAIGN        (default: campaign_name)
//   BQ_COL_CLICKS          (default: clicks)
//   BQ_COL_IMPRESSIONS     (default: impressions)
//   BQ_COL_COST            (default: cost_micros)
//   BQ_COST_DIVISOR        (default: 1000000 — set to 1 if cost is already in $)
//   BQ_COL_CONVERSIONS     (default: conversions)
//   BQ_COL_CONV_VALUE      (default: conversions_value)
//   BQ_DATE_FILTER_COL     (default: _DATA_DATE — column used in WHERE date range)
// ─────────────────────────────────────────────────────────────────────────────

function col(envKey: string, fallback: string): string {
  return process.env[envKey] ?? fallback;
}

export async function fetchBQAdsData(
  dateFrom: string,
  dateTo: string,
  groupBy: "date" | "campaign" | "date,campaign"
): Promise<BQRow[]> {
  const project = process.env.BQ_PROJECT_ID;
  const dataset = process.env.BQ_DATASET_ID;
  const table = process.env.BQ_TABLE;
  const fullTable = `\`${project}.${dataset}.${table}\``;

  const dateCol = col("BQ_COL_DATE", "_DATA_DATE");
  const campaignCol = col("BQ_COL_CAMPAIGN", "campaign_name");
  const clicksCol = col("BQ_COL_CLICKS", "clicks");
  const impressionsCol = col("BQ_COL_IMPRESSIONS", "impressions");
  const costCol = col("BQ_COL_COST", "cost_micros");
  const costDivisor = col("BQ_COST_DIVISOR", "1000000");
  const conversionsCol = col("BQ_COL_CONVERSIONS", "conversions");
  const convValueCol = col("BQ_COL_CONV_VALUE", "conversions_value");
  const filterCol = col("BQ_DATE_FILTER_COL", "_DATA_DATE");

  const selectDate = `FORMAT_DATE('%Y-%m-%d', ${dateCol}) as date`;
  const selectCampaign = `${campaignCol} as campaign`;
  const selectMetrics = `
    SUM(${impressionsCol}) as impressions,
    SUM(${clicksCol}) as clicks,
    SUM(${costCol}) / ${costDivisor} as spend,
    SUM(${conversionsCol}) as conversions,
    SUM(${convValueCol}) as conversion_value`;

  const selectCols =
    groupBy === "date"
      ? [selectDate]
      : groupBy === "campaign"
      ? [selectCampaign]
      : [selectDate, selectCampaign];

  const groupCols = groupBy === "date" ? "1" : groupBy === "campaign" ? "1" : "1, 2";

  const query = `
    SELECT
      ${selectCols.join(",\n      ")},
      ${selectMetrics}
    FROM ${fullTable}
    WHERE ${filterCol} BETWEEN @date_from AND @date_to
    GROUP BY ${groupCols}
    ORDER BY ${groupCols}
  `;

  return runBQQuery(query, { date_from: dateFrom, date_to: dateTo });
}
