type ExcelCell = string | number | boolean | null | undefined;
type ExcelRow = Record<string, ExcelCell>;
type XlsxModule = typeof import("xlsx");

export type ForecastExcelRow = {
  date: string;
  forecastedSales: number;
  forecastedDemand: number;
};

export type ForecastModelComparisonRow = {
  forecast: string;
  model: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
};

export type ForecastExcelData = {
  forecastCsvResults: Array<{
    date: string;
    forecastDemand: number;
  }>;
  forecastResults: ForecastExcelRow[];
  modelComparison: ForecastModelComparisonRow[];
};

const EXCEL_PATHS = {
  forecastCsvResults: "/data/forecast_results.csv",
  forecastResults: "/data/Levis_Forecast_Results.xlsx",
  modelComparison: "/data/Model_Comparison.xlsx"
};

let cachedForecastData: Promise<ForecastExcelData> | null = null;

function value(row: ExcelRow, keys: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, item]) => [key.trim().toLowerCase(), item]));
  for (const key of keys) {
    const item = normalized.get(key.trim().toLowerCase());
    if (item !== undefined && item !== null && item !== "") return item;
  }
  return "";
}

function toNumber(input: ExcelCell) {
  if (typeof input === "number") return input;
  const parsed = Number(String(input ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(input: ExcelCell, XLSX: XlsxModule) {
  if (typeof input === "number") {
    const parsed = XLSX.SSF.parse_date_code(input);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)).toISOString().slice(0, 10);
    }
  }
  const parsed = new Date(String(input));
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(input ?? "");
}

async function readWorkbookRows(path: string, XLSX: XlsxModule): Promise<ExcelRow[]> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
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

async function readForecastCsvRows() {
  const response = await fetch(EXCEL_PATHS.forecastCsvResults);
  if (!response.ok) {
    throw new Error(`Unable to load ${EXCEL_PATHS.forecastCsvResults}`);
  }
  const text = await response.text();
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = headers.reduce<Record<string, string>>((currentRow, header, index) => {
      currentRow[header] = values[index]?.trim() ?? "";
      return currentRow;
    }, {});
    return {
      date: row.Date ?? row.date ?? "",
      forecastDemand: toNumber(row["Forecast Demand"] ?? row.Prediction ?? row.Forecast)
    };
  });
}

function mapForecastRow(row: ExcelRow, XLSX: XlsxModule): ForecastExcelRow {
  return {
    date: toIsoDate(value(row, ["Date"]), XLSX),
    forecastedDemand: toNumber(value(row, ["Forecasted_Demand", "Forecasted Demand"])),
    forecastedSales: toNumber(value(row, ["Forecasted_Sales", "Forecasted Sales"]))
  };
}

function mapModelRow(row: ExcelRow): ForecastModelComparisonRow {
  return {
    forecast: String(value(row, ["Forecast"]) || "").trim(),
    mae: toNumber(value(row, ["MAE"])),
    mape: toNumber(value(row, ["MAPE"])),
    model: String(value(row, ["Model"]) || "").trim(),
    r2: toNumber(value(row, ["R²", "R2"])),
    rmse: toNumber(value(row, ["RMSE"]))
  };
}

export function loadForecastExcelData(): Promise<ForecastExcelData> {
  cachedForecastData ??= import("xlsx").then(async (XLSX) => {
    const [forecastRows, modelRows, forecastCsvResults] = await Promise.all([
      readWorkbookRows(EXCEL_PATHS.forecastResults, XLSX),
      readWorkbookRows(EXCEL_PATHS.modelComparison, XLSX),
      readForecastCsvRows()
    ]);

    return {
      forecastCsvResults: forecastCsvResults.filter((row) => row.date),
      forecastResults: forecastRows.map((row) => mapForecastRow(row, XLSX)).filter((row) => row.date),
      modelComparison: modelRows.map(mapModelRow).filter((row) => row.model && row.forecast),
    };
  });

  return cachedForecastData;
}
