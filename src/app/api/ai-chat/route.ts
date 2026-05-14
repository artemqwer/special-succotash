import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

const SET_DATE_RANGE_TOOL = {
  type: "function",
  function: {
    name: "set_date_range",
    description: "Change the dashboard date range. Use this when the user asks to select a specific period, year, month, quarter, or any custom date range.",
    parameters: {
      type: "object",
      properties: {
        start: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end:   { type: "string", description: "End date in YYYY-MM-DD format" },
        label: { type: "string", description: "Human-readable label, e.g. '2022', 'Q1 2023', 'January 2024', 'Last 30 days'" },
      },
      required: ["start", "end", "label"],
    },
  },
};

function buildSystemPrompt(ctx: DashboardContext): string {
  const today = new Date().toISOString().split("T")[0];
  let prompt = `You are DataRocks AI — an expert Google Ads performance analyst embedded in the DataRocks dashboard.
Today's date: ${today}
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
- When the user asks to select/switch/change a date range or period, use the set_date_range tool — do not just describe it
- Respond in the same language the user writes in`;

  return prompt;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      tools: [SET_DATE_RANGE_TOOL],
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Groq error: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  // Handle tool call
  if (choice?.finish_reason === "tool_calls") {
    const toolCall = choice.message?.tool_calls?.[0];
    if (toolCall?.function?.name === "set_date_range") {
      try {
        const params = JSON.parse(toolCall.function.arguments) as { start: string; end: string; label: string };
        const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return NextResponse.json({
          text: `Done! Switched to **${params.label}** — ${fmt(params.start)} → ${fmt(params.end)}.`,
          dateAction: { start: params.start, end: params.end, label: params.label },
        });
      } catch {
        return NextResponse.json({ error: "Failed to parse date range from AI" }, { status: 500 });
      }
    }
  }

  const text: string = choice?.message?.content ?? "No response received.";
  return NextResponse.json({ text });
}
