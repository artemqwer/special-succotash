"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { fetchWindsorData } from "@/lib/windsor";

// ─── Data imports ─────────────────────────────────────────────────────────────
import {
  kpis, sparkData, campaignRows, tabs,
  CAMPAIGNS, COLORS, CAMPAIGN_TYPE_MAP, TYPES, TYPE_COLORS_MAP,
  CHART_METRICS, CHART_GROUPBY,
  END_MS, DAY_MS, fmtMs,
  TYPE_TO_GROUPS,
  ChartMetric, ChartGroupBy, SortDir, SortKey, AdPerfItem, PlItem, AiMessage,
} from "./_data/constants";
import { generatePeriodData, getMockAiResponse } from "./_data/generators";

// ─── Component imports ────────────────────────────────────────────────────────
import KpiCard from "./_components/KpiCard";
import CampaignTable from "./_components/CampaignTable";
import AiSidebar from "./_components/AiSidebar";
import DatePickerPanel from "./_components/DatePickerPanel";
import MobileDatePicker from "./_components/MobileDatePicker";
import AddEventModal from "./_components/AddEventModal";
import Timeline from "./_components/Timeline";
import TabContent from "./_components/TabContent";
import { makeRenderConvLabel, makeRenderLossTopLabel, makeRenderTotalLabel } from "./_components/ChartPrimitives";

