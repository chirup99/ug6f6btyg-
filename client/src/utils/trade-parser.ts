/**
 * Trade Parser Utility
 *
 * Handles flexible parsing of P&L trade data from various broker formats.
 * Supports header detection, multiple delimiters, and various time formats.
 * Auto-detects broker CSV format from header fingerprints.
 */

export interface ParsedTrade {
  time: string;
  order: "BUY" | "SELL";
  symbol: string;
  type: string;
  qty: number;
  price: number;
  pnl: string;
  duration: string;
}

export interface ParseError {
  line: number;
  content: string;
  reason: string;
}

export interface ParseResult {
  trades: ParsedTrade[];
  errors: ParseError[];
  detectedBroker?: string;
}

interface ColumnMap {
  timeIndex: number;
  orderIndex: number;
  symbolIndex: number;
  typeIndex: number;
  qtyIndex: number;
  priceIndex: number;
}

// ─── Header keyword aliases per field ────────────────────────────────────────
// Extended to cover all known broker CSV column names.
const HEADER_KEYWORDS = {
  time: [
    "time", "timestamp", "tm",
    // Zerodha
    "order_execution_time", "trade_date", "order_date",
    // Upstox
    "order_datetime", "order_time", "executed_at",
    // Angel One
    "date/time", "trade_time",
    // Dhan
    "execution_time", "ordertime", "order date",
    // Fyers
    "trade date",
  ],
  order: [
    "order", "side", "action", "buy/sell", "b/s",
    // Zerodha
    "trade_type",
    // Upstox / Dhan / Groww
    "transaction_type", "transactiontype",
    // Angel One
    "trade type",
    // Generic
    "buysell", "direction",
  ],
  symbol: [
    "symbol", "script", "scrip", "instrument", "stock", "pe/ce", "ce/pe",
    // Zerodha / Upstox / Dhan / Angel One API
    "tradingsymbol", "trading_symbol", "trading symbol",
    // Upstox
    "instrument_key",
    // Angel One
    "scrip name", "symbolname",
    // Fyers
    "series",
  ],
  type: [
    "type", "product", "prd",
    // Broker-specific
    "producttype", "product_type", "order_type", "ordertype",
    "trade_type_product", "segment",
  ],
  qty: [
    "qty", "quantity", "qn", "lot", "lots",
    // Broker-specific
    "filled_quantity", "traded_qty", "fill_quantity",
    "trade_qty", "tradedqty", "filledqty",
    "net_quantity",
  ],
  price: [
    "price", "prc", "rate", "value",
    // Broker-specific
    "average_price", "avg_price", "trade_price", "fill_price",
    "average_fill_price", "traded_price", "avg price",
    "trade price", "avg.price",
    "net_rate",
  ],
};

// ─── Broker fingerprints ──────────────────────────────────────────────────────
// Each broker's CSV export has distinctive header column names.
// We match by counting how many fingerprint keywords appear in the header.
const BROKER_FINGERPRINTS: Array<{ broker: string; keywords: string[]; minMatch: number }> = [
  {
    broker: "Zerodha",
    keywords: ["tradingsymbol", "trade_type", "order_execution_time", "isin", "trade_id", "segment", "series"],
    minMatch: 2,
  },
  {
    broker: "Upstox",
    keywords: ["instrument_key", "order_datetime", "trading symbol", "average_fill_price", "order_id", "order_type", "order_datetime"],
    minMatch: 2,
  },
  {
    broker: "Angel One",
    keywords: ["symboltoken", "producttype", "ordertype", "transactiontype", "symbolname", "averageprice", "fillid"],
    minMatch: 2,
  },
  {
    broker: "Angel One",
    keywords: ["scrip name", "trade no", "trade time", "trade type", "trade price", "trade qty", "realised p&l"],
    minMatch: 3,
  },
  {
    broker: "Dhan",
    keywords: ["tradingsymbol", "transactiontype", "order_date", "execution time", "order number", "trade number", "product type"],
    minMatch: 2,
  },
  {
    broker: "Fyers",
    keywords: ["fytoken", "clientid", "avg.price", "trade id", "remarks", "trade value"],
    minMatch: 2,
  },
  {
    broker: "Groww",
    keywords: ["trading_symbol", "order_status", "groww_order_id", "average_fill_price", "exchange_time"],
    minMatch: 2,
  },
  {
    broker: "Delta Exchange",
    keywords: ["delta", "contract", "settlement", "futures", "perpetual"],
    minMatch: 1,
  },
  {
    broker: "ICICI Direct",
    keywords: ["settlement date", "trade no", "net rate", "brokerage"],
    minMatch: 2,
  },
  {
    broker: "HDFC Securities",
    keywords: ["hdfc", "trade ref", "scrip code", "net amount"],
    minMatch: 2,
  },
  {
    broker: "Kotak Securities",
    keywords: ["kotak", "exchange ref no", "trade ref no"],
    minMatch: 1,
  },
  {
    broker: "Motilal Oswal",
    keywords: ["motilal", "settlement no", "scripname"],
    minMatch: 1,
  },
];

