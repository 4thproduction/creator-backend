import { useEffect, useMemo, useState } from "react";
import axios from "../utils/api";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  Filter,
  Heart,
  MapPin,
  Users,
  UserRoundPlus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { istToday, daysBefore, formatIstDate, parseIstDate } from "../utils/istDates";
import IstDatePicker from "../components/IstDatePicker";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const GOLD = "#aa8241";
const INK = "#292521";
const PALETTE = [GOLD, "#333331", "#788390", "#b9b9b5"];
const PLATFORMS = [
  ["Instagram", "igLink", "igFollowers"],
  ["YouTube", "ytLink", "ytSubs"],
  ["Facebook", "fbLink", "fbFollowers"],
  ["LinkedIn", "liLink", "liFollowers"],
];
const number = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const clean = value.replace(/[,\s₹%]/g, "").toUpperCase();
  const match = clean.match(/^(\d+(?:\.\d+)?)([KMB])?$/);
  if (!match) return null;
  return Number(match[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[match[2]] || 1);
};
const compact = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const percent = (value) => `${value.toFixed(1)}%`;
const countBy = (items, key) =>
  items.reduce((acc, item) => {
    if (key(item)) acc[key(item)] = (acc[key(item)] || 0) + 1;
    return acc;
  }, {});
const topEntries = (counts, limit = 5) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
const hasUpload = (creator) =>
  Boolean(
    creator.file_insights?.name ||
    creator.file_demo?.name ||
    creator.file_reach?.name,
  );
const followerTotal = (creator) =>
  PLATFORMS.reduce(
    (sum, [, link, followers]) =>
      sum + (creator[link] ? number(creator[followers]) || 0 : 0),
    0,
  );

