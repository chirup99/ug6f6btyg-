/**
 * Multi-Source Financial Data Scraper
 * Fetches ONLY real data from multiple free sources:
 *   1. Screener.in  (HTML scrape)
 *   2. Yahoo Finance2 (JS library - most reliable)
 *   3. NSE India API (official JSON API with cookie session)
 *   4. Moneycontrol  (HTML scrape)
 *   5. Trendlyne     (HTML scrape)
 *
 * No AI / no fake / no random data.
 * Returns null / [] when no real data is available.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

// ─── shared headers ──────────────────────────────────────────────────────────
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function cleanSym(symbol: string): string {
  return symbol
    .replace(/^(NSE:|BSE:)/i, '')
    .replace(/-(EQ|BE|BL|SM|IL)$/i, '')
    .toUpperCase()
    .trim();
}

function toYahoo(symbol: string): string {
  const s = cleanSym(symbol);
  const specials: Record<string, string> = {
    NIFTY50: '^NSEI', NIFTY: '^NSEI', BANKNIFTY: '^NSEBANK',
    SENSEX: '^BSESN', GOLD: 'GC=F', SILVER: 'SI=F',
  };
  return specials[s] || `${s}.NS`;
}

function parseCr(text: string): number | null {
  if (!text) return null;
  const n = parseFloat(text.replace(/[₹,%\s,]/g, ''));
  return isNaN(n) ? null : n;
}

function monthToFYQuarter(dateStr: string): string {
  const months: Record<string, number> = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,
    jul:7,aug:8,sep:9,oct:10,nov:11,dec:12
  };
  const [mon, yr] = dateStr.toLowerCase().split(' ');
  const m = months[mon];
  const y = parseInt(yr);
  if (!m || !y) return dateStr;
  // Indian FY: Apr=Q1, Jul=Q2, Oct=Q3, Jan=Q4
  let q: number, fy: number;
  if (m >= 4 && m <= 6)  { q = 1; fy = y + 1; }
  else if (m >= 7 && m <= 9)  { q = 2; fy = y + 1; }
  else if (m >= 10 && m <= 12) { q = 3; fy = y + 1; }
  else { q = 4; fy = y; }
  return `Q${q} FY${String(fy).slice(-2)}`;
}

// ─── NSE India session helper ─────────────────────────────────────────────────
let nseSession: { cookies: string; expiry: number } | null = null;

async function getNSESession(): Promise<string | null> {
  try {
    if (nseSession && Date.now() < nseSession.expiry) return nseSession.cookies;
    const res = await axios.get('https://www.nseindia.com/', {
      headers: { ...BROWSER_HEADERS, 'Referer': 'https://www.google.com/' },
      timeout: 12000,
    });
    const setCookie = res.headers['set-cookie'];
    if (!setCookie) return null;
    const cookies = setCookie.map((c: string) => c.split(';')[0]).join('; ');
    nseSession = { cookies, expiry: Date.now() + 20 * 60 * 1000 };
    return cookies;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  QUARTERLY RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuarterResult {
  quarter: string;
  net_profit: string | null;
  revenue: string | null;
  eps: string | null;
  change_percent: string | null;
  pdf_url: string | null;
  source: string;
}

// ── Source 1: Screener.in ─────────────────────────────────────────────────────
async function quarterlyFromScreener(symbol: string): Promise<QuarterResult[]> {
  const cs = cleanSym(symbol);
  const urls = [
    `https://www.screener.in/company/${cs}/consolidated/`,
    `https://www.screener.in/company/${cs}/`,
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 15000 });
      if (res.status !== 200) continue;
      const $ = cheerio.load(res.data);
      const results: QuarterResult[] = [];

      // Quarter headers from the #quarters section
      const quarterHeaders: string[] = [];
      $('section#quarters table thead th').each((_, el) => {
        const t = $(el).text().trim();
        if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i.test(t)) {
          quarterHeaders.push(t);
        }
      });

      if (quarterHeaders.length === 0) continue;

      // Extract rows: Sales (revenue) and Net Profit
      const rows: Record<string, number[]> = {};
      $('section#quarters table tbody tr').each((_, el) => {
        const label = $(el).find('td').first().text().trim().toLowerCase();
        const key = label.includes('net profit') ? 'net_profit'
          : label.includes('sales') || label.includes('revenue') ? 'revenue'
          : label.includes('eps') ? 'eps'
          : null;
        if (!key) return;
        const vals: number[] = [];
        $(el).find('td:not(:first-child)').each((_, td) => {
          const v = parseCr($(td).text().trim());
          vals.push(v ?? 0);
        });
        rows[key] = vals;
      });

      // PDF links from "Raw PDF" row
      const pdfLinks: string[] = [];
      $('section#quarters table tbody tr').each((_, el) => {
        const label = $(el).find('td').first().text().trim().toLowerCase();
        if (label === 'raw pdf' || label.includes('raw pdf')) {
          $(el).find('td:not(:first-child) a[href]').each((_, a) => {
            const h = $(a).attr('href') || '';
            pdfLinks.push(h.startsWith('http') ? h : `https://www.screener.in${h}`);
          });
        }
      });

      for (let i = 0; i < quarterHeaders.length; i++) {
        const np = rows.net_profit?.[i];
        const rev = rows.revenue?.[i];
        if (np == null && rev == null) continue;

        const prev = i > 0 ? rows.net_profit?.[i - 1] : null;
        let chg: string | null = null;
        if (np != null && prev != null && prev !== 0) {
          chg = `${(((np - prev) / Math.abs(prev)) * 100).toFixed(2)}%`;
        }

        results.push({
          quarter: monthToFYQuarter(quarterHeaders[i]),
          net_profit: np != null ? String(np) : null,
          revenue: rev != null ? String(rev) : null,
          eps: rows.eps?.[i] != null ? String(rows.eps[i]) : null,
          change_percent: chg,
          pdf_url: pdfLinks[i] || null,
          source: 'screener.in',
        });
      }

      if (results.length > 0) {
        console.log(`[MULTI-SRC] ✅ Screener.in: ${results.length} quarters for ${cs}`);
        return results;
      }
    } catch (e: any) {
      console.log(`[MULTI-SRC] ⚠️ Screener failed for ${cs}: ${e.message}`);
    }
  }
  return [];
}

// ── Source 2: Yahoo Finance2 (quarterly income statement) ─────────────────────
async function quarterlyFromYahoo(symbol: string): Promise<QuarterResult[]> {
  try {
    const yahooSym = toYahoo(symbol);
    const summary: any = await yf.quoteSummary(yahooSym, {
      modules: ['incomeStatementHistoryQuarterly'],
    });

    const stmts = summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory;
    if (!stmts?.length) return [];

    const results: QuarterResult[] = stmts.map((s: any, i: number) => {
      const endDate: Date = s.endDate instanceof Date ? s.endDate : new Date(s.endDate);
      const monthStr = endDate.toLocaleString('en-US', { month: 'short' }) + ' ' + endDate.getFullYear();
      const np = s.netIncome?.raw != null ? (s.netIncome.raw / 1e7).toFixed(2) : null; // to Crore
      const rev = s.totalRevenue?.raw != null ? (s.totalRevenue.raw / 1e7).toFixed(2) : null;

      const prevNp = i > 0 ? stmts[i - 1]?.netIncome?.raw : null;
      const curNp = s.netIncome?.raw;
      let chg: string | null = null;
      if (curNp != null && prevNp != null && prevNp !== 0) {
        chg = `${(((curNp - prevNp) / Math.abs(prevNp)) * 100).toFixed(2)}%`;
      }

      return {
        quarter: monthToFYQuarter(monthStr),
        net_profit: np,
        revenue: rev,
        eps: s.dilutedEPS?.raw != null ? String(s.dilutedEPS.raw.toFixed(2)) : null,
        change_percent: chg,
        pdf_url: null,
        source: 'yahoo-finance',
      } as QuarterResult;
    });

    const valid = results.filter(r => r.net_profit != null || r.revenue != null);
    if (valid.length > 0) {
      console.log(`[MULTI-SRC] ✅ Yahoo Finance: ${valid.length} quarters for ${symbol}`);
    }
    return valid;
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Yahoo quarterly failed for ${symbol}: ${e.message}`);
    return [];
  }
}

// ── Source 3: NSE India (quarterly results JSON) ───────────────────────────────
async function quarterlyFromNSE(symbol: string): Promise<QuarterResult[]> {
  try {
    const cs = cleanSym(symbol);
    const cookies = await getNSESession();
    if (!cookies) return [];

    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(cs)}&section=trade_info`;
    const res = await axios.get(url, {
      headers: { ...BROWSER_HEADERS, Cookie: cookies, Referer: 'https://www.nseindia.com/' },
      timeout: 12000,
    });

    // NSE trade_info doesn't have quarterly financials directly.
    // Try results-comparator endpoint
    const resUrl = `https://www.nseindia.com/api/results-comparator?period=Q&symbol=${encodeURIComponent(cs)}`;
    const resRes = await axios.get(resUrl, {
      headers: { ...BROWSER_HEADERS, Cookie: cookies, Referer: 'https://www.nseindia.com/companies-listing/corporate-filings-financial-results' },
      timeout: 12000,
    });

    const data = resRes.data;
    if (!data || !Array.isArray(data.data)) return [];

    const results: QuarterResult[] = data.data.slice(0, 8).map((row: any, i: number) => {
      const period = row.period || row.fromDate || '';
      const np = row.netProfit != null ? String((Number(row.netProfit) / 1e7).toFixed(2)) : null;
      const rev = row.income != null ? String((Number(row.income) / 1e7).toFixed(2)) : null;

      const prev = i > 0 ? data.data[i - 1]?.netProfit : null;
      const cur = row.netProfit;
      let chg: string | null = null;
      if (cur != null && prev != null && prev !== 0) {
        chg = `${(((cur - prev) / Math.abs(prev)) * 100).toFixed(2)}%`;
      }

      return {
        quarter: period,
        net_profit: np,
        revenue: rev,
        eps: row.eps != null ? String(Number(row.eps).toFixed(2)) : null,
        change_percent: chg,
        pdf_url: null,
        source: 'nse-india',
      } as QuarterResult;
    });

    const valid = results.filter(r => r.net_profit != null || r.revenue != null);
    if (valid.length > 0) console.log(`[MULTI-SRC] ✅ NSE India: ${valid.length} quarters for ${cs}`);
    return valid;
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ NSE quarterly failed for ${symbol}: ${e.message}`);
    return [];
  }
}

// ── Source 4: Trendlyne ────────────────────────────────────────────────────────
async function quarterlyFromTrendlyne(symbol: string): Promise<QuarterResult[]> {
  try {
    const cs = cleanSym(symbol);
    const url = `https://trendlyne.com/equity/${cs}/0000/quarterly-results/`;
    const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 15000 });
    if (res.status !== 200) return [];

    const $ = cheerio.load(res.data);
    const results: QuarterResult[] = [];
    const headers: string[] = [];

    // Extract column headers (quarter periods)
    $('table.table thead th').each((_, th) => {
      const t = $(th).text().trim();
      if (t && t !== 'Particulars') headers.push(t);
    });

    const rows: Record<string, (number | null)[]> = {};
    $('table.table tbody tr').each((_, tr) => {
      const cells = $(tr).find('td');
      const label = cells.first().text().trim().toLowerCase();
      const key = label.includes('net profit') ? 'net_profit'
        : label.includes('net sales') || label.includes('revenue') || label.includes('total income') ? 'revenue'
        : label.includes('eps') ? 'eps'
        : null;
      if (!key) return;
      const vals: (number | null)[] = [];
      cells.slice(1).each((_, td) => {
        const v = parseCr($(td).text().trim());
        vals.push(v);
      });
      rows[key] = vals;
    });

    for (let i = 0; i < headers.length; i++) {
      const np = rows.net_profit?.[i];
      const rev = rows.revenue?.[i];
      if (np == null && rev == null) continue;

      const prev = i > 0 ? rows.net_profit?.[i - 1] : null;
      let chg: string | null = null;
      if (np != null && prev != null && prev !== 0) {
        chg = `${(((np - prev) / Math.abs(prev)) * 100).toFixed(2)}%`;
      }

      results.push({
        quarter: headers[i],
        net_profit: np != null ? String(np) : null,
        revenue: rev != null ? String(rev) : null,
        eps: rows.eps?.[i] != null ? String(rows.eps[i]) : null,
        change_percent: chg,
        pdf_url: null,
        source: 'trendlyne',
      });
    }

    if (results.length > 0) console.log(`[MULTI-SRC] ✅ Trendlyne: ${results.length} quarters for ${cs}`);
    return results;
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Trendlyne failed for ${symbol}: ${e.message}`);
    return [];
  }
}

// ── Source 5: Moneycontrol quarterly ──────────────────────────────────────────
async function quarterlyFromMoneycontrol(symbol: string): Promise<QuarterResult[]> {
  try {
    const cs = cleanSym(symbol);
    // Moneycontrol uses a search to find the company code
    const searchUrl = `https://www.moneycontrol.com/mccode/common/autosuggestion/getCompanyDetails.php?classic=true&query=${encodeURIComponent(cs)}`;
    const searchRes = await axios.get(searchUrl, { headers: BROWSER_HEADERS, timeout: 10000 });
    const companies = searchRes.data;
    if (!companies?.length) return [];

    const mcCode = companies[0]?.sc_id || companies[0]?.company_id;
    if (!mcCode) return [];

    const finUrl = `https://www.moneycontrol.com/financials/${companies[0].company_code || cs}/results/quarterly/${mcCode}`;
    const finRes = await axios.get(finUrl, { headers: BROWSER_HEADERS, timeout: 15000 });
    if (finRes.status !== 200) return [];

    const $ = cheerio.load(finRes.data);
    const results: QuarterResult[] = [];
    const headers: string[] = [];

    $('table#quarterly_Results thead th').each((_, th) => {
      const t = $(th).text().trim();
      if (t && t !== 'Particulars') headers.push(t);
    });

    const rows: Record<string, (number | null)[]> = {};
    $('table#quarterly_Results tbody tr').each((_, tr) => {
      const cells = $(tr).find('td');
      const label = cells.first().text().trim().toLowerCase();
      const key = label.includes('net profit') ? 'net_profit'
        : (label.includes('net sales') || label.includes('revenue from operations')) ? 'revenue'
        : label.includes('eps') ? 'eps'
        : null;
      if (!key) return;
      const vals: (number | null)[] = [];
      cells.slice(1).each((_, td) => {
        vals.push(parseCr($(td).text().trim()));
      });
      rows[key] = vals;
    });

    for (let i = 0; i < headers.length; i++) {
      const np = rows.net_profit?.[i];
      const rev = rows.revenue?.[i];
      if (np == null && rev == null) continue;
      const prev = i > 0 ? rows.net_profit?.[i - 1] : null;
      let chg: string | null = null;
      if (np != null && prev != null && prev !== 0) {
        chg = `${(((np - prev) / Math.abs(prev)) * 100).toFixed(2)}%`;
      }
      results.push({
        quarter: headers[i],
        net_profit: np != null ? String(np) : null,
        revenue: rev != null ? String(rev) : null,
        eps: rows.eps?.[i] != null ? String(rows.eps[i]) : null,
        change_percent: chg,
        pdf_url: null,
        source: 'moneycontrol',
      });
    }

    if (results.length > 0) console.log(`[MULTI-SRC] ✅ Moneycontrol: ${results.length} quarters for ${cs}`);
    return results;
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Moneycontrol quarterly failed for ${symbol}: ${e.message}`);
    return [];
  }
}

/**
 * Main: fetch quarterly results from all sources in priority order.
 * Returns first non-empty result. Never returns fake data.
 */
