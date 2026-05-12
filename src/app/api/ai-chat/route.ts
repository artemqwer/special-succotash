import { NextRequest, NextResponse } from "next/server";

interface CampaignContext {
  name: string;
  type: string;
  cost: string;
  revenue: string;
  roas: string;
  clicks: number;
  conversions: number;
  cpa: string;
}

interface KpiContext {
  label: string;
  value: string;
  trend: string;
}

interface DashboardContext {
  dateRange: string;
  connected: boolean;
  dataSource: string | null;
  kpis: KpiContext[] | null;
  campaigns?: CampaignContext[];
}

function buildSystemPrompt(ctx: DashboardContext): string {
  let prompt = `You are DataRocks AI — an expert Google Ads performance analyst embedded in the DataRocks dashboard.

Period: ${ctx.dateRange}
Data source: ${ctx.connected ? (ctx.dataSource ?? "connected") : "not connected — no real data available"}

`;

  if (ctx.kpis) {
    prompt += `ACCOUNT KPIs:\n`;
    ctx.kpis.forEach(k => {
      prompt += `  • ${k.label}: ${k.value} (${k.trend} vs prev period)\n`;
    });
    prompt += "\n";
  }

  if (ctx.campaigns && ctx.campaigns.length > 0) {
    prompt += `CAMPAIGNS (${ctx.campaigns.length} shown):\n`;
    ctx.campaigns.forEach(c => {
      prompt += `  • ${c.name} [${c.type}] — spend: ${c.cost}, revenue: ${c.revenue}, ROAS: ${c.roas}, CPA: ${c.cpa}, clicks: ${c.clicks}, conv: ${c.conversions}\n`;
    });
    prompt += "\n";
  }

  prompt += `RULES:
- Be concise and actionable (max 3-4 short paragraphs or a short bullet list)
- Always reference actual numbers from the data above
- If data is not connected, tell the user to connect a data source
- Respond in the same language the user writes in`;

  return prompt;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
  }

  const { message, context, history = [] } = await req.json();

  const messages = [
    { role: "system", content: buildSystemPrompt(context) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Groq error: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "No response received.";

  return NextResponse.json({ text });
}
