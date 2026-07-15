import fs from "node:fs";
import path from "node:path";

import Papa from "papaparse";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "public", "data", "levis_sales_inventory.csv");
const outputPath = path.join(projectRoot, "public", "data", "dashboard_sales_inventory.csv");

const dashboardColumns = [
  "Store Name",
  "Bill Date",
  "Year",
  "Month",
  "Month Number",
  "Day",
  "Season",
  "Quantity",
  "Amount",
  "Product Name",
  "Department",
  "Gender",
  "MRP",
  "Size",
  "State ",
  "Stock ",
  "Ageing Days",
  "Ageing Category",
  "Movement Type",
  "Revenue per Unit"
];

const sensitiveColumns = [
  "Alternate Store Code",
  "Store GST Number",
  "Bill Time",
  "TIME SLOT",
  "Bill Number",
  "Customer Name",
  "Alternate Product Code",
  "Salesman Name",
  "Return Status",
  "Product Description",
  "Customer Type",
  "Last Received Data"
];

const source = fs.readFileSync(sourcePath, "utf8");
const parsed = Papa.parse(source, {
  header: true,
  skipEmptyLines: true
});

if (parsed.errors.length) {
  const details = parsed.errors.slice(0, 5).map((error) => error.message).join("; ");
  throw new Error(`Unable to parse private source dataset: ${details}`);
}

const rows = parsed.data.map((row) =>
  Object.fromEntries(dashboardColumns.map((column) => [column, row[column] ?? ""]))
);

function numericTotal(items, column) {
  return items.reduce((total, row) => total + Number(String(row[column] ?? "").replaceAll(",", "")), 0);
}

function uniqueCount(items, column) {
  return new Set(items.map((row) => String(row[column] ?? "").trim()).filter(Boolean)).size;
}

const validations = [
  ["rows", parsed.data.length, rows.length],
  ["quantity", numericTotal(parsed.data, "Quantity"), numericTotal(rows, "Quantity")],
  ["revenue", numericTotal(parsed.data, "Amount"), numericTotal(rows, "Amount")],
  ["inventory", numericTotal(parsed.data, "Stock "), numericTotal(rows, "Stock ")],
  ["stores", uniqueCount(parsed.data, "Store Name"), uniqueCount(rows, "Store Name")],
  ["products", uniqueCount(parsed.data, "Product Name"), uniqueCount(rows, "Product Name")],
  ["departments", uniqueCount(parsed.data, "Department"), uniqueCount(rows, "Department")],
  ["genders", uniqueCount(parsed.data, "Gender"), uniqueCount(rows, "Gender")]
];

const mismatches = validations.filter(([, sourceValue, outputValue]) => sourceValue !== outputValue);
if (mismatches.length) {
  throw new Error(
    `Dashboard data validation failed: ${mismatches
      .map(([label, sourceValue, outputValue]) => `${label} (${sourceValue} !== ${outputValue})`)
      .join(", ")}`
  );
}

const output = Papa.unparse(rows, {
  columns: dashboardColumns,
  newline: "\n",
  quotes: true
});

fs.writeFileSync(outputPath, `${output}\n`, "utf8");

const outputHeader = Object.keys(rows[0] ?? {});
const leakedColumns = sensitiveColumns.filter((column) => outputHeader.includes(column));
if (leakedColumns.length) {
  throw new Error(`Sensitive columns leaked into dashboard dataset: ${leakedColumns.join(", ")}`);
}

console.log(`Created ${path.relative(projectRoot, outputPath)} with ${rows.length.toLocaleString("en-IN")} analytics rows.`);
console.log(`Removed ${sensitiveColumns.length} sensitive or unnecessary source columns.`);
console.log("Validated row count, revenue, quantity, inventory, store, product, department, and gender totals against the private source.");
