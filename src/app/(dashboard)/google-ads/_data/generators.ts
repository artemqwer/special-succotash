"use client";

import { CAMPAIGNS, COLORS, DAY_MS, shareMatrix, AdPerfItem, PlItem } from "./constants";

export function generatePeriodData(startMs: number, endMs: number) {
  const days = Math.round((endMs - startMs) / DAY_MS) + 1;
  const genDates = Array.from({ length: days }, (_, i) => {
    const d = new Date(startMs + i * DAY_MS);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const genTotals = genDates.map((_, i) => {
    const wd = new Date(startMs + i * DAY_MS).getDay();
    const base = (wd === 0 || wd === 6) ? 72000 : 87000;
    return Math.round(base + Math.sin(i * 0.5 + 1.3) * 7000 + Math.cos(i * 0.9 + 0.6) * 4000);
  });

  const genBarData = genDates.map((date, di) => {
    const obj: Record<string, string | number> = { date };
    const total = genTotals[di];
    const sm = shareMatrix[di % shareMatrix.length];
    let used = 0;
    CAMPAIGNS.forEach((c, i) => {
      const share = i === CAMPAIGNS.length - 1 ? Math.max(0, total - used) : Math.round(total * sm[i]);
      obj[c] = share; used += share;
    });
    obj.total = total;
    return obj;
  });

  const genCampaignAvgs = CAMPAIGNS.map((name, i) => ({
    name, color: COLORS[i],
    avg: genBarData.reduce((s, d) => s + (d[name] as number), 0) / genBarData.length,
  })).sort((a, b) => b.avg - a.avg);

  const genAdPerfData: AdPerfItem[] = genDates.map((date, i) => {
    const wd = new Date(startMs + i * DAY_MS).getDay();
    const base = (wd === 0 || wd === 6) ? 72000 : 87000;
    const convValue = Math.round(base + Math.sin(i * 0.5 + 1.3) * 7000 + Math.cos(i * 0.9 + 0.6) * 4000);
    const cost = Math.round(convValue * (0.27 + Math.sin(i * 0.4 + 0.8) * 0.04));
    const profit = convValue - cost;
    const clicks = Math.round(3200 + Math.sin(i * 0.6 + 2) * 900 + (wd === 0 || wd === 6 ? -600 : 0));
    const roas = parseFloat((convValue / cost).toFixed(2));
    return { date, convValue, cost, profit, clicks, roas, costBar: cost, profitBar: Math.max(0, profit) };
  });

  let cum = 0;
  const genPlData: PlItem[] = genDates.map((date, i) => {
    const dailyProfit = Math.round(1200 + Math.sin(i * 0.6 + 1.5) * 1100 + Math.cos(i * 0.4 + 0.8) * 600);
    cum += dailyProfit;
    return { date, dailyProfit, cumulative: cum };
  });

  const plTotal = genPlData[genPlData.length - 1].cumulative;
  const plAvgDaily = Math.round(plTotal / genPlData.length);
  const plProfitDays = genPlData.filter((r) => r.dailyProfit > 0).length;
  const plLossDays = genPlData.filter((r) => r.dailyProfit <= 0).length;

  return { dates: genDates, barData: genBarData, campaignAvgs: genCampaignAvgs, adPerfData: genAdPerfData, plData: genPlData, plTotal, plAvgDaily, plProfitDays, plLossDays };
}

export function getMockAiResponse(input: string): { text: string; suggestions: string[] } {
  const lo = input.toLowerCase();
  if (lo.includes("roas")) return { text: "📈 **ROAS Analysis**\n\nYour current ROAS is **3.58x** across all campaigns.\n\n**Top performers:**\n• Search - Men T-Shirts: **470%** ROAS\n• Shopping - Winter Clearance: **210%** ROAS\n\n**Needs attention:**\n• Search - Men Shirts: **42%** ROAS (below target)\n• Display - Retargeting: **24%** ROAS\n\nI recommend pausing underperforming campaigns and reallocating budget to top performers.", suggestions: ["How can I improve low ROAS?", "Show budget allocation", "Compare with previous period"] };
  if (lo.includes("perform") || lo.includes("account")) return { text: "📊 **Account Performance Summary**\n\nYour account is performing **above average** this period.\n\n• **Revenue:** $759.69K (+18.2% vs prev period)\n• **Profit:** $547.73K (+22.8% vs prev period)\n• **ROAS:** 3.58x\n• **Cost:** $211.96K (+6.4%)\n\nShopping and PMax campaigns are driving the most conversions. Clicks are up 8.3% while CPC decreased to $1.47.", suggestions: ["Which campaigns to scale?", "Show cost breakdown", "Forecast next 30 days"] };
  if (lo.includes("recommend") || lo.includes("optim")) return { text: "💡 **Optimization Recommendations**\n\nBased on your account data, here are my top recommendations:\n\n1. **Scale Search - Men T-Shirts** — 470% ROAS, increase budget by 30%\n2. **Pause Display - Retargeting** — 24% ROAS, negative ROI\n3. **Add negative keywords** to PMax campaigns to reduce wasted spend\n4. **Increase bids on mobile** — CTR 12% higher on mobile\n5. **Run A/B tests** on ad copy for Search campaigns", suggestions: ["Implement these changes", "Show keyword analysis", "What is my wasted spend?"] };
  if (lo.includes("issue") || lo.includes("problem")) return { text: "🔍 **Issues Found**\n\nI've identified **3 issues** in your account:\n\n⚠️ **High CPA campaigns:**\n• Display - Retargeting: CPA $93.3 (target: $30)\n• PMax - Men Pants: CPA $31.8\n\n⚠️ **Low conversion rate:**\n• PMax - Women Clothing: 0.31% (avg: 2.15%)\n\n⚠️ **Budget pacing:**\n• 2 campaigns running out of budget before end of day", suggestions: ["How to fix high CPA?", "Review budget pacing", "Show conversion tips"] };
  if (lo.includes("cost") || lo.includes("budget")) return { text: "💰 **Cost Analysis**\n\nTotal spend: **$211.96K** this period.\n\n**Budget breakdown:**\n• PMax campaigns: 41% of budget\n• Search campaigns: 35% of budget\n• Shopping: 14% of budget\n• Display: 10% of budget\n\n**Opportunity:** Reduce Display budget by 30% (lowest ROAS) and reallocate to Search.", suggestions: ["Reallocate budget", "Show ROI by channel", "Forecast with new budgets"] };
  return { text: "📊 Analyzing your campaign data...\n\nYour account has **45 active campaigns** generating $759.69K in revenue with a 3.58x ROAS. Key metrics look healthy with strong profit margins.\n\nWhat specific aspect would you like to explore?", suggestions: ["Performance trends", "Campaign comparison", "Keyword insights"] };
}
