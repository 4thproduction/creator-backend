import { useCallback, useEffect, useRef, useState } from "react";
import axios from "../utils/api";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  FormControl,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { toApiDate } from "../utils/istDates";
import IstDatePicker from "../components/IstDatePicker";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const columns = [
  "Serial No.",
  "Creator",
  "Contact",
  "Email",
  "Category",
  "City",
  "Platforms",
  "Followers",
  "Engagement",
  "Avg. reel views",
  "Actions",
];
const platforms = [
  ["Instagram", "igLink", "igFollowers"],
  ["YouTube", "ytLink", "ytSubs"],
  ["Facebook", "fbLink", "fbFollowers"],
  ["LinkedIn", "liLink", "liFollowers"],
];
const numeric = (value) => {
  const match = String(value ?? "")
    .replace(/[,\s%]/g, "")
    .match(/^(\d+(?:\.\d+)?)([KMLB])?$/i);
  return match
    ? Number(match[1]) *
        ({ K: 1e3, L: 1e5, M: 1e6, B: 1e9 }[match[2]?.toUpperCase()] || 1)
    : null;
};
const compact = (value) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
const followers = (creator) => {
  const values = platforms
    .filter(([, link]) => creator[link]?.trim())
    .map(([, , field]) => numeric(creator[field]))
    .filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
};
const filterClass =
  "h-10 rounded-xl border border-[#ded7c9] bg-white px-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-[#aa8241]";

const formatName = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase());

const CreatorsScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const permissions = userInfo?.user?.role?.permissions || [];
  const [creators, setCreators] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState(null);

  const [filters, setFilters] = useState({
    platform: "",
    category: "",
    city: "",
    search: "",
    period: "all",
    from: "",
    to: "",
  });
  const [options, setOptions] = useState({ categories: [], cities: [] });
  const requestId = useRef(0);
  const fromDate = toApiDate(filters.from);
  const toDate = toApiDate(filters.to);
  const validRange =
    filters.period !== "custom" ||
    Boolean(fromDate && toDate && fromDate <= toDate);
  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const config = { withCredentials: true };
  const loadCreators = useCallback(async () => {
    const id = ++requestId.current;
    if (!validRange) {
      setLoading(false);
      setCreators([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_URL}/api/creators`, {
        ...config,
        params: {
          page,
          limit,
          ...filters,
          from: toApiDate(filters.from),
          to: toApiDate(filters.to),
        },
      });
      if (id !== requestId.current) return;
      if (!data || !Array.isArray(data.creators)) {
        // Usually means the API URL returned an HTML page (e.g. nginx not
        // routing /portal/api to the backend) instead of JSON.
        setCreators([]);
        setTotal(0);
        setError("Unexpected response from server. Check the API routing.");
        return;
      }
      setOptions({
        categories: data.categories || [],
        cities: data.cities || [],
      });
      setCreators(data.creators);
      setTotal(data.total || 0);
    } catch (requestError) {
      if (id === requestId.current)
        setError(
          requestError.response?.data?.message || "Could not load creators",
        );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [page, limit, userInfo.user._id, filters, validRange]);

  useEffect(() => {
    const timer = setTimeout(loadCreators, 250);
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
    };
  }, [loadCreators]);

  const remove = async (creator) => {
    if (!window.confirm(`Delete ${creator.fullName}? This cannot be undone.`))
      return;
    setBusyId(creator._id);
    setError("");
    try {
      await axios.delete(`${API_URL}/api/creators/${creator._id}`, config);
      if (creators.length === 1 && page > 1) setPage(page - 1);
      else await loadCreators();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not delete creator",
      );
    } finally {
      setBusyId(null);
    }
  };

  const exportFile = async (format) => {
    setExporting(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_URL}/api/creators/export/${format}`,
        {
          ...config,
          params: { ...filters, from: fromDate, to: toDate },
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `creators.${format === "pdf" ? "pdf" : "xls"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not export creators");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="portal-shell flex">
      <Sidebar />
      <div className="portal-main ml-0 flex min-w-0 flex-1 flex-col md:ml-72">
        <Navbar title="Creators" />
        <main className="portal-content flex-1 p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">
              {total} creator{total === 1 ? "" : "s"} matching
            </p>
            <div className="flex items-center gap-2">
              {permissions.includes("create_creator") && (
                <Link to="/creators/new" className="portal-button text-sm">
                  <Plus className="h-4 w-4" /> Add Creator
                </Link>
              )}
              {permissions.includes("export_creator") && (
                <div>
                  <button
                    type="button"
                    disabled={exporting || !validRange || loading}
                    onClick={(event) => setDownloadAnchor(event.currentTarget)}
                    aria-label="Download creators"
                    title="Download"
                    aria-haspopup="menu"
                    aria-expanded={Boolean(downloadAnchor)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <Menu
                    anchorEl={downloadAnchor}
                    open={Boolean(downloadAnchor)}
                    onClose={() => setDownloadAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setDownloadAnchor(null);
                        exportFile("excel");
                      }}
                      className="!gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-700" />{" "}
                      Excel
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setDownloadAnchor(null);
                        exportFile("pdf");
                      }}
                      className="!gap-2"
                    >
                      <FileText className="h-4 w-4 text-red-700" /> PDF
                    </MenuItem>
                  </Menu>
                </div>
              )}
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="search"
              aria-label="Search creators by name or email"
              placeholder="Search by name or email"
              value={filters.search}
              onChange={(event) => changeFilter("search", event.target.value)}
              className={`${filterClass} w-full sm:w-64`}
            />
            <select
              aria-label="Filter by platform"
              value={filters.platform}
              onChange={(event) => changeFilter("platform", event.target.value)}
              className={filterClass}
            >
              <option value="">All platforms</option>
              {platforms.map(([name]) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(event) => changeFilter("category", event.target.value)}
              className={filterClass}
            >
              <option value="">All categories</option>
              {options.categories.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <select
              aria-label="Filter by city"
              value={filters.city}
              onChange={(event) => changeFilter("city", event.target.value)}
              className={filterClass}
            >
              <option value="">All cities</option>
              {options.cities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <select
              aria-label="Creator record date period"
              value={filters.period}
              onChange={(event) => changeFilter("period", event.target.value)}
              className={filterClass}
            >
              <option value="all">All dates</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
            {filters.period === "custom" && (
              <>
                <label className="flex items-center gap-2 text-sm text-stone-500">
                  From
                  <IstDatePicker
                    label="From date (IST)"
                    value={filters.from}
                    onChange={(value) => changeFilter("from", value)}
                    max={filters.to}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-500">
                  To
                  <IstDatePicker
                    label="To date (IST)"
                    value={filters.to}
                    onChange={(value) => changeFilter("to", value)}
                    min={filters.from}
                  />
                </label>
              </>
            )}
          </div>
 
          {!validRange && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              Enter valid dates in dd/mm/yy format, with the start on or before
              the end.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <TableContainer className="rounded-xl border border-stone-300 bg-white shadow-sm">
            <Table aria-label="Creators" className="min-w-[850px]">
              <TableHead className="bg-stone-100">
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      className="!whitespace-nowrap !border-stone-300 !px-4 !py-3 !text-xs !font-bold !uppercase !tracking-wide !text-stone-700"
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading || creators.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      className="!py-10 !text-sm !text-stone-500"
                    >
                      {loading ? "Loading creators..." : "No creators found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  creators.map((creator, index) => (
                    <TableRow key={creator._id} className="hover:bg-stone-50">
                      <TableCell className="!px-4 !py-3">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="!px-4 !py-3 !font-medium">
                        {formatName(creator.fullName)}
                      </TableCell>
                      <TableCell className="!whitespace-nowrap !px-4 !py-3">
                        {creator.mobile || "—"}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {creator.email || "—"}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {Array.isArray(creator.category)
                          ? creator.category.join(", ")
                          : creator.category || "—"}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {creator.city || "—"}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {platforms
                          .filter(([, link]) => creator[link]?.trim())
                          .map(([name]) => name)
                          .join(", ") || "—"}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {compact(followers(creator))}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {numeric(creator.engagement) === null
                          ? "—"
                          : `${numeric(creator.engagement).toFixed(1)}%`}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        {compact(numeric(creator.avgReel))}
                      </TableCell>
                      <TableCell className="!px-4 !py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/creators/${creator._id}`}
                            aria-label={`View ${creator.fullName}`}
                            title="View"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {permissions.includes("update_creator") && (
                            <Link
                              to={`/creators/${creator._id}/edit`}
                              aria-label={`Edit ${creator.fullName}`}
                              title="Edit"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {permissions.includes("delete_creator") && (
                            <button
                              type="button"
                              disabled={busyId === creator._id}
                              onClick={() => remove(creator)}
                              aria-label={`Delete ${creator.fullName}`}
                              title="Delete"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <label htmlFor="creator-page-size">Rows per page</label>
              <FormControl size="small">
                <Select
                  id="creator-page-size"
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setPage(1);
                  }}
                  aria-label="Rows per page"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <nav
              aria-label="Creator table pagination"
              className="flex items-center gap-2"
            >
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="min-w-20 text-center text-sm text-stone-600">
                Page <strong className="text-stone-900">{page}</strong> of{" "}
                {Math.max(1, Math.ceil(total / limit))}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / limit) || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatorsScreen;
