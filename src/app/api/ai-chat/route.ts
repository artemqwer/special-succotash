import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CampaignContext {
  name: string; type: string; cost: string; revenue: string;
  roas: string; clicks: number; conversions: number; cpa: string;
}
interface KpiContext { label: string; value: string; trend: string; }
interface DashboardContext {
  dateRange: string; connected: boolean; dataSource: string | null;
  kpis: KpiContext[] | null; campaigns?: CampaignContext[];
}

const SET_DATE_RANGE_TOOL = {
  type: "function",
  function: {
    name: "set_date_range",
    description: [
      "ONLY use this tool when the user explicitly asks to CHANGE, SELECT, SWITCH, or SET a date range or period.",
      "Examples that should trigger this tool: 'show me 2022', 'switch to March 2023', 'select last month', 'set period to Q1 2024'.",
      "Do NOT use this tool for: analysis questions, recommendations, chart explanations, or any request that doesn't explicitly ask to change the date.",
    ].join(" "),
    parameters: {
      type: "object",
      properties: {
        start: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end:   { type: "string", description: "End date in YYYY-MM-DD format" },
        label: { type: "string", description: "Short label, e.g. '2022', 'March 2023', 'Q1 2024'" },
      },
      required: ["start", "end", "label"],
    },
  },
};

async function groq(apiKey: string, body: object): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function buildSystemPrompt(ctx: DashboardContext): string {
  const today = new Date().toISOString().split("T")[0];
  let prompt = `You are DataRocks AI — an expert Google Ads performance analyst embedded in the DataRocks dashboard.
Today's date: ${today}
Current period: ${ctx.dateRange}
Data source: ${ctx.connected ? (ctx.dataSource ?? "connected") : "not connected — no real data available"}

`;

  if (ctx.kpis) {
    prompt += `ACCOUNT KPIs:\n`;
    ctx.kpis.forEach(k => { prompt += `  • ${k.label}: ${k.value} (${k.trend} vs prev period)\n`; });
    prompt += "\n";
  }

  if (ctx.campaigns?.length) {
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
- Use set_date_range ONLY when the user explicitly asks to change/select/switch the time period — NOT for analysis or recommendations
- After the date is changed, provide a brief analysis of the data for that period
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
  if (!apiKey) return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });

  const { message, context, history = [] } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    { role: "system", content: buildSystemPrompt(context) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...history.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  // Stage 1: allow tool call
  const res1 = await groq(apiKey, {
    model: "llama-3.3-70b-versatile",
    messages,
    tools: [SET_DATE_RANGE_TOOL],
    tool_choice: "auto",
    max_tokens: 1024,
    temperature: 0.4,
  });

  if (!res1.ok) {
    return NextResponse.json({ error: `Groq error: ${await res1.text()}` }, { status: 500 });
  }

  const data1 = await res1.json();
  const choice1 = data1.choices?.[0];

  if (choice1?.finish_reason === "tool_calls") {
    const toolCall = choice1.message?.tool_calls?.[0];
    if (toolCall?.function?.name === "set_date_range") {
      let params: { start: string; end: string; label: string };
      try {
        params = JSON.parse(toolCall.function.arguments);
      } catch {
        return NextResponse.json({ error: "Failed to parse date range from AI" }, { status: 500 });
      }

      // Stage 2: continue with tool result so the model also answers the original question
      const messagesWithResult = [
        ...messages,
        choice1.message,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: `Date range changed to ${params.label} (${params.start} to ${params.end}). Now provide a brief analysis or confirmation for the user based on the current data.`,
        },
      ];

      const res2 = await groq(apiKey, {
        model: "llama-3.3-70b-versatile",
        messages: messagesWithResult,
        max_tokens: 1024,
        temperature: 0.4,
      });

      const text = res2.ok
        ? ((await res2.json()).choices?.[0]?.message?.content ?? "Done!")
        : "Done!";

      return NextResponse.json({
        text,
        dateAction: { start: params.start, end: params.end, label: params.label },
      });
    }
  }

  const text: string = choice1?.message?.content ?? "No response received.";
  return NextResponse.json({ text });
}