export default function GoogleAdsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<SortKey | null>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [campaignDropdownOpen, setCampaignDropdownOpen] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Status");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [expandedNameIdx, setExpandedNameIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [rangeStart, setRangeStart] = useState(END_MS - 13 * DAY_MS);
  const [rangeEnd, setRangeEnd] = useState(END_MS);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const openDatePicker = () => {
    setPickerTempStart(rangeStart);
    setPickerTempEnd(rangeEnd);
    setPickerStep(0);
    setPickerHover(null);
    const d = new Date(rangeStart);
    setPickerViewYear(d.getFullYear());
    setPickerViewMonth(d.getMonth());
    setDatePickerOpen(true);
  };
  const openDatePickerRef = useRef(openDatePicker);
  useEffect(() => { openDatePickerRef.current = openDatePicker; });
  const [pickerTempStart, setPickerTempStart] = useState<number | null>(null);
  const [pickerTempEnd, setPickerTempEnd] = useState<number | null>(null);
  const [pickerHover, setPickerHover] = useState<number | null>(null);
  const [pickerStep, setPickerStep] = useState<0 | 1>(0);
  const [pickerViewYear, setPickerViewYear] = useState(2026);
  const [pickerViewMonth, setPickerViewMonth] = useState(2);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [clickedRow, setClickedRow] = useState<number | null>(null);
  const [namesCollapsed, setNamesCollapsed] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [granularity, setGranularity] = useState<"days" | "weeks" | "months">("days");
  const [granularityOpen, setGranularityOpen] = useState(false);
  const [hiddenAdPerf, setHiddenAdPerf] = useState<Set<string>>(new Set());
  const [hiddenPL, setHiddenPL] = useState<Set<string>>(new Set());
  const [chartMetric, setChartMetric] = useState<ChartMetric>("Revenue");
  const [chartGroupBy, setChartGroupBy] = useState<ChartGroupBy>("Campaign");
  const [chartMetricOpen, setChartMetricOpen] = useState(false);
  const [chartGroupByOpen, setChartGroupByOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState<AiMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [evtCategory, setEvtCategory] = useState<"Events" | "Ads" | "Website">("Events");
  const [evtType, setEvtType] = useState<string | null>(null);
  const [evtStartDate, setEvtStartDate] = useState("2026-04-14");
  const [evtEndDate, setEvtEndDate] = useState("");
  const [evtTitle, setEvtTitle] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [daysUpToToday, setDaysUpToToday] = useState<number | string>(30);
  const [windsorApiKey, setWindsorApiKey] = useState("");
  const [isWindsorLoading, setIsWindsorLoading] = useState(false);
  const [windsorError, setWindsorError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [realCampaignRows, setRealCampaignRows] = useState<any[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [realBarData, setRealBarData] = useState<any[] | null>(null);

  useEffect(() => {
    if (!windsorApiKey) {
      setRealCampaignRows(null);
      setRealBarData(null);
      return;
    }

    const loadData = async () => {
      setIsWindsorLoading(true);
      setWindsorError(null);
      try {
        const start = new Date(rangeStart).toISOString().split('T')[0];
        const end = new Date(rangeEnd).toISOString().split('T')[0];

        const campData = await fetchWindsorData(windsorApiKey, start, end, 'campaign');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedRows = campData.map((d: any) => {
          const roasNum = d.spend > 0 ? (Number(d.conversion_value) / Number(d.spend)) * 100 : 0;
          const revenue = Number(d.conversion_value) || 0;
          const cost = Number(d.spend) || 0;
          return {
            status: cost > 0 ? "green" : "gray",
            name: d.campaign || "Unknown",
            type: "Search",
            roas: d.spend > 0 ? `${roasNum.toFixed(0)}%` : "null",
            roasColor: d.spend === 0 ? "gray" : roasNum >= 150 ? "green" : roasNum >= 100 ? "orange" : "red",
            impr: Number(d.impressions) || 0,
            clicks: Number(d.clicks) || 0,
            cpc: d.clicks > 0 ? cost / Number(d.clicks) : 0,
            ctr: d.impressions > 0 ? (Number(d.clicks) / Number(d.impressions)) * 100 : 0,
            convRate: d.clicks > 0 ? (Number(d.conversions) / Number(d.clicks)) * 100 : 0,
            conv: Number(d.conversions) || 0,
            cpa: d.conversions > 0 ? cost / Number(d.conversions) : 0,
            revenue,
            cost,
            profit: revenue - cost,
            roasVal: roasNum,
          };
        });
        setRealCampaignRows(mappedRows);

        const dailyData = await fetchWindsorData(windsorApiKey, start, end, 'date,campaign');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateMap: Record<string, any> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dailyData.forEach((d: any) => {
          const dt = d.date!;
          if (!dateMap[dt]) {
            dateMap[dt] = {
              date: new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              total: 0,
              cost: 0,
              clicks: 0,
              profit: 0,
              conv: 0
            };
          }
          const rev = Number(d.conversion_value) || 0;
          const cost = Number(d.spend) || 0;
          const clicks = Number(d.clicks) || 0;
          const conv = Number(d.conversions) || 0;
          const name = d.campaign || 'Unknown';

          dateMap[dt][name] = rev;
          dateMap[dt][`_cost_${name}`] = cost;
          dateMap[dt][`_clicks_${name}`] = clicks;
          dateMap[dt][`_conv_${name}`] = conv;

          dateMap[dt].total += rev;
          dateMap[dt].cost += cost;
          dateMap[dt].clicks += clicks;
          dateMap[dt].profit += (rev - cost);
          dateMap[dt].conv += conv;
        });
        setRealBarData(Object.values(dateMap));
      } catch (err) {
        setWindsorError("API Error. Check key.");
      } finally {
        setIsWindsorLoading(false);
      }
    };

    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [windsorApiKey, rangeStart, rangeEnd]);

  const [daysUpToYesterday, setDaysUpToYesterday] = useState<number | string>(30);

  const handlePresetClick = (label: string) => {
    const today = new Date(END_MS);
    today.setUTCHours(0,0,0,0);
    const nowTs = today.getTime();
    let start = nowTs;
    let end = nowTs;

    switch (label) {
      case "Today":
        start = nowTs; end = nowTs; break;
      case "Yesterday":
        start = nowTs - DAY_MS; end = nowTs - DAY_MS; break;
      case "This week (Sun - Today)": {
        const d = new Date(nowTs);
        const day = d.getUTCDay();
        start = nowTs - day * DAY_MS;
        end = nowTs;
        break;
      }
      case "Last 7 days":
        start = nowTs - 6 * DAY_MS; end = nowTs; break;
      case "Last week (Sun - Sat)": {
        const d = new Date(nowTs);
        const day = d.getUTCDay();
        end = nowTs - (day + 1) * DAY_MS;
        start = end - 6 * DAY_MS;
        break;
      }
      case "Last 14 days":
        start = nowTs - 13 * DAY_MS; end = nowTs; break;
      case "This month": {
        const d = new Date(nowTs);
        d.setUTCDate(1);
        start = d.getTime(); end = nowTs; break;
      }
      case "Last 30 days":
        start = nowTs - 29 * DAY_MS; end = nowTs; break;
      case "Last month": {
        const d = new Date(nowTs);
        d.setUTCMonth(d.getUTCMonth() - 1);
        d.setUTCDate(1);
        start = d.getTime();
        const d2 = new Date(start);
        d2.setUTCMonth(d2.getUTCMonth() + 1);
        d2.setUTCDate(0);
        end = d2.getTime();
        break;
      }
      case "All time":
        start = Date.UTC(2025, 0, 1); end = nowTs; break;
      default: return;
    }
    setPickerTempStart(start);
    setPickerTempEnd(end);
    setPickerStep(0);
    const sd = new Date(start);
    setPickerViewMonth(sd.getUTCMonth());
    setPickerViewYear(sd.getUTCFullYear());
  };

  const { dates, barData, campaignAvgs, adPerfData, plData } = useMemo(
    () => {
      const mock = generatePeriodData(rangeStart, rangeEnd);
      if (realBarData) {
        const names = Array.from(new Set(realBarData.flatMap((d: Record<string, unknown>) => Object.keys(d).filter(k => k !== 'date' && k !== 'total' && !k.startsWith('_')))));

        const derivedAdPerfData: AdPerfItem[] = realBarData.map((d: Record<string, unknown>) => {
          const convValue = d.total as number;
          const cost = d.cost as number;
          const profit = d.profit as number;
          const clicks = d.clicks as number;
          const roas = cost > 0 ? convValue / cost : 0;
          return {
            date: d.date as string,
            convValue, cost, profit, clicks, roas,
            costBar: cost, profitBar: Math.max(0, profit)
          };
        });

        const derivedPlData: PlItem[] = realBarData.map((d: Record<string, unknown>) => ({
          date: d.date as string,
          dailyProfit: d.profit as number,
          cumulative: 0
        }));

        return {
          ...mock,
          barData: realBarData,
          adPerfData: derivedAdPerfData,
          plData: derivedPlData,
          campaignAvgs: names.map((name, i) => ({
            name,
            color: COLORS[i % COLORS.length],
            avg: realBarData.reduce((s: number, d: Record<string, unknown>) => s + ((d[name] as number) || 0), 0) / realBarData.length
          })).sort((a, b) => b.avg - a.avg)
        };
      }
      return mock;
    },
    [rangeStart, rangeEnd, realBarData]
  );

  const openAi = () => {
    if (aiMsgs.length === 0) {
      const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setAiMsgs([{ id: 1, role: "assistant", text: "👋 Hello! I'm your AI Assistant for **All Account Campaigns**.\n\nI have access to your complete account data and can help you:\n\n📊 Analyze account-wide performance trends\n💡 Provide optimization recommendations\n📈 Create custom charts and graphs\n📋 Show detailed data tables\n🎯 Answer specific questions about metrics\n\nWhat would you like to explore today?", time: t, suggestions: ["How is the account performing?", "What are your recommendations?", "Show me ROAS analysis"], pinned: false }]);
    }
    setAiOpen(true);
  };

  const sendAiMsg = (text?: string) => {
    const msg = (text ?? aiInput).trim();
    if (!msg || aiLoading) return;
    setAiInput("");
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setAiMsgs(prev => [...prev, { id: Date.now(), role: "user", text: msg, time: t, pinned: false }]);
    setAiLoading(true);
    setTimeout(() => {
      const r = getMockAiResponse(msg);
      const t2 = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setAiMsgs(prev => [...prev, { id: Date.now() + 1, role: "assistant", text: r.text, time: t2, suggestions: r.suggestions, pinned: false }]);
      setAiLoading(false);
    }, 1100);
  };

  const toggleAiPin = (id: number) => setAiMsgs(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMsgs, aiLoading]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    const isOpen = addEventOpen || aiOpen;
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [addEventOpen, aiOpen]);

  const toggleSeries = (name: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    const portraitMql = window.matchMedia("(orientation: portrait)");
    const checkOrientation = (e: MediaQueryListEvent | MediaQueryList) => setIsPortrait(e.matches);

    checkSize();
    checkOrientation(portraitMql);
    window.addEventListener("resize", checkSize);
    portraitMql.addEventListener("change", checkOrientation);

    const handleOpen = () => openDatePickerRef.current();
    window.addEventListener("open-date-picker", handleOpen);

    return () => {
      window.removeEventListener("resize", checkSize);
      portraitMql.removeEventListener("change", checkOrientation);
      window.removeEventListener("open-date-picker", handleOpen);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("date-range-changed", {
      detail: { start: rangeStart, end: rangeEnd }
    }));
  }, [rangeStart, rangeEnd]);

  const handleSort = (col: SortKey) => {
    setCheckedRows(new Set());
    setClickedRow(null);
    if (sortCol === col) {
      const next: SortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next);
      if (next === null) setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const currentRows = realCampaignRows || campaignRows;
  const types = ["All", ...Array.from(new Set(currentRows.map((r) => r.type)))];

  const filtered = useMemo(() => {
    const base = realCampaignRows || campaignRows;
    let rows = typeFilter === "All" ? base : base.filter((r) => r.type === typeFilter);
    if (statusFilter !== "Status") {
      const target = statusFilter === "Active" ? "green" : "gray";
      rows = rows.filter((r) => r.status === target);
    }
    if (selectedCampaigns.size > 0) rows = rows.filter((r) => selectedCampaigns.has(r.name));
    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol]; const bv = b[sortCol];
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [typeFilter, selectedCampaigns, sortCol, sortDir, realCampaignRows]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  useEffect(() => { setPage(1); }, [filtered, rowsPerPage]);

  const rowTypeFilter = useMemo(() => {
    const selTypes = new Set<string>();
    if (clickedRow !== null && filtered[clickedRow]) selTypes.add(filtered[clickedRow].type);
    checkedRows.forEach((i) => { if (filtered[i]) selTypes.add(filtered[i].type); });
    if (selTypes.size === 0) return null;
    const groups = new Set<string>();
    if (clickedRow !== null && filtered[clickedRow]) groups.add(filtered[clickedRow].name);
    checkedRows.forEach((i) => { if (filtered[i]) groups.add(filtered[i].name); });
    selTypes.forEach((t) => (TYPE_TO_GROUPS[t] ?? []).forEach((g) => groups.add(g)));
    return groups;
  }, [checkedRows, clickedRow, filtered]);

  const selectedRows = useMemo(() => {
    const items: (typeof filtered)[number][] = [];
    if (clickedRow !== null && filtered[clickedRow]) items.push(filtered[clickedRow]);
    checkedRows.forEach((i) => { if (filtered[i] && !items.includes(filtered[i])) items.push(filtered[i]); });
    return items;
  }, [clickedRow, checkedRows, filtered]);

  const selectedNames = useMemo(() => new Set(selectedRows.map(r => r.name)), [selectedRows]);

  const selectionScale = useMemo(() => {
    if (selectedRows.length === 0) return 1;
    const base = realCampaignRows || campaignRows;
    const totalRev = base.reduce((s: number, r: { revenue: number }) => s + r.revenue, 0);
    const selRev = selectedRows.reduce((s: number, r: { revenue: number }) => s + r.revenue, 0);
    return selRev / totalRev;
  }, [selectedRows, realCampaignRows]);

  const chartSeries = useMemo(() => {
    if (chartGroupBy === "Campaign") {
      return campaignAvgs.map(({ name, color }) => ({ name, color }));
    }
    return TYPES.map((name) => ({ name, color: TYPE_COLORS_MAP[name] }));
  }, [chartGroupBy, campaignAvgs]);

  const chartBarData = useMemo(() => {
    return barData.map((row, i) => {
      const perf = adPerfData[i] || { convValue: (row.total as number) || 0, cost: 0, clicks: 0 };
      const totalRev = (row.total as number) || 1;
      const metricTotal =
        chartMetric === "Cost" ? perf.cost :
        chartMetric === "Clicks" ? perf.clicks :
        perf.convValue;
      const scale = metricTotal / totalRev;

      if (chartGroupBy === "Campaign") {
        const obj: Record<string, string | number> = { date: row.date as string };
        CAMPAIGNS.forEach((c) => { obj[c] = Math.round(((row[c] as number) || 0) * scale); });
        obj.total = Math.round(metricTotal);
        return obj;
      } else {
        const typeVals: Record<string, number> = {};
        CAMPAIGNS.forEach((c) => {
          const t = CAMPAIGN_TYPE_MAP[c];
          typeVals[t] = (typeVals[t] || 0) + Math.round(((row[c] as number) || 0) * scale);
        });
        const obj: Record<string, string | number> = { date: row.date as string };
        TYPES.forEach((t) => { obj[t] = typeVals[t] || 0; });
        obj.total = Math.round(metricTotal);
        return obj;
      }
    });
  }, [barData, adPerfData, chartMetric, chartGroupBy]);

  const displayBarData = useMemo(() =>
    chartBarData.map((row) => ({
      ...row,
      visibleTotal: chartSeries
        .filter(({ name }) => {
          const isHidden = hiddenSeries.has(name);
          return !isHidden && (rowTypeFilter === null || rowTypeFilter.has(name));
        })
        .reduce((s, { name }) => s + ((row[name] as number) || 0), 0),
    })),
    [chartBarData, chartSeries, hiddenSeries, rowTypeFilter, chartGroupBy]
  );

  const aggregatedBarData = useMemo(() => {
    if (granularity === "days") return displayBarData;
    const chunks: typeof displayBarData[] = [];
    if (granularity === "weeks") {
      for (let i = 0; i < displayBarData.length; i += 7) chunks.push(displayBarData.slice(i, i + 7));
    } else {
      const byMon: Record<string, typeof displayBarData> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      displayBarData.forEach((r) => { const m = (r as any).date.split(" ")[0]; (byMon[m] ??= []).push(r); });
      Object.values(byMon).forEach((g) => chunks.push(g));
    }
    const seriesKeys = chartGroupBy === "Campaign" ? CAMPAIGNS : TYPES;
    return chunks.map((chunk) => {
      const agg: Record<string, number | string> = {
        date: granularity === "weeks"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? `${(chunk[0] as any).date}–${(chunk[chunk.length - 1] as any).date}`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : (chunk[0] as any).date.split(" ")[0],
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesKeys.forEach((n) => { (agg as any)[n] = chunk.reduce((s, r) => s + ((r as any)[n] as number || 0), 0); });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (agg as any).visibleTotal = chartSeries
        .filter(({ name }) => {
          const isHidden = hiddenSeries.has(name);
          return !isHidden && (rowTypeFilter === null || rowTypeFilter.has(name) || (CAMPAIGN_TYPE_MAP[name] && rowTypeFilter.has(CAMPAIGN_TYPE_MAP[name])));
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((s, r) => s + ((agg as any)[r.name] as number || 0), 0);
      return agg as typeof displayBarData[0];
    });
  }, [displayBarData, granularity, chartSeries, chartGroupBy, hiddenSeries, rowTypeFilter]);

  const aggregatedAdPerfData = useMemo(() => {
    const data = adPerfData.map((d, di) => {
      const bRow = barData[di] as Record<string, unknown>;
      let convValue = d.convValue;
      let cost = d.cost;
      let profit = d.profit;
      let clicks = d.clicks;

      if (selectedNames.size > 0 && bRow) {
        convValue = 0; cost = 0; clicks = 0;
        selectedNames.forEach(name => {
          convValue += ((bRow[name] as number) || 0);
          cost += ((bRow[`_cost_${name}`] as number) || 0);
          clicks += ((bRow[`_clicks_${name}`] as number) || 0);
        });
        profit = convValue - cost;
      } else if (selectedNames.size > 0 && !bRow) {
        convValue = 0; cost = 0; clicks = 0; profit = 0;
      }

      return {
        ...d,
        convValue, cost, profit, clicks,
        costBar: cost,
        profitBar: Math.max(0, profit),
        roas: cost > 0 ? convValue / cost : 0
      };
    });
    if (granularity === "days") return data;
    const chunks: AdPerfItem[][] = [];
    if (granularity === "weeks") {
      for (let i = 0; i < data.length; i += 7) chunks.push(data.slice(i, i + 7));
    } else {
      const byMon: Record<string, AdPerfItem[]> = {};
      data.forEach((r) => { const m = r.date.split(" ")[0]; (byMon[m] ??= []).push(r); });
      Object.values(byMon).forEach((g) => chunks.push(g));
    }
    return chunks.map((chunk) => {
      const convValue = chunk.reduce((s, r) => s + r.convValue, 0);
      const cost = chunk.reduce((s, r) => s + r.cost, 0);
      const profit = chunk.reduce((s, r) => s + r.profit, 0);
      const clicks = chunk.reduce((s, r) => s + r.clicks, 0);
      const roas = cost > 0 ? parseFloat((convValue / cost).toFixed(2)) : 0;
      const date = granularity === "weeks"
        ? `${chunk[0].date}–${chunk[chunk.length - 1].date}`
        : chunk[0].date.split(" ")[0];
      return { date, convValue, cost, profit, clicks, roas, costBar: cost, profitBar: Math.max(0, profit) };
    });
  }, [adPerfData, granularity, selectionScale, selectedNames, barData]);

  const aggregatedPlData = useMemo(() => {
    const data = plData.map(d => ({
      ...d,
      dailyProfit: d.dailyProfit * selectionScale,
    }));
    if (granularity === "days") {
      let c = 0;
      return data.map(d => { c += d.dailyProfit; return { ...d, cumulative: c }; });
    }
    const chunks: PlItem[][] = [];
    if (granularity === "weeks") {
      for (let i = 0; i < data.length; i += 7) chunks.push(data.slice(i, i + 7));
    } else {
      const byMon: Record<string, PlItem[]> = {};
      data.forEach((r) => { const m = r.date.split(" ")[0]; (byMon[m] ??= []).push(r); });
      Object.values(byMon).forEach((g) => chunks.push(g));
    }
    let cum = 0;
    return chunks.map((chunk) => {
      const dailyProfit = chunk.reduce((s, r) => s + r.dailyProfit, 0);
      cum += dailyProfit;
      const date = granularity === "weeks"
        ? `${chunk[0].date}–${chunk[chunk.length - 1].date}`
        : chunk[0].date.split(" ")[0];
      return { date, dailyProfit, cumulative: cum };
    });
  }, [plData, granularity, selectionScale]);

  const renderConvLabel = useMemo(() => makeRenderConvLabel(aggregatedAdPerfData, hiddenAdPerf.has("conv")), [aggregatedAdPerfData, hiddenAdPerf]);
  const renderLossTopLabel = useMemo(() => makeRenderLossTopLabel(aggregatedAdPerfData, hiddenAdPerf.has("conv")), [aggregatedAdPerfData, hiddenAdPerf]);
  const renderTotalLabelChart = useMemo(() => makeRenderTotalLabel(chartMetric), [chartMetric]);

  const dynKpis = useMemo(() => {
    if (selectedRows.length === 0) return null;
    const selClicks = selectedRows.reduce((s, r) => s + r.clicks, 0);
    const selConv   = selectedRows.reduce((s, r) => s + r.conv, 0);
    const selCost   = selectedRows.reduce((s, r) => s + r.cost, 0);
    const selRev    = selectedRows.reduce((s, r) => s + r.revenue, 0);
    const selProfit = selectedRows.reduce((s, r) => s + r.profit, 0);
    const totClicks = currentRows.reduce((s: number, r: { clicks: number }) => s + r.clicks, 0);
    const totConv   = currentRows.reduce((s: number, r: { conv: number }) => s + r.conv, 0);
    const totCost   = currentRows.reduce((s: number, r: { cost: number }) => s + r.cost, 0);
    const totRev    = currentRows.reduce((s: number, r: { revenue: number }) => s + r.revenue, 0);
    const convRate  = selClicks > 0 ? selConv / selClicks * 100 : 0;
    const cpa       = selConv  > 0 ? selCost / selConv : 0;
    const roas      = selCost  > 0 ? selRev  / selCost : 0;
    const fmtPct2 = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}% of total` : "—";
    return [
      { value: selClicks >= 1000 ? `${(selClicks/1000).toFixed(2)}K` : String(selClicks), delta: fmtPct2(selClicks, totClicks), up: selClicks >= totClicks / currentRows.length },
      { value: `${convRate.toFixed(2)}%`,  delta: convRate > 2.47 ? "▲ above avg" : "▼ below avg", up: convRate >= 2.47 },
      { value: selConv >= 1000 ? `${(selConv/1000).toFixed(2)}K` : String(selConv), delta: fmtPct2(selConv, totConv), up: true },
      { value: `${cpa.toFixed(2)}`,        delta: cpa < 20.42 ? "▲ below avg CPA" : "▼ above avg CPA", up: cpa <= 20.42 },
      { value: selCost >= 1000 ? `${(selCost/1000).toFixed(2)}K` : selCost.toFixed(2), delta: fmtPct2(selCost, totCost), up: true },
      { value: selRev  >= 1000 ? `${(selRev/1000).toFixed(2)}K`  : selRev.toFixed(2),  delta: fmtPct2(selRev, totRev), up: true },
      { value: `${roas.toFixed(2)}x`,      delta: roas > 1.76 ? "▲ above avg" : "▼ below avg", up: roas >= 1.76 },
      { value: selProfit >= 0 ? (selProfit >= 1000 ? `${(selProfit/1000).toFixed(2)}K` : selProfit.toFixed(0)) : `-${(Math.abs(selProfit)/1000).toFixed(2)}K`, delta: selProfit >= 0 ? "Profitable" : "Loss", up: selProfit >= 0 },
    ];
  }, [selectedRows, currentRows]);

  const dynSegData = useMemo(() => {
    const rows = selectedRows.length > 0 ? selectedRows : currentRows;
    const buildSeg = (getValue: (r: typeof currentRows[0]) => number) => {
      const items = rows.map((r: typeof currentRows[0]) => ({ name: r.name, value: getValue(r) })).filter((x: { name: string; value: number }) => x.value > 0);
      items.sort((a: { value: number }, b: { value: number }) => b.value - a.value);
      const top = items.slice(0, 7);
      const othersVal = items.slice(7).reduce((s: number, x: { value: number }) => s + x.value, 0);
      if (othersVal > 0) top.push({ name: "Others", value: othersVal });
      return top;
    };
    return {
      revenue: buildSeg((r) => r.revenue),
      profit: buildSeg((r) => Math.max(0, r.profit)),
      conversions: buildSeg((r) => r.conv),
    };
  }, [selectedRows, currentRows]);

  // Compute min/max for heatmap columns
  const heatCols = useMemo(() => {
    const keys = ["impr","clicks","cpc","ctr","convRate","conv","cpa","revenue","cost","profit"] as const;
    const result = {} as Record<typeof keys[number], { min: number; max: number }>;
    keys.forEach((k) => {
      const vals = currentRows.map((r) => r[k] as number);
      result[k] = { min: Math.min(...vals), max: Math.max(...vals) };
    });
    return result;
  }, [currentRows]);

  const tableTotals = useMemo(() => {
    const rows = filtered;
    const totImpr     = rows.reduce((s, r) => s + r.impr, 0);
    const totClicks   = rows.reduce((s, r) => s + r.clicks, 0);
    const totConv     = rows.reduce((s, r) => s + r.conv, 0);
    const totCost     = rows.reduce((s, r) => s + r.cost, 0);
    const totRev      = rows.reduce((s, r) => s + r.revenue, 0);
    const totProfit   = rows.reduce((s, r) => s + r.profit, 0);
    const avgCpc      = totClicks > 0 ? totCost / totClicks : 0;
    const avgCtr      = totImpr > 0 ? (totClicks / totImpr) * 100 : 0;
    const avgConvRate = totClicks > 0 ? (totConv / totClicks) * 100 : 0;
    const avgCpa      = totConv > 0 ? totCost / totConv : 0;
    const totRoasVal  = totCost > 0 ? (totRev / totCost) * 100 : 0;
    const totRoasColor = totRoasVal >= 150 ? "green" : totRoasVal >= 100 ? "orange" : "red";
    return { totImpr, totClicks, totConv, totCost, totRev, totProfit, avgCpc, avgCtr, avgConvRate, avgCpa, totRoasVal, totRoasColor };
  }, [filtered]);

  return (
    <div 
      className={`w-full px-4 sm:px-6 pt-6 bg-[#f4f6fb] ${isMobile ? "" : "transition-[padding] duration-300 ease-out"} ${aiOpen ? "lg:pr-[456px]" : ""}`}
      style={{ 
        paddingBottom: "calc(env(safe-area-inset-bottom) + 120px)",
        minHeight: "100vh",
        overscrollBehaviorY: "auto"
      }}
    >
      <div className="max-w-[1600px]">
      {/* Header */}
      <div className="hidden sm:flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[19px] font-bold text-gray-900 leading-tight">Google Ads</h1>
            <p className="text-[13px] text-gray-400">Campaign Performance Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Windsor API Key Input */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"/></svg>
            <input
              type="password"
              placeholder="Windsor.ai API Key"
              value={windsorApiKey}
              onChange={(e) => setWindsorApiKey(e.target.value)}
              className="text-[13px] outline-none w-40 placeholder:text-gray-300"
            />
            {isWindsorLoading && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            {windsorError && <span className="text-[10px] text-red-500 font-medium">{windsorError}</span>}
            {!windsorApiKey && <span className="text-[10px] text-orange-500 font-medium">Demo Mode</span>}
            {windsorApiKey && !isWindsorLoading && !windsorError && <span className="text-[10px] text-green-500 font-medium">Connected</span>}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                if (datePickerOpen) setDatePickerOpen(false);
                else openDatePicker();
              }}
              className="flex items-center gap-2 text-[14px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {fmtMs(rangeStart)} – {fmtMs(rangeEnd)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${datePickerOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {/* Desktop Date Picker Dropdown */}
            {datePickerOpen && (
              <DatePickerPanel
                pickerTempStart={pickerTempStart}
                pickerTempEnd={pickerTempEnd}
                pickerHover={pickerHover}
                pickerStep={pickerStep}
                pickerViewYear={pickerViewYear}
                pickerViewMonth={pickerViewMonth}
                daysUpToToday={daysUpToToday}
                daysUpToYesterday={daysUpToYesterday}
                compareEnabled={compareEnabled}
                setPickerTempStart={setPickerTempStart}
                setPickerTempEnd={setPickerTempEnd}
                setPickerHover={setPickerHover}
                setPickerStep={setPickerStep}
                setPickerViewYear={(fn) => setPickerViewYear(fn)}
                setPickerViewMonth={(fn) => setPickerViewMonth(fn)}
                setDaysUpToToday={setDaysUpToToday}
                setDaysUpToYesterday={setDaysUpToYesterday}
                setCompareEnabled={setCompareEnabled}
                setDatePickerOpen={setDatePickerOpen}
                setRangeStart={setRangeStart}
                setRangeEnd={setRangeEnd}
                setHiddenSeries={setHiddenSeries}
                setCheckedRows={setCheckedRows}
                setClickedRow={setClickedRow}
                handlePresetClick={handlePresetClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {dynKpis && (
        <div className="flex items-center gap-1.5 mb-2 text-[12px] text-blue-600">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Showing metrics for {selectedRows.length} selected campaign{selectedRows.length > 1 ? "s" : ""}
          <button onClick={() => { setCheckedRows(new Set()); setClickedRow(null); }} className="ml-1 text-gray-400 hover:text-gray-700 transition">× Clear</button>
        </div>
      )}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 mb-5">
        {kpis.map((k, i) => {
          const dyn = dynKpis?.[i];
          return (
            <KpiCard key={k.label} label={k.label} shortLabel={k.shortLabel} icon={k.icon}
              value={dyn?.value ?? k.value}
              delta={dyn?.delta ?? k.delta}
              up={dyn?.up ?? k.up}
              spark={sparkData(dyn?.up ?? k.up, dyn ? i + selectedRows.length * 3 : i)}
              desc={k.desc} hoverFmt={k.hoverFmt} />
          );
        })}
      </div>

      {/* Chart card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 mb-5 min-w-0">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 mb-5 min-w-0 border-b border-gray-100 pb-2 sm:pb-0">
          {/* Mobile: dropdown */}
          <div className="sm:hidden relative flex-1 min-w-0">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(Number(e.target.value))}
              className="w-full appearance-none text-[13px] font-medium border border-gray-200 rounded-lg px-3 py-2 outline-none bg-white pr-8 cursor-pointer"
            >
              {tabs.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {/* Desktop: tab buttons */}
          <div className="hidden sm:flex gap-1 flex-1 overflow-x-auto scrollbar-none min-w-0">
            {tabs.map((t, i) => (
              <button key={t} onClick={() => setActiveTab(i)}
                className={`px-3 py-2 text-[14px] font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="p-[2px] rounded-xl shrink-0 relative sm:-top-[10px]" style={{ background: "linear-gradient(135deg, #3b82f6, #a78bfa, #f472b6)" }}>
            <button onClick={openAi} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-bold text-gray-800 bg-white hover:bg-gray-50/80 px-2.5 sm:px-4 py-[6px] rounded-[10px] transition whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <defs><linearGradient id="ai-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#ec4899"/></linearGradient></defs>
                <path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z" fill="url(#ai-grad)"/>
                <circle cx="18" cy="6" r="1.5" fill="url(#ai-grad)" />
              </svg>
              AI Assistant
            </button>
          </div>
        </div>

        {/* Tab content with charts */}
        <TabContent
          activeTab={activeTab}
          isMobile={isMobile}
          aggregatedBarData={aggregatedBarData}
          chartSeries={chartSeries}
          chartMetric={chartMetric}
          chartGroupBy={chartGroupBy}
          chartMetricOpen={chartMetricOpen}
          chartGroupByOpen={chartGroupByOpen}
          hiddenSeries={hiddenSeries}
          rowTypeFilter={rowTypeFilter}
          checkedRows={checkedRows}
          clickedRow={clickedRow}
          renderTotalLabelChart={renderTotalLabelChart}
          CHART_METRICS={CHART_METRICS}
          CHART_GROUPBY={CHART_GROUPBY}
          onChartMetricChange={(m) => { setChartMetric(m); setHiddenSeries(new Set()); }}
          onChartGroupByChange={(g) => { setChartGroupBy(g); setHiddenSeries(new Set()); }}
          onChartMetricOpenChange={setChartMetricOpen}
          onChartGroupByOpenChange={setChartGroupByOpen}
          onToggleSeries={toggleSeries}
          onClearRowFilter={() => { setCheckedRows(new Set()); setClickedRow(null); }}
          aggregatedAdPerfData={aggregatedAdPerfData}
          hiddenAdPerf={hiddenAdPerf}
          renderConvLabel={renderConvLabel}
          renderLossTopLabel={renderLossTopLabel}
          onHiddenAdPerfChange={setHiddenAdPerf}
          aggregatedPlData={aggregatedPlData}
          hiddenPL={hiddenPL}
          dates={dates}
          onHiddenPLChange={setHiddenPL}
          dynSegData={dynSegData}
          granularity={granularity}
          granularityOpen={granularityOpen}
          onGranularityChange={setGranularity}
          onGranularityOpenChange={setGranularityOpen}
        />

        {/* Event Timeline */}
        <Timeline
          dates={dates}
          timelineOpen={timelineOpen}
          isPortrait={isPortrait}
          onToggle={() => setTimelineOpen(!timelineOpen)}
          onAddEvent={() => { setAddEventOpen(true); setEvtCategory("Events"); setEvtType(null); setEvtStartDate("2026-04-14"); setEvtEndDate(""); setEvtTitle(""); setEvtDesc(""); }}
        />
      </div>

      {/* Campaign table */}
      <CampaignTable
        filtered={filtered}
        currentRows={currentRows}
        page={page}
        rowsPerPage={rowsPerPage}
        totalPages={totalPages}
        sortCol={sortCol}
        sortDir={sortDir}
        typeFilter={typeFilter}
        types={types}
        selectedCampaigns={selectedCampaigns}
        checkedRows={checkedRows}
        clickedRow={clickedRow}
        namesCollapsed={namesCollapsed}
        expandedNameIdx={expandedNameIdx}
        isMobile={isMobile}
        heatCols={heatCols}
        tableTotals={tableTotals}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        fmtMs={fmtMs}
        onSort={handleSort}
        onTypeFilter={setTypeFilter}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onCheckedRowsChange={setCheckedRows}
        onClickedRowChange={setClickedRow}
        onNamesCollapsedChange={setNamesCollapsed}
        onExpandedNameIdxChange={setExpandedNameIdx}
        onSelectedCampaignsChange={setSelectedCampaigns}
        campaignDropdownOpen={campaignDropdownOpen}
        campaignSearch={campaignSearch}
        onCampaignDropdownOpen={setCampaignDropdownOpen}
        onCampaignSearchChange={setCampaignSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
      />
      </div>

      {/* ── Add Custom Event Modal ── */}
      {addEventOpen && (
        <AddEventModal
          evtCategory={evtCategory}
          evtType={evtType}
          evtStartDate={evtStartDate}
          evtEndDate={evtEndDate}
          evtTitle={evtTitle}
          evtDesc={evtDesc}
          onClose={() => setAddEventOpen(false)}
          onCategoryChange={setEvtCategory}
          onTypeChange={setEvtType}
          onStartDateChange={setEvtStartDate}
          onEndDateChange={setEvtEndDate}
          onTitleChange={setEvtTitle}
          onDescChange={setEvtDesc}
        />
      )}

      {/* ── AI Campaign Assistant Sidebar ── */}
      <AiSidebar
        aiOpen={aiOpen}
        aiInput={aiInput}
        aiMsgs={aiMsgs}
        aiLoading={aiLoading}
        aiScrollRef={aiScrollRef as React.RefObject<HTMLDivElement>}
        onClose={() => setAiOpen(false)}
        onInputChange={setAiInput}
        onSendMsg={sendAiMsg}
        onTogglePin={toggleAiPin}
      />

      {/* ── Mobile Date Picker Modal ── */}
      {datePickerOpen && (
        <MobileDatePicker
          pickerTempStart={pickerTempStart}
          pickerTempEnd={pickerTempEnd}
          pickerHover={pickerHover}
          pickerStep={pickerStep}
          pickerViewYear={pickerViewYear}
          pickerViewMonth={pickerViewMonth}
          setPickerTempStart={setPickerTempStart}
          setPickerTempEnd={setPickerTempEnd}
          setPickerHover={setPickerHover}
          setPickerStep={setPickerStep}
          setPickerViewYear={setPickerViewYear}
          setPickerViewMonth={setPickerViewMonth}
          setDatePickerOpen={setDatePickerOpen}
          setRangeStart={setRangeStart}
          setRangeEnd={setRangeEnd}
          setHiddenSeries={setHiddenSeries}
          setCheckedRows={setCheckedRows}
          setClickedRow={setClickedRow}
        />
      )}
    </div>
  );
}
