import { useState } from "react";
import axios from "../utils/api";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";

const HEADERS = [
  "fullName",
  "email",
  "mobile",
  "city",
  "state",
  "category",
  "igLink",
  "igFollowers",
  "avgReel",
  "ytLink",
  "ytSubs",
  "fbLink",
  "fbFollowers",
  "liLink",
  "liFollowers",
  "engagement",
];
const DEMO_ROWS = [
  [
    "Jane Doe",
    "jane@example.com",
    "9876543210",
    "Mumbai",
    "Maharashtra",
    "Travel; Food",
    "https://instagram.com/janedoe",
    "50K",
    "20K",
    "",
    "",
    "",
    "",
    "",
    "",
    "4.5",
  ],
  [
    "Priya Verma",
    "priya@example.com",
    "9123456780",
    "Delhi",
    "Delhi",
    "Fashion",
    "",
    "",
    "",
    "https://youtube.com/@priya",
    "80K",
    "",
    "",
    "",
    "",
    "3.2",
  ],
];

const cellText = (value) => {
  if (value && typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.hyperlink) return String(value.hyperlink).trim();
    if (value.richText) return value.richText.map((p) => p.text).join("").trim();
    if (value.result !== undefined) return String(value.result).trim();
  }
  return String(value ?? "").trim();
};

const ImportCreatorsModal = ({ open, onClose, onImported }) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const close = () => {
    if (busy) return;
    setResult(null);
    setError("");
    onClose();
  };

  const downloadDemo = async () => {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Creators");
    sheet.addRow(HEADERS).font = { bold: true };
    DEMO_ROWS.forEach((row) => sheet.addRow(row));
    sheet.columns.forEach((column) => {
      column.width = 20;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "creators-demo.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const runImport = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];
      const keys = [];
      sheet?.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
        keys[col - 1] = cellText(cell.value);
      });
      if (!sheet || !keys.includes("fullName") || sheet.rowCount < 2) {
        setError("Please use the demo Excel format with at least one creator row.");
        toast.error("Please use the demo Excel format with at least one creator row.");
        return;
      }
      let imported = 0;
      const failures = [];
      for (let r = 2; r <= sheet.rowCount; r += 1) {
        const row = sheet.getRow(r);
        const record = {};
        keys.forEach((key, i) => {
          if (key) record[key] = cellText(row.getCell(i + 1).value);
        });
        if (!Object.values(record).some(Boolean)) continue;
        const payload = {
          ...record,
          category: (record.category || "")
            .split(/[;|,]/)
            .map((item) => item.trim())
            .filter(Boolean),
          consent1: true,
          consent2: true,
          consent3: true,
        };
        try {
          await axios.post("/api/creators", payload, { withCredentials: true });
          imported += 1;
        } catch (requestError) {
          failures.push(
            `Row ${r}: ${requestError.response?.data?.message || "Failed"}`,
          );
        }
      }
      setResult({ imported, failures });
      if (imported) onImported();
      const plural = (n) => `${n} creator${n === 1 ? "" : "s"}`;
      if (imported && !failures.length) {
        toast.success(`${plural(imported)} imported successfully`);
        setResult(null);
        onClose();
      } else if (imported) {
        toast.warning(
          `${plural(imported)} imported, ${failures.length} row${failures.length === 1 ? "" : "s"} failed`,
        );
      } else {
        toast.error("No creators were imported. Check the errors below.");
      }
    } catch {
      setError("Could not read the file. Please upload a valid .xlsx file.");
      toast.error("Could not read the file. Please upload a valid .xlsx file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Import creators from Excel</DialogTitle>
      <DialogContent className="!space-y-4">
        <p className="text-sm text-stone-600">
          Upload an .xlsx file with one creator per row. Valid rows are saved;
          invalid rows are listed so you can fix and re-upload them.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Not sure about the format?
          </span>
          <button
            type="button"
            onClick={downloadDemo}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            <Download className="h-4 w-4" /> Download demo Excel
          </button>
        </div>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label="Choose Excel file"
          disabled={busy}
          onChange={(event) => {
            runImport(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="block w-full rounded-xl border border-[#ded7c9] p-3 text-sm text-stone-700"
        />
        {busy && <p className="text-sm text-stone-500">Importing...</p>}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {result && (
          <div role="status" className="rounded-lg bg-stone-50 p-3 text-sm">
            <p className="font-medium text-stone-800">
              {result.imported} imported, {result.failures.length} failed
            </p>
            {result.failures.length > 0 && (
              <ul className="mt-2 max-h-32 list-disc overflow-auto pl-5 text-red-700">
                {result.failures.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end pb-1">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="px-2 py-1 text-sm font-medium text-stone-700 hover:text-stone-900 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCreatorsModal;