/**
 * Detect which broker's CSV format is being used based on header tokens.
 * Returns the broker name or null if unrecognised.
 */
export function detectBrokerFromHeaders(headerTokens: string[]): string | null {
  const lower = headerTokens.map(t => t.toLowerCase().trim());

  for (const fp of BROKER_FINGERPRINTS) {
    const matchCount = fp.keywords.filter(kw => lower.some(t => t.includes(kw))).length;
    if (matchCount >= fp.minMatch) {
      return fp.broker;
    }
  }
  return null;
}

/**
 * Tokenizes a line by detecting the appropriate delimiter.
 */
export function tokenizeLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  let tokens: string[] = [];

  if (trimmed.includes('"') || trimmed.includes("'")) {
    const csvRegex = /(?:^|,)(?:"([^"]*)"|'([^']*)'|([^,]*))/g;
    let match;
    while ((match = csvRegex.exec(trimmed)) !== null) {
      tokens.push((match[1] || match[2] || match[3] || "").trim());
    }
  } else if (trimmed.includes("\t")) {
    tokens = trimmed.split("\t").map(t => t.trim());
  } else if (trimmed.includes(",")) {
    tokens = trimmed.split(",").map(t => t.trim());
  } else if (trimmed.match(/\s{2,}/)) {
    tokens = trimmed.split(/\s{2,}/).map(t => t.trim());
  } else {
    tokens = trimmed.split(/\s+/).map(t => t.trim());
  }

  return tokens.filter(t => t.length > 0);
}

/**
 * Detects if a line is a header by checking for known keywords.
 */
export function detectHeader(tokens: string[]): boolean {
  if (tokens.length < 3) return false;

  const normalizedTokens = tokens.map(t => t.toLowerCase());
  let matchCount = 0;

  for (const token of normalizedTokens) {
    for (const keywords of Object.values(HEADER_KEYWORDS)) {
      if (keywords.some(kw => token.includes(kw))) {
        matchCount++;
        break;
      }
    }
  }

  return matchCount >= 3;
}

/**
 * Builds a column map from header tokens, matching broker-specific aliases.
 */
export function buildColumnMap(headerTokens: string[]): ColumnMap | null {
  const normalizedTokens = headerTokens.map(t => t.toLowerCase().trim());

  const findIndex = (keywords: string[]): number => {
    for (let i = 0; i < normalizedTokens.length; i++) {
      const token = normalizedTokens[i];
      if (keywords.some(kw => token.includes(kw))) {
        return i;
      }
    }
    return -1;
  };

  const timeIndex = findIndex(HEADER_KEYWORDS.time);
  const orderIndex = findIndex(HEADER_KEYWORDS.order);
  const symbolIndex = findIndex(HEADER_KEYWORDS.symbol);
  const typeIndex = findIndex(HEADER_KEYWORDS.type);
  const qtyIndex = findIndex(HEADER_KEYWORDS.qty);
  const priceIndex = findIndex(HEADER_KEYWORDS.price);

  if (timeIndex === -1 || orderIndex === -1 || symbolIndex === -1) {
    return null;
  }

  return {
    timeIndex,
    orderIndex,
    symbolIndex,
    typeIndex: typeIndex === -1 ? -1 : typeIndex,
    qtyIndex: qtyIndex === -1 ? -1 : qtyIndex,
    priceIndex: priceIndex === -1 ? -1 : priceIndex,
  };
}

/**
 * Normalizes time strings to consistent HH:MM:SS format.
 * Handles ISO datetime strings, 12-hr, 24-hr, and date+time strings.
 */
