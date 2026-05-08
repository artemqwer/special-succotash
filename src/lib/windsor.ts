export interface WindsorDataRow {
  date?: string;
  campaign?: string;
  clicks: number;
  impressions: number;
  spend: number;
  conversions: number;
  conversion_value: number;
  [key: string]: unknown;
}

export type WindsorGroupBy = "date" | "campaign" | "date,campaign";

export async function fetchWindsorData(
  dateFrom: string,
  dateTo: string,
  groupBy: WindsorGroupBy = "date"
): Promise<{ data: WindsorDataRow[]; error?: string; source?: string }> {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, group_by: groupBy });
  const res = await fetch(`/api/windsor?${params}`);
  const json = await res.json();

  if (!res.ok) {
    return { data: [], error: json.error ?? `HTTP ${res.status}` };
  }

  const rows: WindsorDataRow[] = Array.isArray(json?.data) ? json.data : [];
  return { data: rows, source: json.source };
}