export async function fetchQuarterlyResultsMultiSource(symbol: string): Promise<QuarterResult[]> {
  console.log(`[MULTI-SRC] 🔍 Fetching quarterly results for ${symbol} from all sources...`);

  const sources = [
    () => quarterlyFromScreener(symbol),
    () => quarterlyFromYahoo(symbol),
    () => quarterlyFromNSE(symbol),
    () => quarterlyFromTrendlyne(symbol),
    () => quarterlyFromMoneycontrol(symbol),
  ];

  for (const src of sources) {
    try {
      const data = await src();
      if (data.length > 0) return data;
    } catch { /* try next */ }
  }

  console.log(`[MULTI-SRC] ❌ No quarterly data from any source for ${symbol}`);
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ANNUAL FINANCIALS  (P&L + Balance Sheet)
// ═══════════════════════════════════════════════════════════════════════════════

export interface FinancialRow {
  label: string;
  values: { year: string; value: number }[];
}

export interface AnnualFinancials {
  years: string[];
  profitLoss: FinancialRow[];
  balanceSheet: FinancialRow[];
  source: string;
}

// ── Screener.in annual ────────────────────────────────────────────────────────
async function annualFromScreener(symbol: string): Promise<AnnualFinancials | null> {
  const cs = cleanSym(symbol);
  const urls = [
    `https://www.screener.in/company/${cs}/consolidated/`,
    `https://www.screener.in/company/${cs}/`,
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 15000 });
      if (res.status !== 200) continue;
      const $ = cheerio.load(res.data);

      const parseSection = (sectionId: string): { years: string[]; rows: FinancialRow[] } => {
        const years: string[] = [];
        $(`section#${sectionId} table thead th`).each((_, th) => {
          const t = $(th).text().trim();
          if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/.test(t)) years.push(t);
          else if (/^\d{4}$/.test(t)) years.push(t);
        });

        const rows: FinancialRow[] = [];
        $(`section#${sectionId} table tbody tr`).each((_, tr) => {
          const cells = $(tr).find('td');
          const label = cells.first().text().trim();
          if (!label || label.toLowerCase() === 'raw pdf') return;
          // Skip CAGR sub-rows that Screener.in appends (e.g. "10 Years:", "5 Years:", "3 Years:", "TTM:", "1 Year:", "Last Year:")
          if (/^\s*(10 Years|5 Years|3 Years|TTM|1 Year|Last Year)\s*:/.test(label)) return;
          const values: { year: string; value: number }[] = [];
          cells.slice(1).each((i, td) => {
            const v = parseCr($(td).text().trim());
            if (i < years.length && v != null) {
              values.push({ year: years[i], value: v });
            }
          });
          if (values.length > 0) rows.push({ label, values });
        });

        return { years, rows };
      };

      const plData = parseSection('profit-loss');
      const bsData = parseSection('balance-sheet');

      if (plData.rows.length > 0 || bsData.rows.length > 0) {
        const allYears = [...new Set([...plData.years, ...bsData.years])];
        console.log(`[MULTI-SRC] ✅ Screener annual: ${plData.rows.length} P&L rows, ${bsData.rows.length} BS rows for ${cs}`);
        return {
          years: allYears,
          profitLoss: plData.rows,
          balanceSheet: bsData.rows,
          source: 'screener.in',
        };
      }
    } catch (e: any) {
      console.log(`[MULTI-SRC] ⚠️ Screener annual failed for ${cs}: ${e.message}`);
    }
  }
  return null;
}