export function normalizeTime(timeStr: string): string {
  const trimmed = timeStr.trim();

  // ISO datetime: "2024-01-15T10:30:00" or "2024-01-15 10:30:00"
  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}[T ]\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (isoMatch) {
    return normalizeTime(isoMatch[1]);
  }

  // Date + time: "15-01-2024 10:30:00" or "01/15/2024 10:30:00"
  const dateTimeMatch = trimmed.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)/);
  if (dateTimeMatch) {
    return normalizeTime(dateTimeMatch[1]);
  }

  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (match12) {
    let hours = parseInt(match12[1]);
    const minutes = match12[2];
    const seconds = match12[3] || "00";
    const period = match12[4].toUpperCase();
    if (period === "AM" && hours === 12) hours = 0;
    else if (period === "PM" && hours !== 12) hours += 12;
    return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
  } else if (match24) {
    const hours = match24[1].padStart(2, "0");
    const minutes = match24[2];
    const seconds = match24[3] || "00";
    return `${hours}:${minutes}:${seconds}`;
  }

  return trimmed;
}

/**
 * Extracts and normalizes order type from a field.
 */
function extractOrder(field: string): "BUY" | "SELL" | null {
  const normalized = field.toUpperCase().trim();
  if (normalized === "BUY" || normalized === "B") return "BUY";
  if (normalized === "SELL" || normalized === "S") return "SELL";
  if (normalized.includes("BUY")) return "BUY";
  if (normalized.includes("SELL")) return "SELL";
  return null;
}

/**
 * Cleans and normalizes symbol names.
 */
function normalizeSymbol(symbol: string): string {
  return symbol
    .replace(/\s+(NFO|BFO|NSE|BSE)$/i, "")
    .replace(/\s+(CE|PE)\s+(NFO|BFO|NSE|BSE)$/i, " $1")
    .trim();
}

/**
 * Safely parses a numeric string, handling commas and currency symbols.
 */
