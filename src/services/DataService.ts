import type {
  AnalyticsData,
  CsvRow,
  ForecastRow,
  ModelMetricRow,
  MonthlySalesRow,
  SalesInventoryRow
} from "@/types/analytics";

const DATA_PATHS = {
  monthlySales: "/data/monthly_sales.csv",
  salesInventory: "/data/dashboard_sales_inventory.csv"
};

let cachedData: Promise<AnalyticsData> | null = null;
let cachedMonthlySales: Promise<MonthlySalesRow[]> | null = null;
let cachedSalesInventory: Promise<SalesInventoryRow[]> | null = null;
const normalizedKeyCache = new Map<string, string>();

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]).map((header) => normalizeKey(header.trim()));

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });
}

function normalizeKey(value: string) {
  const cached = normalizedKeyCache.get(value);
  if (cached !== undefined) return cached;
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  normalizedKeyCache.set(value, normalized);
  return normalized;
}

function normalizedRow(row: CsvRow) {
  const firstKey = Object.keys(row)[0];
  if (!firstKey || firstKey === normalizeKey(firstKey)) return row;

  return Object.entries(row).reduce<CsvRow>((normalized, [key, value]) => {
    normalized[normalizeKey(key)] = value;
    return normalized;
  }, {});
}

function getValue(row: CsvRow, first: string, second?: string, third?: string) {
  const firstValue = row[normalizeKey(first)];
  if (firstValue !== undefined) return firstValue;
  if (second) {
    const secondValue = row[normalizeKey(second)];
    if (secondValue !== undefined) return secondValue;
  }
  if (third) {
    const thirdValue = row[normalizeKey(third)];
    if (thirdValue !== undefined) return thirdValue;
  }
  return "";
}

function toNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchCsv(path: string) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }

  return parseCsv(await response.text());
}

function mapSalesInventory(row: CsvRow): SalesInventoryRow {
  const normalized = normalizedRow(row);
  return {
    ageingCategory: getValue(normalized, "Ageing Category"),
    ageingDays: toNumber(getValue(normalized, "Ageing Days")),
    amount: toNumber(getValue(normalized, "Amount", "Revenue", "Sales")),
    billDate: getValue(normalized, "Bill Date", "Date"),
    day: getValue(normalized, "Day"),
    department: getValue(normalized, "Department", "Product Name.1"),
    month: getValue(normalized, "Month"),
    monthNumber: toNumber(getValue(normalized, "Month Number")),
    movementType: getValue(normalized, "Movement Type"),
    mrp: toNumber(getValue(normalized, "MRP")),
    productName: getValue(normalized, "Product Name"),
    quantity: toNumber(getValue(normalized, "Quantity", "Sales Quantity", "Units Sold")),
    revenuePerUnit: toNumber(getValue(normalized, "Revenue per Unit")),
    season: getValue(normalized, "Season"),
    size: getValue(normalized, "Size"),
    state: getValue(normalized, "State"),
    stock: toNumber(getValue(normalized, "Stock", "Inventory")),
    storeName: getValue(normalized, "Store Name"),
    year: getValue(normalized, "Year")
  };
}

function mapMonthlySales(row: CsvRow): MonthlySalesRow {
  const normalized = normalizedRow(row);
  return {
    date: getValue(normalized, "Date"),
    sales: toNumber(getValue(normalized, "Sales", "Revenue"))
  };
}

export function mapForecast(row: CsvRow): ForecastRow {
  const normalized = normalizedRow(row);
  return {
    date: getValue(normalized, "Date"),
    forecastDemand: toNumber(getValue(normalized, "Forecast Demand", "Prediction", "Forecast"))
  };
}

export function mapModelMetric(row: CsvRow): ModelMetricRow {
  const normalized = normalizedRow(row);
  return {
    mae: toNumber(getValue(normalized, "MAE")),
    mape: toNumber(getValue(normalized, "MAPE")),
    model: getValue(normalized, "Model"),
    r2: toNumber(getValue(normalized, "R2", "R²")),
    rmse: toNumber(getValue(normalized, "RMSE"))
  };
}

export const DataService = {
  loadAnalyticsData() {
    cachedData ??= Promise.all([
      this.loadSalesInventoryData(),
      this.loadMonthlySalesData()
    ]).then(([salesInventory, monthlySales]) => ({
      forecastResults: [],
      modelMetrics: [],
      monthlySales,
      salesInventory
    }));

    return cachedData;
  },

  loadMonthlySalesData() {
    cachedMonthlySales ??= fetchCsv(DATA_PATHS.monthlySales).then((rows) => rows.map(mapMonthlySales));
    return cachedMonthlySales;
  },

  loadSalesInventoryData() {
    cachedSalesInventory ??= fetchCsv(DATA_PATHS.salesInventory).then((rows) => rows.map(mapSalesInventory));
    return cachedSalesInventory;
  }
};