// ── Yahoo Finance2 annual ─────────────────────────────────────────────────────
async function annualFromYahoo(symbol: string): Promise<AnnualFinancials | null> {
  try {
    const yahooSym = toYahoo(symbol);
    const summary: any = await yf.quoteSummary(yahooSym, {
      modules: ['incomeStatementHistory', 'balanceSheetHistory'],
    });

    const plStmts = summary?.incomeStatementHistory?.incomeStatementHistory || [];
    const bsStmts = summary?.balanceSheetHistory?.balanceSheetStatements || [];

    if (!plStmts.length && !bsStmts.length) return null;

    const getYear = (s: any): string => {
      const d = s.endDate instanceof Date ? s.endDate : new Date(s.endDate);
      return d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getFullYear();
    };

    const CR = 1e7;

    // Build P&L rows
    const plYears = plStmts.map(getYear);
    const plMetrics: Record<string, number[]> = {
      'Sales': [], 'Operating Profit': [], 'Net Profit': [], 'EPS in Rs': [],
    };
    plStmts.forEach((s: any) => {
      plMetrics['Sales'].push(s.totalRevenue?.raw != null ? Math.round(s.totalRevenue.raw / CR) : 0);
      plMetrics['Operating Profit'].push(s.ebit?.raw != null ? Math.round(s.ebit.raw / CR) : 0);
      plMetrics['Net Profit'].push(s.netIncome?.raw != null ? Math.round(s.netIncome.raw / CR) : 0);
      plMetrics['EPS in Rs'].push(s.dilutedEPS?.raw ?? 0);
    });

    const profitLoss: FinancialRow[] = Object.entries(plMetrics).map(([label, vals]) => ({
      label,
      values: vals.map((v, i) => ({ year: plYears[i], value: v })),
    })).filter(r => r.values.some(v => v.value !== 0));

    // Build Balance Sheet rows
    const bsYears = bsStmts.map(getYear);
    const bsMetrics: Record<string, number[]> = {
      'Total Assets': [], 'Total Liabilities': [], "Shareholders' Equity": [],
      'Cash & Equivalents': [], 'Total Debt': [],
    };
    bsStmts.forEach((s: any) => {
      bsMetrics['Total Assets'].push(s.totalAssets?.raw != null ? Math.round(s.totalAssets.raw / CR) : 0);
      bsMetrics['Total Liabilities'].push(s.totalLiab?.raw != null ? Math.round(s.totalLiab.raw / CR) : 0);
      bsMetrics["Shareholders' Equity"].push(s.totalStockholderEquity?.raw != null ? Math.round(s.totalStockholderEquity.raw / CR) : 0);
      bsMetrics['Cash & Equivalents'].push(s.cash?.raw != null ? Math.round(s.cash.raw / CR) : 0);
      bsMetrics['Total Debt'].push(s.longTermDebt?.raw != null ? Math.round(s.longTermDebt.raw / CR) : 0);
    });

    const balanceSheet: FinancialRow[] = Object.entries(bsMetrics).map(([label, vals]) => ({
      label,
      values: vals.map((v, i) => ({ year: bsYears[i], value: v })),
    })).filter(r => r.values.some(v => v.value !== 0));

    const allYears = [...new Set([...plYears, ...bsYears])];
    console.log(`[MULTI-SRC] ✅ Yahoo Finance annual: ${profitLoss.length} P&L rows, ${balanceSheet.length} BS rows for ${symbol}`);
    return { years: allYears, profitLoss, balanceSheet, source: 'yahoo-finance' };
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Yahoo annual failed for ${symbol}: ${e.message}`);
    return null;
  }
}

// ── Moneycontrol annual ───────────────────────────────────────────────────────
async function annualFromMoneycontrol(symbol: string): Promise<AnnualFinancials | null> {
  try {
    const cs = cleanSym(symbol);
    const searchRes = await axios.get(
      `https://www.moneycontrol.com/mccode/common/autosuggestion/getCompanyDetails.php?classic=true&query=${encodeURIComponent(cs)}`,
      { headers: BROWSER_HEADERS, timeout: 10000 }
    );
    const companies = searchRes.data;
    if (!companies?.length) return null;

    const mcPath = companies[0]?.company_code;
    const mcId   = companies[0]?.sc_id;
    if (!mcPath || !mcId) return null;

    const parseAnnualTable = async (section: 'profit-loss' | 'balance-sheet'): Promise<{ years: string[]; rows: FinancialRow[] }> => {
      const urlMap = {
        'profit-loss': `https://www.moneycontrol.com/financials/${mcPath}/profit-loss/${mcId}`,
        'balance-sheet': `https://www.moneycontrol.com/financials/${mcPath}/balance-sheet/${mcId}`,
      };
      const res = await axios.get(urlMap[section], { headers: BROWSER_HEADERS, timeout: 15000 });
      const $ = cheerio.load(res.data);
      const years: string[] = [];
      $('table#annual_Results thead th, table.mctable1 thead th').each((_, th) => {
        const t = $(th).text().trim();
        if (t && t !== 'Particulars') years.push(t);
      });

      const rows: FinancialRow[] = [];
      $('table#annual_Results tbody tr, table.mctable1 tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        const label = cells.first().text().trim();
        if (!label) return;
        const values: { year: string; value: number }[] = [];
        cells.slice(1).each((i, td) => {
          const v = parseCr($(td).text().trim());
          if (i < years.length && v != null) values.push({ year: years[i], value: v });
        });
        if (values.length > 0) rows.push({ label, values });
      });

      return { years, rows };
    };

    const [plData, bsData] = await Promise.allSettled([
      parseAnnualTable('profit-loss'),
      parseAnnualTable('balance-sheet'),
    ]);

    const pl = plData.status === 'fulfilled' ? plData.value : { years: [], rows: [] };
    const bs = bsData.status === 'fulfilled' ? bsData.value : { years: [], rows: [] };

    if (pl.rows.length === 0 && bs.rows.length === 0) return null;

    const allYears = [...new Set([...pl.years, ...bs.years])];
    console.log(`[MULTI-SRC] ✅ Moneycontrol annual: ${pl.rows.length} P&L rows, ${bs.rows.length} BS rows for ${cs}`);
    return { years: allYears, profitLoss: pl.rows, balanceSheet: bs.rows, source: 'moneycontrol' };
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Moneycontrol annual failed for ${symbol}: ${e.message}`);
    return null;
  }
}

// ── Trendlyne annual ──────────────────────────────────────────────────────────
async function annualFromTrendlyne(symbol: string): Promise<AnnualFinancials | null> {
  try {
    const cs = cleanSym(symbol);
    const plUrl = `https://trendlyne.com/equity/${cs}/0000/financials/profit-and-loss/`;
    const bsUrl = `https://trendlyne.com/equity/${cs}/0000/financials/balance-sheet/`;

    const [plRes, bsRes] = await Promise.allSettled([
      axios.get(plUrl, { headers: BROWSER_HEADERS, timeout: 15000 }),
      axios.get(bsUrl, { headers: BROWSER_HEADERS, timeout: 15000 }),
    ]);

    const parseTrendlyneTable = (html: string): { years: string[]; rows: FinancialRow[] } => {
      const $ = cheerio.load(html);
      const years: string[] = [];
      $('table.table thead th').each((_, th) => {
        const t = $(th).text().trim();
        if (t && t !== 'Particulars') years.push(t);
      });
      const rows: FinancialRow[] = [];
      $('table.table tbody tr').each((_, tr) => {
        const cells = $(tr).find('td');
        const label = cells.first().text().trim();
        if (!label) return;
        const values: { year: string; value: number }[] = [];
        cells.slice(1).each((i, td) => {
          const v = parseCr($(td).text().trim());
          if (i < years.length && v != null) values.push({ year: years[i], value: v });
        });
        if (values.length > 0) rows.push({ label, values });
      });
      return { years, rows };
    };

    const pl = plRes.status === 'fulfilled' && plRes.value.status === 200
      ? parseTrendlyneTable(plRes.value.data) : { years: [], rows: [] };
    const bs = bsRes.status === 'fulfilled' && bsRes.value.status === 200
      ? parseTrendlyneTable(bsRes.value.data) : { years: [], rows: [] };

    if (pl.rows.length === 0 && bs.rows.length === 0) return null;
    const allYears = [...new Set([...pl.years, ...bs.years])];
    console.log(`[MULTI-SRC] ✅ Trendlyne annual: ${pl.rows.length} P&L rows, ${bs.rows.length} BS rows for ${cs}`);
    return { years: allYears, profitLoss: pl.rows, balanceSheet: bs.rows, source: 'trendlyne' };
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Trendlyne annual failed for ${symbol}: ${e.message}`);
    return null;
  }
}

/**
 * Main: fetch annual P&L + Balance Sheet from all sources.
 * Returns first non-null result. Never returns fake data.
 */
export async function fetchAnnualFinancialsMultiSource(symbol: string): Promise<AnnualFinancials | null> {
  console.log(`[MULTI-SRC] 🔍 Fetching annual financials for ${symbol} from all sources...`);

  const sources = [
    () => annualFromScreener(symbol),
    () => annualFromYahoo(symbol),
    () => annualFromMoneycontrol(symbol),
    () => annualFromTrendlyne(symbol),
  ];

  for (const src of sources) {
    try {
      const data = await src();
      if (data) return data;
    } catch { /* try next */ }
  }

  console.log(`[MULTI-SRC] ❌ No annual financials from any source for ${symbol}`);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  KEY METRICS  (PE, ROE, ROCE, Debt/Equity, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

export interface KeyMetrics {
  pe: number | null;
  pb: number | null;
  eps: number | null;
  marketCap: string | null;
  roe: string | null;
  roce: string | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  beta: number | null;
  profitMargin: string | null;
  revenueGrowth: string | null;
  dividendYield: string | null;
  high52w: number | null;
  low52w: number | null;
  bookValue: number | null;
  source: string;
}

// ── Yahoo Finance2 key metrics (most reliable) ────────────────────────────────
async function metricsFromYahoo(symbol: string): Promise<KeyMetrics | null> {
  try {
    const yahooSym = toYahoo(symbol);
    const [quote, summary] = await Promise.allSettled([
      yf.quote(yahooSym).catch(() => null),
      yf.quoteSummary(yahooSym, {
        modules: ['summaryDetail', 'financialData', 'defaultKeyStatistics', 'price'],
      }).catch(() => null),
    ]);

    const q: any = quote.status === 'fulfilled' ? quote.value : null;
    const s: any = summary.status === 'fulfilled' ? summary.value : null;
    if (!q && !s) return null;

    const sd = s?.summaryDetail || {};
    const fd = s?.financialData || {};
    const ks = s?.defaultKeyStatistics || {};

    const mcRaw = q?.marketCap || s?.price?.marketCap || 0;
    let marketCap: string | null = null;
    if (mcRaw > 0) {
      if (mcRaw >= 1e12) marketCap = `₹${(mcRaw / 1e12).toFixed(2)}T`;
      else if (mcRaw >= 1e9) marketCap = `₹${(mcRaw / 1e9).toFixed(2)}B`;
      else if (mcRaw >= 1e7) marketCap = `₹${(mcRaw / 1e7).toFixed(2)}Cr`;
    }

    const metrics: KeyMetrics = {
      pe: q?.trailingPE || sd?.trailingPE || null,
      pb: ks?.priceToBook || null,
      eps: ks?.trailingEps || null,
      marketCap,
      roe: fd?.returnOnEquity != null ? `${(fd.returnOnEquity * 100).toFixed(2)}%` : null,
      roce: null, // Yahoo doesn't provide ROCE directly
      debtToEquity: fd?.debtToEquity != null ? Number((fd.debtToEquity / 100).toFixed(2)) : null,
      currentRatio: fd?.currentRatio || null,
      beta: sd?.beta || ks?.beta || null,
      profitMargin: fd?.profitMargins != null ? `${(fd.profitMargins * 100).toFixed(2)}%` : null,
      revenueGrowth: fd?.revenueGrowth != null ? `${(fd.revenueGrowth * 100).toFixed(2)}%` : null,
      dividendYield: sd?.dividendYield != null ? `${(sd.dividendYield * 100).toFixed(2)}%` : null,
      high52w: q?.fiftyTwoWeekHigh || sd?.fiftyTwoWeekHigh || null,
      low52w: q?.fiftyTwoWeekLow || sd?.fiftyTwoWeekLow || null,
      bookValue: ks?.bookValue || null,
      source: 'yahoo-finance',
    };

    if (metrics.pe != null || metrics.roe != null) {
      console.log(`[MULTI-SRC] ✅ Yahoo Finance metrics for ${symbol}: PE=${metrics.pe}, ROE=${metrics.roe}`);
      return metrics;
    }
    return null;
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Yahoo metrics failed for ${symbol}: ${e.message}`);
    return null;
  }
}

