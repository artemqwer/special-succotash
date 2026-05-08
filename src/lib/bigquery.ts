import crypto from "crypto";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

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
      scope: "https://www.googleapis.com/auth/bigquery",
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

export interface AdsRow {
  date?: string;
  campaign?: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversion_value: number;
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

export async function writeBQAdsRows(userId: string, rows: AdsRow[]): Promise<void> {
  if (!rows.length) return;
  const projectId = process.env.BQ_PROJECT_ID;
  const datasetId = process.env.BQ_DATASET_ID;
  const tableId = process.env.BQ_TABLE;
  if (!projectId || !datasetId || !tableId) throw new Error("BigQuery not configured");

  const token = await getServiceAccountToken();

  const insertRows = rows.map((row) => ({
    insertId: `${userId}-${row.date ?? "nodate"}-${row.campaign ?? "all"}`,
    json: {
      user_id: userId,
      date: row.date ?? null,
      campaign: row.campaign ?? null,
      impressions: row.impressions,
      clicks: row.clicks,
      spend: row.spend,
      conversions: row.conversions,
      conversion_value: row.conversion_value,
      synced_at: new Date().toISOString(),
    },
  }));

  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables/${tableId}/insertAll`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rows: insertRows, skipInvalidRows: false }),
    }
  );

  if (!res.ok) throw new Error(`BQ insert error: ${await res.text()}`);
  const result = await res.json();
  if (result.insertErrors?.length) {
    throw new Error(`BQ insert errors: ${JSON.stringify(result.insertErrors[0])}`);
  }
}

export async function fetchBQAdsData(
  dateFrom: string,
  dateTo: string,
  groupBy: "date" | "campaign" | "date,campaign",
  userId: string
): Promise<BQRow[]> {
  const project = process.env.BQ_PROJECT_ID;
  const dataset = process.env.BQ_DATASET_ID;
  const table = process.env.BQ_TABLE;
  const fullTable = `\`${project}.${dataset}.${table}\``;

  const selectCols =
    groupBy === "date"
      ? ["date"]
      : groupBy === "campaign"
      ? ["campaign"]
      : ["date", "campaign"];

  const groupCols = groupBy === "date" ? "1" : groupBy === "campaign" ? "1" : "1, 2";

  const query = `
    SELECT
      ${selectCols.join(", ")},
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      SUM(spend) as spend,
      SUM(conversions) as conversions,
      SUM(conversion_value) as conversion_value
    FROM ${fullTable}
    WHERE date BETWEEN @date_from AND @date_to
      AND user_id = @user_id
    GROUP BY ${groupCols}
    ORDER BY ${groupCols}
  `;

  return runBQQuery(query, { date_from: dateFrom, date_to: dateTo, user_id: userId });
}
