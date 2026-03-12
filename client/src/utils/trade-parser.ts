/**
 * Trade Parser Utility
 * 
 * Handles flexible parsing of P&L trade data from various broker formats.
 * Supports header detection, multiple delimiters, and various time formats.
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
}

interface ColumnMap {
  timeIndex: number;
  orderIndex: number;
  symbolIndex: number;
  typeIndex: number;
  qtyIndex: number;
  priceIndex: number;
}

const HEADER_KEYWORDS = {
  time: ["time", "timestamp", "tm"],
  order: ["order", "side", "action", "buy/sell"],
  symbol: ["symbol", "script", "scrip", "instrument", "stock", "pe/ce", "ce/pe"],
  type: ["type", "product", "prd"],
  qty: ["qty", "quantity", "qn", "lot", "lots"],
  price: ["price", "prc", "rate", "value"],
};

/**
 * Tokenizes a line by detecting the appropriate delimiter
 */
export function tokenizeLine(line: string): string[] {
  const trimmed = line.trim();
  
  if (!trimmed) {
    return [];
  }

  let tokens: string[] = [];
  
  // Check for quoted CSV first
  if (trimmed.includes('"') || trimmed.includes("'")) {
    // Handle quoted CSV with regex
    const csvRegex = /(?:^|,)(?:"([^"]*)"|'([^']*)'|([^,]*))/g;
    let match;
    while ((match = csvRegex.exec(trimmed)) !== null) {
      tokens.push((match[1] || match[2] || match[3] || "").trim());
    }
  }
  // Tab-separated
  else if (trimmed.includes("\t")) {
    tokens = trimmed.split("\t").map(t => t.trim());
  }
  // Comma-separated
  else if (trimmed.includes(",")) {
    tokens = trimmed.split(",").map(t => t.trim());
  }
  // Multiple spaces
  else if (trimmed.match(/\s{2,}/)) {
    tokens = trimmed.split(/\s{2,}/).map(t => t.trim());
  }
  // Single space (fallback)
  else {
    tokens = trimmed.split(/\s+/).map(t => t.trim());
  }

  return tokens.filter(t => t.length > 0);
}

/**
 * Detects if a line is a header by checking for known keywords
 */
export function detectHeader(tokens: string[]): boolean {
  if (tokens.length < 3) {
    return false;
  }

  const normalizedTokens = tokens.map(t => t.toLowerCase());
  let matchCount = 0;

  // Check each token against all keyword categories
  for (const token of normalizedTokens) {
    for (const keywords of Object.values(HEADER_KEYWORDS)) {
      if (keywords.some(kw => token.includes(kw))) {
        matchCount++;
        break;
      }
    }
  }

  // If at least 3 tokens match header keywords, it's a header
  return matchCount >= 3;
}

/**
 * Builds a column map from header tokens
 */
export function buildColumnMap(headerTokens: string[]): ColumnMap | null {
  const normalizedTokens = headerTokens.map(t => t.toLowerCase());
  
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

  // Require at least time, order, and symbol to be present
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
 * Normalizes time strings to consistent HH:MM:SS format
 */
export function normalizeTime(timeStr: string): string {
  const trimmed = timeStr.trim();
  
  // Match HH:MM:SS with optional AM/PM
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?\s*(AM|PM)$/i);

  if (match12) {
    // 12-hour format with AM/PM
    let hours = parseInt(match12[1]);
    const minutes = match12[2];
    const seconds = match12[4] || "00";
    const period = match12[5].toUpperCase();

    // Convert to 24-hour format
    if (period === "AM" && hours === 12) {
      hours = 0;
    } else if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
  } else if (match24) {
    // 24-hour format
    const hours = match24[1].padStart(2, "0");
    const minutes = match24[2];
    const seconds = match24[4] || "00";
    return `${hours}:${minutes}:${seconds}`;
  }

  // Fallback: return as-is
  return trimmed;
}

/**
 * Extracts and normalizes order type from a field
 */