// ── Screener.in key metrics (ratios section) ──────────────────────────────────
async function metricsFromScreener(symbol: string): Promise<Partial<KeyMetrics> | null> {
  try {
    const cs = cleanSym(symbol);
    const res = await axios.get(`https://www.screener.in/company/${cs}/consolidated/`, {
      headers: BROWSER_HEADERS, timeout: 15000,
    });
    if (res.status !== 200) return null;
    const $ = cheerio.load(res.data);

    const metrics: Partial<KeyMetrics> = { source: 'screener.in' };

    // Screener shows key ratios in #top-ratios
    $('#top-ratios li').each((_, li) => {
      const name = $(li).find('.name').text().trim().toLowerCase();
      const val  = $(li).find('.value, .number').first().text().trim();
      const num  = parseCr(val);
      if (name.includes('stock p/e') || name.includes('p/e ratio')) metrics.pe = num;
      else if (name.includes('price to book') || name.includes('p/b'))  metrics.pb = num;
      else if (name.includes('roe') || name.includes('return on equity')) metrics.roe = val;
      else if (name.includes('roce') || name.includes('return on capital')) metrics.roce = val;
      else if (name.includes('debt to equity') || name.includes('d/e'))   metrics.debtToEquity = num;
      else if (name.includes('current ratio'))  metrics.currentRatio = num;
      else if (name.includes('book value'))     metrics.bookValue = num;
      else if (name.includes('dividend yield')) metrics.dividendYield = val;
      else if (name.includes('market cap'))     metrics.marketCap = val;
      else if (name.includes('eps'))            metrics.eps = num;
    });

    if (Object.keys(metrics).length > 1) {
      console.log(`[MULTI-SRC] ✅ Screener metrics for ${cs}`);
      return metrics;
    }
    return null;
  } catch (e: any) {
    console.log(`[MULTI-SRC] ⚠️ Screener metrics failed for ${symbol}: ${e.message}`);
    return null;
  }
}