const Card = ({ title, children, className = "", aside }) => (
  <section className={`portal-card min-w-0 p-4 md:p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);
const Empty = ({ children = "No data for these filters yet." }) => (
  <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-stone-200 p-4 text-center text-sm text-stone-500">
    {children}
  </div>
);
const StatCard = ({ label, value, detail, icon: Icon }) => (
  <div className="portal-card flex min-h-28 items-start gap-3 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8f2e8] text-[#a57d3c]">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold leading-none text-stone-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-stone-500">{detail}</p>
    </div>
  </div>
);
const CreatorTooltip = ({ active, payload }) => {
  const creator = payload?.[0]?.payload;
  if (!active || !creator) return null;
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 font-semibold text-stone-900">{creator.name}</p>
      <p className="text-sm text-[#9a7134]">Engagement: {creator.engagement}%</p>
      <p className="text-sm text-[#9a7134]">Followers: {compact(creator.followers)}</p>
    </div>
  );
};
const selectClass = "portal-outline-button h-10 min-w-36 max-w-full text-sm";

const DashboardScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const permissions = userInfo?.user?.role?.permissions || [];
  const canReadCreators = permissions.includes("read_creator");
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(canReadCreators);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [period, setPeriod] = useState("30");
  const [customFrom, setCustomFrom] = useState(() =>
    formatIstDate(daysBefore(30)),
  );
  const [customTo, setCustomTo] = useState(() => formatIstDate(istToday()));
  const [platform, setPlatform] = useState("All platforms");
  const [category, setCategory] = useState("All categories");
  const [city, setCity] = useState("All cities");
  const [creatorId, setCreatorId] = useState("");
  const [uploadsOnly, setUploadsOnly] = useState(false);

  useEffect(() => {
    if (!canReadCreators) return;
    let active = true;
    axios
      .get(`/api/creators/analytics`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (active) setCreators(data.creators || []);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              "Could not load creator analytics",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canReadCreators, userInfo?.user?._id]);

  const creatorOptions = useMemo(
    () =>
      [...creators].sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || ""),
      ),
    [creators],
  );
  const categories = useMemo(
    () =>
      [
        ...new Set(creators.flatMap((creator) => creator.category || [])),
      ].sort(),
    [creators],
  );
  const cities = useMemo(
    () =>
      [
        ...new Set(creators.map((creator) => creator.city).filter(Boolean)),
      ].sort(),
    [creators],
  );
  const filtered = useMemo(
    () =>
      creators.filter(
        (creator) =>
          (!creatorId || creator._id === creatorId) &&
          (platform === "All platforms" ||
            Boolean(
              creator[PLATFORMS.find(([name]) => name === platform)?.[1]],
            )) &&
          (category === "All categories" ||
            creator.category?.includes(category)) &&
          (city === "All cities" || creator.city === city) &&
          (!uploadsOnly || hasUpload(creator)),
      ),
    [creators, creatorId, platform, category, city, uploadsOnly],
  );
  const analytics = useMemo(() => {
    const parsedFrom =
      period === "custom" ? parseIstDate(customFrom) : daysBefore(days);
    const parsedTo = period === "custom" ? parseIstDate(customTo) : istToday();
    const validRange = Boolean(
      parsedFrom &&
      parsedTo &&
      parsedFrom <= parsedTo &&
      (parsedTo - parsedFrom) / 86400000 <= 3660,
    );
    const start = validRange ? parsedFrom : daysBefore(days);
    const rangeEnd = validRange ? parsedTo : istToday();
    const rangeDays = Math.round((rangeEnd - start) / 86400000) + 1;
    const endExclusive = new Date(rangeEnd);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    const recent = validRange
      ? filtered.filter(
          (creator) =>
            new Date(creator.createdAt) >= start &&
            new Date(creator.createdAt) < endExclusive,
        )
      : [];
    const growth = Array.from(
      { length: validRange ? rangeDays : 0 },
      (_, i) => {
        const day = new Date(start);
        day.setUTCDate(start.getUTCDate() + i);
        const end = new Date(day);
        end.setUTCDate(day.getUTCDate() + 1);
        return {
          date: day.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            timeZone: "Asia/Kolkata",
          }),
          total: filtered.filter((creator) => new Date(creator.createdAt) < end)
            .length,
          applications: filtered.filter(
            (creator) =>
              new Date(creator.createdAt) >= day &&
              new Date(creator.createdAt) < end,
          ).length,
        };
      },
    );
    const platformMix = PLATFORMS.map(([name, link]) => ({
      name,
      value: filtered.filter((creator) => creator[link]).length,
    })).filter((entry) => entry.value);
    const categoryCounts = {};
    filtered.forEach((creator) =>
      (creator.category || []).forEach((item) => {
        categoryCounts[item] = (categoryCounts[item] || 0) + 1;
      }),
    );
    const engagementValues = filtered
      .map((creator) => number(creator.engagement))
      .filter((value) => value !== null && value <= 100);
    const reelViews = filtered
      .map((creator) => number(creator.avgReel))
      .filter((value) => value !== null)
      .sort((a, b) => a - b);
    const scatter = filtered
      .map((creator) => ({
        name: creator.fullName,
        followers: followerTotal(creator),
        engagement: number(creator.engagement),
      }))
      .filter(
        (item) =>
          item.followers > 0 &&
          item.engagement !== null &&
          item.engagement <= 100,
      );
    const watch = filtered
      .map((creator) => ({
        ...creator,
        followers: followerTotal(creator),
        engagementValue: number(creator.engagement),
      }))
      .filter(
        (creator) => creator.followers || creator.engagementValue !== null,
      )
      .sort(
        (a, b) =>
          (b.engagementValue || 0) - (a.engagementValue || 0) ||
          b.followers - a.followers,
      )
      .slice(0, 4);
    return {
      recent: recent.length,
      growth,
      rangeDays,
      validRange,
      rangeLabel: validRange
        ? `${formatIstDate(start)} – ${formatIstDate(rangeEnd)}`
        : "Invalid date range",
      platformMix,
      categoryCounts,
      cityCounts: countBy(filtered, (creator) => creator.city),
      ageCounts: countBy(filtered, (creator) => creator.audAge),
      genderCounts: countBy(filtered, (creator) => creator.gender),
      followers: filtered.reduce(
        (sum, creator) => sum + followerTotal(creator),
        0,
      ),
      averageEngagement: engagementValues.length
        ? engagementValues.reduce((sum, value) => sum + value, 0) /
          engagementValues.length
        : null,
      engagementSample: engagementValues.length,
      uploaded: filtered.filter(hasUpload).length,
      reachUploaded: filtered.filter((creator) => creator.file_reach?.name)
        .length,
      medianReel: reelViews.length
        ? (reelViews[Math.floor((reelViews.length - 1) / 2)] +
            reelViews[Math.floor(reelViews.length / 2)]) /
          2
        : null,
      travel: filtered.filter((creator) => creator.openTravel === "Yes").length,
      scatter,
      watch,
    };
  }, [filtered, days, period, customFrom, customTo]);

  const exportReport = () => {
    const rows = [
      [
        "Creator",
        "City",
        "Categories",
        "Platforms",
        "Combined followers",
        "Engagement rate",
        "Average reel views",
        "Analytics uploaded",
        "Applied (IST)",
      ],
    ];
    filtered.forEach((creator) =>
      rows.push([
        creator.fullName,
        creator.city,
        (creator.category || []).join("; "),
        PLATFORMS.filter(([, link]) => creator[link])
          .map(([name]) => name)
          .join("; "),
        followerTotal(creator),
        creator.engagement || "",
        creator.avgReel || "",
        hasUpload(creator) ? "Yes" : "No",
        creator.createdAt ? formatIstDate(new Date(creator.createdAt)) : "",
      ]),
    );
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "creator-dashboard.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="portal-shell flex">
      <Sidebar />
      <div className="portal-main ml-0 flex min-w-0 flex-1 flex-col md:ml-72">
        <Navbar title="Dashboard" />
        <main className="portal-content flex-1 p-4 md:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">
                Creator Network
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                Performance, audience & growth overview
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex h-10 items-center gap-2 rounded-[.85rem] border border-[#ded7c9] bg-white px-3 text-sm text-stone-700">
                <CalendarDays className="h-4 w-4 shrink-0 text-stone-500" />
                <select
                  aria-label="Creator record period"
                  className="min-w-28 bg-transparent outline-none"
                  value={period}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPeriod(value);
                    if (value !== "custom") setDays(Number(value));
                  }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="custom">Custom date</option>
                </select>
              </label>
              {period === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-stone-500">
                    <span>From</span>
                    <IstDatePicker
                      label="Custom start date in IST"
                      value={customFrom}
                      onChange={setCustomFrom}
                      max={customTo}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-stone-500">
                    <span>To</span>
                    <IstDatePicker
                      label="Custom end date in IST"
                      value={customTo}
                      onChange={setCustomTo}
                      min={customFrom}
                    />
                  </label>
                </div>
              )}
              <button
                type="button"
                onClick={exportReport}
                disabled={!canReadCreators || loading}
                className="portal-button h-10 text-sm disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export report
              </button>
            </div>
          </div>
          {!canReadCreators ? (
            <Empty>You need creator access to view network analytics.</Empty>
          ) : loading ? (
            <div className="portal-card p-10 text-center text-stone-500">
              Loading creator analytics…
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              {error}
            </div>
          ) : (
            <>
              {period === "custom" && !analytics.validRange && (
                <p role="alert" className="mb-3 text-sm text-red-700">
                  Enter a valid IST date range in dd/mm/yy format. The From date
                  must be before or equal to the To date.
                </p>
              )}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Filter className="mr-1 h-4 w-4 text-stone-500" />
                <select
                  aria-label="Filter by creator"
                  value={creatorId}
                  onChange={(event) => setCreatorId(event.target.value)}
                  className={selectClass}
                >
                  <option value="">All creators</option>
                  {creatorOptions.map((creator) => (
                    <option key={creator._id} value={creator._id}>
                      {creator.fullName || "Unnamed creator"}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by platform"
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  className={selectClass}
                >
                  <option>All platforms</option>
                  {PLATFORMS.map(([name]) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter by category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={selectClass}
                >
                  <option>All categories</option>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter by city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className={selectClass}
                >
                  <option>All cities</option>
                  {cities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <label className="ml-1 inline-flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={uploadsOnly}
                    onChange={(event) => setUploadsOnly(event.target.checked)}
                    className="accent-[#a57d3c]"
                  />{" "}
                  Analytics uploaded only
                </label>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  label="Total creators"
                  value={compact(filtered.length)}
                  detail="In selected network"
                  icon={Users}
                />
                <StatCard
                  label="New creator records"
                  value={compact(analytics.recent)}
                  detail={analytics.rangeLabel}
                  icon={UserRoundPlus}
                />
                <StatCard
                  label="Combined followers"
                  value={compact(analytics.followers)}
                  detail="Across linked platforms; overlap possible"
                  icon={BarChart3}
                />
                <StatCard
                  label="Avg. engagement"
                  value={
                    analytics.averageEngagement === null
                      ? "—"
                      : percent(analytics.averageEngagement)
                  }
                  detail={`${analytics.engagementSample} profiles reporting`}
                  icon={Heart}
                />
                <StatCard
                  label="Analytics uploaded"
                  value={
                    filtered.length
                      ? `${Math.round((analytics.uploaded / filtered.length) * 100)}%`
                      : "—"
                  }
                  detail={`${analytics.uploaded} of ${filtered.length} profiles`}
                  icon={Activity}
                />
              </div>
              <div className="mb-4 grid gap-4 xl:grid-cols-12">
                <Card
                  title="Creator growth"
                  className="xl:col-span-6"
                  aside={
                    <span className="text-xs text-stone-500">
                      {analytics.rangeLabel} 
                    </span>
                  }
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics.growth}
                        margin={{ top: 8, right: 10, left: -22, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="growthFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={GOLD}
                              stopOpacity={0.22}
                            />
                            <stop
                              offset="100%"
                              stopColor={GOLD}
                              stopOpacity={0.01}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#eeeae4" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          interval={Math.max(
                            0,
                            Math.ceil(analytics.rangeDays / 6) - 1,
                          )}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="total"
                          name="Total creators"
                          stroke={GOLD}
                          fill="url(#growthFill)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="applications"
                          name="New creator records"
                          stroke={INK}
                          fill="transparent"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    New creator records are counted by IST submission date.
                  </p>
                </Card>
                <Card title="Platform mix" className="xl:col-span-3">
                  {analytics.platformMix.length ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.platformMix}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={54}
                              outerRadius={78}
                              paddingAngle={2}
                            >
                              {analytics.platformMix.map((item, index) => (
                                <Cell key={item.name} fill={PALETTE[index]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => `${value} creators`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {analytics.platformMix.map((item, index) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: PALETTE[index] }}
                              />
                              {item.name}
                            </span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-stone-500">
                        Creators may appear on multiple platforms.
                      </p>
                    </>
                  ) : (
                    <Empty />
                  )}
                </Card>
                <div className="grid gap-3 xl:col-span-3">
                  <div className="portal-card flex items-center gap-3 p-4">
                    <Activity className="h-6 w-6 text-[#a57d3c]" />
                    <div>
                      <p className="text-sm text-stone-500">
                        30-day reach upload
                      </p>
                      <p className="font-serif text-2xl font-semibold">
                        {analytics.reachUploaded}
                      </p>
                    </div>
                  </div>
                  <div className="portal-card flex items-center gap-3 p-4">
                    <BarChart3 className="h-6 w-6 text-[#a57d3c]" />
                    <div>
                      <p className="text-sm text-stone-500">
                        Median reel views
                      </p>
                      <p className="font-serif text-2xl font-semibold">
                        {analytics.medianReel === null
                          ? "—"
                          : compact(analytics.medianReel)}
                      </p>
                    </div>
                  </div>
                  <div className="portal-card flex items-center gap-3 p-4">
                    <MapPin className="h-6 w-6 text-[#a57d3c]" />
                    <div>
                      <p className="text-sm text-stone-500">Open to travel</p>
                      <p className="font-serif text-2xl font-semibold">
                        {analytics.travel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <Card title="Top categories">
                  {topEntries(analytics.categoryCounts).length ? (
                    <div className="space-y-3">
                      {topEntries(analytics.categoryCounts).map(
                        ([name, count]) => (
                          <div key={name}>
                            <div className="mb-1 flex justify-between gap-2 text-sm">
                              <span className="truncate">{name}</span>
                              <strong>{count}</strong>
                            </div>
                            <div className="h-2 rounded-full bg-stone-100">
                              <div
                                className="h-2 rounded-full bg-[#b18a4d]"
                                style={{
                                  width: `${(count / Math.max(1, filtered.length)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <Empty />
                  )}
                  <p className="mt-3 text-xs text-stone-500">
                    Multi-category creators count in each category.
                  </p>
                </Card>
                <Card title="Top cities">
                  {topEntries(analytics.cityCounts).length ? (
                    <div className="space-y-3">
                      {topEntries(analytics.cityCounts).map(
                        ([name, count], index) => (
                          <div
                            key={name}
                            className="flex items-center gap-3 border-b border-stone-100 pb-2 text-sm last:border-0"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-xs">
                              {index + 1}
                            </span>
                            <span className="flex-1 truncate">{name}</span>
                            <strong>{count}</strong>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <Empty />
                  )}
                </Card>
                <Card title="Audience breakdown">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Reported audience skew
                  </p>
                  {Object.keys(analytics.genderCounts).length ? (
                    <div className="mb-5 space-y-2">
                      {Object.entries(analytics.genderCounts).map(
                        ([name, count]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm"
                          >
                            <span>{name}</span>
                            <strong>{count}</strong>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="mb-5 text-sm text-stone-400">
                      No audience gender data
                    </p>
                  )}
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Primary audience age
                  </p>
                  {topEntries(analytics.ageCounts, 5).length ? (
                    topEntries(analytics.ageCounts, 5).map(([name, count]) => (
                      <div
                        key={name}
                        className="mb-2 flex items-center gap-2 text-sm"
                      >
                        <span className="w-12">{name}</span>
                        <div className="h-2 flex-1 rounded-full bg-stone-100">
                          <div
                            className="h-2 rounded-full bg-[#b18a4d]"
                            style={{
                              width: `${(count / Math.max(1, filtered.length)) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-400">
                      No audience age data
                    </p>
                  )}
                </Card>
                <Card title="Engagement quality">
                  {analytics.scatter.length ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          margin={{ top: 8, right: 14, bottom: 8, left: -12 }}
                        >
                          <CartesianGrid stroke="#eeeae4" />
                          <XAxis
                            type="number"
                            dataKey="followers"
                            name="Followers"
                            tickFormatter={compact}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="engagement"
                            name="Engagement"
                            unit="%"
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={<CreatorTooltip />}
                          />
                          <Scatter data={analytics.scatter} fill={GOLD} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <Empty />
                  )}
                  <p className="mt-2 text-xs text-stone-500">
                    Each dot is one creator with reported followers and
                    engagement.
                  </p>
                </Card>
              </div>
              <Card
                title="Creators to watch"
                aside={
                  <span className="text-xs text-stone-500">
                    Highest reported engagement
                  </span>
                }
              >
                {analytics.watch.length ? (
                  <div className="portal-table-wrap">
                    <table className="portal-table text-left text-sm">
                      <thead>
                        <tr>
                          {[
                            "Creator",
                            "Category",
                            "City",
                            "Platforms",
                            "Followers",
                            "Engagement",
                            "Avg. reel views",
                            "",
                          ].map((label) => (
                            <th
                              key={label}
                              className="border-b px-3 py-2 text-xs font-semibold"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.watch.map((creator) => (
                          <tr
                            key={creator._id}
                            className="border-b last:border-0"
                          >
                            <td className="whitespace-nowrap px-3 py-3 font-medium">
                              {creator.fullName}
                            </td>
                            <td className="px-3 py-3">
                              {creator.category?.join(", ") || "—"}
                            </td>
                            <td className="px-3 py-3">{creator.city || "—"}</td>
                            <td className="px-3 py-3">
                              {PLATFORMS.filter(([, link]) => creator[link])
                                .map(([name]) => name)
                                .join(", ") || "—"}
                            </td>
                            <td className="px-3 py-3">
                              {compact(creator.followers)}
                            </td>
                            <td className="px-3 py-3">
                              {creator.engagementValue === null
                                ? "—"
                                : percent(creator.engagementValue)}
                            </td>
                            <td className="px-3 py-3">
                              {number(creator.avgReel) === null
                                ? "—"
                                : compact(number(creator.avgReel))}
                            </td>
                            <td className="px-3 py-3">
                              <Link
                                to={`/creators/${creator._id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#d6bd90] px-2 py-1 text-xs font-semibold text-[#80602c] hover:bg-[#faf5eb]"
                              >
                                View <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty />
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardScreen;