function extractOrder(field: string): "BUY" | "SELL" | null {
  const normalized = field.toUpperCase().trim();
  
  // Direct match
  if (normalized === "BUY" || normalized === "B") {
    return "BUY";
  }
  if (normalized === "SELL" || normalized === "S") {
    return "SELL";
  }
  
  // Check if field contains BUY or SELL
  if (normalized.includes("BUY")) {
    return "BUY";
  }
  if (normalized.includes("SELL")) {
    return "SELL";
  }
  
  return null;
}

/**
 * Cleans and normalizes symbol names
 */
function normalizeSymbol(symbol: string): string {
  return symbol
    .replace(/\s+(NFO|BFO|NSE|BSE)$/i, "")
    .replace(/\s+(CE|PE)\s+(NFO|BFO|NSE|BSE)$/i, " $1")
    .trim();
}

/**
 * Safely parses a numeric string, handling commas and currency symbols
 */
function parseNumeric(value: string): number {
  if (!value) return 0;
  
  // Remove common currency symbols and separators
  const cleaned = value
    .replace(/[₹$,\s]/g, "")  // Remove ₹, $, commas, and spaces
    .trim();
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes a single record into a ParsedTrade
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
      // Header-based parsing
      time = columnMap.timeIndex >= 0 && tokens[columnMap.timeIndex] 
        ? normalizeTime(tokens[columnMap.timeIndex]) 
        : "";
      
      order = columnMap.orderIndex >= 0 && tokens[columnMap.orderIndex]
        ? extractOrder(tokens[columnMap.orderIndex])
        : null;
      
      symbol = columnMap.symbolIndex >= 0 && tokens[columnMap.symbolIndex]
        ? normalizeSymbol(tokens[columnMap.symbolIndex])
        : "";
      
      type = columnMap.typeIndex >= 0 && tokens[columnMap.typeIndex]
        ? tokens[columnMap.typeIndex].toUpperCase().replace(/[|\s]/g, "")
        : "MIS";
      
      qty = columnMap.qtyIndex >= 0 && tokens[columnMap.qtyIndex]
        ? parseNumeric(tokens[columnMap.qtyIndex])
        : 0;
      
      price = columnMap.priceIndex >= 0 && tokens[columnMap.priceIndex]
        ? parseNumeric(tokens[columnMap.priceIndex])
        : 0;

      // If qty or price not found in mapped columns, search all tokens
      if (qty === 0 || price === 0) {
        const numbers = tokens
          .map(t => parseNumeric(t))
          .filter(n => !isNaN(n) && n > 0);
        
        if (qty === 0 && numbers.length > 0) {
          // First number that looks like a quantity (integer)
          const qtyCandidate = numbers.find(n => Number.isInteger(n) && n < 10000);
          if (qtyCandidate) qty = qtyCandidate;
        }
        
        if (price === 0 && numbers.length > 0) {
          // First number that looks like a price (could be decimal)
          const priceCandidate = numbers.find(n => n !== qty && n < 100000);
          if (priceCandidate) price = priceCandidate;
        }
      }
    } else {
      // Positional parsing (fallback for no header)
      // Try to detect format by examining tokens
      
      // Check if first token is a time
      const firstIsTime = tokens[0] && /^\d{1,2}:\d{2}/.test(tokens[0]);
      
      if (firstIsTime) {
        // Format: TIME, SYMBOL/ORDER, ...
        time = normalizeTime(tokens[0]);
        
        // Check if second token is order
        order = extractOrder(tokens[1] || "");
        if (order) {
          // TIME, ORDER, SYMBOL, TYPE, QTY, PRICE
          symbol = normalizeSymbol(tokens[2] || "");
          type = (tokens[3] || "MIS").toUpperCase().replace(/[|\s]/g, "");
          qty = parseNumeric(tokens[4] || "0");
          price = parseNumeric(tokens[5] || "0");
        } else {
          // TIME, SYMBOL, ORDER/TYPE, QTY, PRICE
          symbol = normalizeSymbol(tokens[1] || "");
          const orderTypeField = tokens[2] || "";
          order = extractOrder(orderTypeField);
          type = orderTypeField.toUpperCase().replace(/BUY|SELL/g, "").replace(/[|\s]/g, "").trim() || "MIS";
          qty = parseNumeric(tokens[3] || "0");
          price = parseNumeric(tokens[4] || "0");
        }
      } else {
        // Format: SYMBOL, ORDER/TYPE, QTY, PRICE, TIME
        symbol = normalizeSymbol(tokens[0] || "");
        
        const orderTypeField = tokens[1] || "";
        
        // Check for "BUY| NRML" format
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

      // If still missing data, try to extract from all tokens
      if (!order) {
        for (const token of tokens) {
          const extracted = extractOrder(token);
          if (extracted) {
            order = extracted;
            break;
          }
        }
      }

      if (!time) {
        for (const token of tokens) {
          if (/^\d{1,2}:\d{2}/.test(token)) {
            time = normalizeTime(token);
            break;
          }
        }
      }

      if (qty === 0 || price === 0) {
        const numbers = tokens
          .map(t => parseNumeric(t))
          .filter(n => !isNaN(n) && n > 0);
        
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

    // Validate that parsed quantities and prices are valid
    if (qty > 0 && qty < 1) {
      // Likely a parsing error (e.g., "1,234" became "1")
      return {
        trade: null,
        error: {
          line: lineNum,
          content: tokens.join(" | "),
          reason: "Invalid quantity detected (possible comma-formatting issue)",
        },
      };
    }

    if (price > 0 && price < 0.01) {
      // Likely a parsing error
      return {
        trade: null,
        error: {
          line: lineNum,
          content: tokens.join(" | "),
          reason: "Invalid price detected (possible comma-formatting issue)",
        },
      };
    }

    // Clean up type
    if (!["MIS", "CNC", "NRML", "BFO", "LIM", "LIMIT"].includes(type)) {
      type = "MIS";
    }

    // Validate required fields
    if (!time) {
      return {
        trade: null,
        error: {
          line: lineNum,
          content: tokens.join(" | "),
          reason: "Missing time",
        },
      };
    }

    if (!order) {
      return {
        trade: null,
        error: {
          line: lineNum,
          content: tokens.join(" | "),
          reason: "Missing or invalid order type (BUY/SELL)",
        },
      };
    }

    if (!symbol) {
      return {
        trade: null,
        error: {
          line: lineNum,
          content: tokens.join(" | "),
          reason: "Missing symbol",
        },
      };
    }

    if (qty <= 0) {
      return {
        trade: null,
        error: {
          line: lineNum,
          content: tokens.join(" | "),
          reason: "Missing or invalid quantity",
        },
      };
    }

    return {
      trade: {
        time,
        order,
        symbol,
        type,
        qty: Math.floor(qty),
        price,
        pnl: "-",
        duration: "-",
      },
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
 * Main parser function
 */
export function parseBrokerTrades(input: string): ParseResult {
  const result: ParseResult = {
    trades: [],
    errors: [],
  };

  // Normalize line endings and strip BOM
  const normalized = input
    .replace(/^\uFEFF/, "") // Remove BOM
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalized.split("\n").filter(line => line.trim());

  if (lines.length === 0) {
    result.errors.push({
      line: 0,
      content: "",
      reason: "No data found",
    });
    return result;
  }

  // Detect header
  const firstLineTokens = tokenizeLine(lines[0]);
  const hasHeader = detectHeader(firstLineTokens);
  const columnMap = hasHeader ? buildColumnMap(firstLineTokens) : null;

  // Start parsing from line 1 if header exists, otherwise line 0
  const startLine = hasHeader ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const tokens = tokenizeLine(lines[i]);
    
    if (tokens.length === 0) {
      continue; // Skip empty lines
    }

    const { trade, error } = normalizeRecord(tokens, columnMap, i + 1);

    if (trade) {
      result.trades.push(trade);
    } else if (error) {
      result.errors.push(error);
    }
  }

  // Sort trades by time
  result.trades.sort((a, b) => a.time.localeCompare(b.time));

  return result;
}