/**
 * Main: fetch key metrics from Yahoo Finance (primary) + Screener.in (ROCE supplement).
 * Merges both for maximum real coverage.
 */
export async function fetchKeyMetricsMultiSource(symbol: string): Promise<KeyMetrics | null> {
  console.log(`[MULTI-SRC] 🔍 Fetching key metrics for ${symbol}...`);

  const [yahooMetrics, screenerMetrics] = await Promise.allSettled([
    metricsFromYahoo(symbol),
    metricsFromScreener(symbol),
  ]);

  const yh = yahooMetrics.status === 'fulfilled' ? yahooMetrics.value : null;
  const sc = screenerMetrics.status === 'fulfilled' ? screenerMetrics.value : null;

  if (!yh && !sc) {
    console.log(`[MULTI-SRC] ❌ No key metrics from any source for ${symbol}`);
    return null;
  }

  // Merge: Yahoo is primary, Screener fills gaps (especially ROCE)
  const merged: KeyMetrics = {
    pe:            yh?.pe ?? sc?.pe ?? null,
    pb:            yh?.pb ?? sc?.pb ?? null,
    eps:           yh?.eps ?? sc?.eps ?? null,
    marketCap:     yh?.marketCap ?? sc?.marketCap ?? null,
    roe:           yh?.roe ?? sc?.roe ?? null,
    roce:          sc?.roce ?? null, // Only Screener provides ROCE
    debtToEquity:  yh?.debtToEquity ?? sc?.debtToEquity ?? null,
    currentRatio:  yh?.currentRatio ?? sc?.currentRatio ?? null,
    beta:          yh?.beta ?? null,
    profitMargin:  yh?.profitMargin ?? null,
    revenueGrowth: yh?.revenueGrowth ?? null,
    dividendYield: yh?.dividendYield ?? sc?.dividendYield ?? null,
    high52w:       yh?.high52w ?? null,
    low52w:        yh?.low52w ?? null,
    bookValue:     yh?.bookValue ?? sc?.bookValue ?? null,
    source:        yh ? (sc ? 'yahoo-finance + screener.in' : 'yahoo-finance') : 'screener.in',
  };

  return merged;
}
