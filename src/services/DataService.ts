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
  salesInventory: "/data/levis_sales_inventory.csv"
};

let cachedData: Promise<AnalyticsData> | null = null;

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
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getValue(row: CsvRow, candidates: string[]) {
  const entries = Object.entries(row);
  const normalizedCandidates = candidates.map(normalizeKey);
  const found = entries.find(([key]) => normalizedCandidates.includes(normalizeKey(key)));
  return found?.[1] ?? "";
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
  return {
    ageingCategory: getValue(row, ["Ageing Category"]),
    ageingDays: toNumber(getValue(row, ["Ageing Days"])),
    amount: toNumber(getValue(row, ["Amount", "Revenue", "Sales"])),
    billDate: getValue(row, ["Bill Date", "Date"]),
    day: getValue(row, ["Day"]),
    department: getValue(row, ["Department", "Product Name.1"]),
    month: getValue(row, ["Month"]),
    monthNumber: toNumber(getValue(row, ["Month Number"])),
    movementType: getValue(row, ["Movement Type"]),
    mrp: toNumber(getValue(row, ["MRP"])),
    productName: getValue(row, ["Product Name"]),
    quantity: toNumber(getValue(row, ["Quantity", "Sales Quantity", "Units Sold"])),
    revenuePerUnit: toNumber(getValue(row, ["Revenue per Unit"])),
    season: getValue(row, ["Season"]),
    size: getValue(row, ["Size"]),
    state: getValue(row, ["State"]),
    stock: toNumber(getValue(row, ["Stock", "Inventory"])),
    storeName: getValue(row, ["Store Name"]),
    year: getValue(row, ["Year"])
  };
}

function mapMonthlySales(row: CsvRow): MonthlySalesRow {
  return {
    date: getValue(row, ["Date"]),
    sales: toNumber(getValue(row, ["Sales", "Revenue"]))
  };
}

export function mapForecast(row: CsvRow): ForecastRow {
  return {
    date: getValue(row, ["Date"]),
    forecastDemand: toNumber(getValue(row, ["Forecast Demand", "Prediction", "Forecast"]))
  };
}

export function mapModelMetric(row: CsvRow): ModelMetricRow {
  return {
    mae: toNumber(getValue(row, ["MAE"])),
    mape: toNumber(getValue(row, ["MAPE"])),
    model: getValue(row, ["Model"]),
    r2: toNumber(getValue(row, ["R2", "R²"])),
    rmse: toNumber(getValue(row, ["RMSE"]))
  };
}

export const DataService = {
  loadAnalyticsData() {
    cachedData ??= Promise.all([
      fetchCsv(DATA_PATHS.salesInventory),
      fetchCsv(DATA_PATHS.monthlySales)
    ]).then(([salesInventory, monthlySales]) => ({
      forecastResults: [],
      modelMetrics: [],
      monthlySales: monthlySales.map(mapMonthlySales),
      salesInventory: salesInventory.map(mapSalesInventory)
    }));

    return cachedData;
  },

  async loadMonthlySalesData() {
    const rows = await fetchCsv(DATA_PATHS.monthlySales);
    return rows.map(mapMonthlySales);
  },

  async loadSalesInventoryData() {
    const rows = await fetchCsv(DATA_PATHS.salesInventory);
    return rows.map(mapSalesInventory);
  }
};