function parseNumeric(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[₹$,\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes a single record into a ParsedTrade.
 */
export function normalizeRecord(
  tokens: string[],
  columnMap: ColumnMap | null,
  lineNum: number
): { trade: ParsedTrade | null; error: ParseError | null } {
  try {
    let time = "";
    let order: "BUY" | "SELL" | null = null;
    let symbol = "";
    let type = "MIS";
    let qty = 0;
    let price = 0;

    if (columnMap) {
      time = columnMap.timeIndex >= 0 && tokens[columnMap.timeIndex]
        ? normalizeTime(tokens[columnMap.timeIndex]) : "";

      order = columnMap.orderIndex >= 0 && tokens[columnMap.orderIndex]
        ? extractOrder(tokens[columnMap.orderIndex]) : null;

      symbol = columnMap.symbolIndex >= 0 && tokens[columnMap.symbolIndex]
        ? normalizeSymbol(tokens[columnMap.symbolIndex]) : "";

      type = columnMap.typeIndex >= 0 && tokens[columnMap.typeIndex]
        ? tokens[columnMap.typeIndex].toUpperCase().replace(/[|\s]/g, "")
        : "MIS";

      qty = columnMap.qtyIndex >= 0 && tokens[columnMap.qtyIndex]
        ? parseNumeric(tokens[columnMap.qtyIndex]) : 0;

      price = columnMap.priceIndex >= 0 && tokens[columnMap.priceIndex]
        ? parseNumeric(tokens[columnMap.priceIndex]) : 0;

      // Fallback: scan remaining tokens for missing qty / price
      if (qty === 0 || price === 0) {
        const numbers = tokens.map(t => parseNumeric(t)).filter(n => !isNaN(n) && n > 0);
        if (qty === 0 && numbers.length > 0) {
          const qtyCandidate = numbers.find(n => Number.isInteger(n) && n < 10000);
          if (qtyCandidate) qty = qtyCandidate;
        }
        if (price === 0 && numbers.length > 0) {
          const priceCandidate = numbers.find(n => n !== qty && n < 100000);
          if (priceCandidate) price = priceCandidate;
        }
      }
    } else {
      // Positional / heuristic parsing (no recognised header)
      const firstIsTime = tokens[0] && /^\d{1,2}:\d{2}/.test(tokens[0]);

      if (firstIsTime) {
        time = normalizeTime(tokens[0]);
        order = extractOrder(tokens[1] || "");
        if (order) {
          symbol = normalizeSymbol(tokens[2] || "");
          type = (tokens[3] || "MIS").toUpperCase().replace(/[|\s]/g, "");
          qty = parseNumeric(tokens[4] || "0");
          price = parseNumeric(tokens[5] || "0");
        } else {
          symbol = normalizeSymbol(tokens[1] || "");
          const orderTypeField = tokens[2] || "";
          order = extractOrder(orderTypeField);
          type = orderTypeField.toUpperCase().replace(/BUY|SELL/g, "").replace(/[|\s]/g, "").trim() || "MIS";
          qty = parseNumeric(tokens[3] || "0");
          price = parseNumeric(tokens[4] || "0");
        }
      } else {
        symbol = normalizeSymbol(tokens[0] || "");
        const orderTypeField = tokens[1] || "";
        if (orderTypeField.includes("|")) {
          const parts = orderTypeField.split("|").map(p => p.trim());
          order = extractOrder(parts[0]);
          type = (parts[1] || "MIS").toUpperCase();
          qty = parseNumeric(tokens[2] || "0");
          price = parseNumeric(tokens[3] || "0");
          time = normalizeTime(tokens[4] || "");
        } else {
          order = extractOrder(orderTypeField);
          type = orderTypeField.toUpperCase().replace(/BUY|SELL/g, "").replace(/[|\s]/g, "").trim() || "MIS";
          qty = parseNumeric(tokens[2] || "0");
          price = parseNumeric(tokens[3] || "0");
          time = normalizeTime(tokens[4] || tokens[5] || "");
        }
      }

      // Last-resort field scanning
      if (!order) {
        for (const token of tokens) {
          const extracted = extractOrder(token);
          if (extracted) { order = extracted; break; }
        }
      }
      if (!time) {
        for (const token of tokens) {
          if (/^\d{1,2}:\d{2}/.test(token)) { time = normalizeTime(token); break; }
        }
      }
      if (qty === 0 || price === 0) {
        const numbers = tokens.map(t => parseNumeric(t)).filter(n => !isNaN(n) && n > 0);
        if (qty === 0 && numbers.length > 0) {
          const qtyCandidate = numbers.find(n => Number.isInteger(n) && n < 10000);
          if (qtyCandidate) qty = qtyCandidate;
        }
        if (price === 0 && numbers.length > 0) {
          const priceCandidate = numbers.find(n => n !== qty && n < 100000);
          if (priceCandidate) price = priceCandidate;
        }
      }
    }

    // Normalize type value
    if (!["MIS", "CNC", "NRML", "BFO", "LIM", "LIMIT", "INTRADAY", "DELIVERY", "MARGIN"].includes(type)) {
      type = "MIS";
    }

    // Validations
    if (qty > 0 && qty < 1) {
      return { trade: null, error: { line: lineNum, content: tokens.join(" | "), reason: "Invalid quantity (comma-formatting issue?)" } };
    }
    if (price > 0 && price < 0.01) {
      return { trade: null, error: { line: lineNum, content: tokens.join(" | "), reason: "Invalid price (comma-formatting issue?)" } };
    }
    if (!time) {
      return { trade: null, error: { line: lineNum, content: tokens.join(" | "), reason: "Missing time" } };
    }
    if (!order) {
      return { trade: null, error: { line: lineNum, content: tokens.join(" | "), reason: "Missing or invalid order type (BUY/SELL)" } };
    }
    if (!symbol) {
      return { trade: null, error: { line: lineNum, content: tokens.join(" | "), reason: "Missing symbol" } };
    }
    if (qty <= 0) {
      return { trade: null, error: { line: lineNum, content: tokens.join(" | "), reason: "Missing or invalid quantity" } };
    }

    return {
      trade: { time, order, symbol, type, qty: Math.floor(qty), price, pnl: "-", duration: "-" },
      error: null,
    };
  } catch (err) {
    return {
      trade: null,
      error: {
        line: lineNum,
        content: tokens.join(" | "),
        reason: err instanceof Error ? err.message : "Unknown parsing error",
      },
    };
  }
}

/**
 * Main parser function.
 * Supports all known broker CSV formats via header-based auto-detection.
 */
export function parseBrokerTrades(input: string): ParseResult {
  const result: ParseResult = { trades: [], errors: [] };

  const normalized = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalized.split("\n").filter(line => line.trim());

  if (lines.length === 0) {
    result.errors.push({ line: 0, content: "", reason: "No data found" });
    return result;
  }

  const firstLineTokens = tokenizeLine(lines[0]);
  const hasHeader = detectHeader(firstLineTokens);
  const columnMap = hasHeader ? buildColumnMap(firstLineTokens) : null;

  // Detect broker from header
  if (hasHeader) {
    result.detectedBroker = detectBrokerFromHeaders(firstLineTokens) ?? undefined;
  }

  const startLine = hasHeader ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const tokens = tokenizeLine(lines[i]);
    if (tokens.length === 0) continue;

    const { trade, error } = normalizeRecord(tokens, columnMap, i + 1);
    if (trade) result.trades.push(trade);
    else if (error) result.errors.push(error);
  }

  result.trades.sort((a, b) => a.time.localeCompare(b.time));
  return result;
}
