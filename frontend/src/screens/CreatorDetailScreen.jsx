import { useEffect, useState } from "react";
import axios from "../utils/api";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Download, MapPin, Phone, Pencil, Users, Heart, Play, Globe, Sparkles, Camera, Handshake, FileText, ShieldCheck, Check, CalendarDays, LoaderCircle } from "lucide-react";
import { formatIstDate } from "../utils/istDates";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";


const sections = [
  [
    "Basic Details",
    [
      ["Full name", "fullName"],
      ["Email", "email"],
      ["Mobile", "mobile"],
      ["City", "city"],
      ["State", "state"],
      ["Age group", "ageGroup"],
    ],
  ],
  [
    "Creator Profile",
    [
      ["Category", "category"],
      ["Introduction", "intro"],
      ["Unique content", "unique"],
    ],
  ],
  [
    "Platform Details",
    [
      ["Instagram", "igLink"],
      ["Instagram followers", "igFollowers"],
      ["Average reel views", "avgReel"],
      ["Average story views", "avgStory"],
      ["Highest reel views", "highestReel"],
      ["YouTube", "ytLink"],
      ["YouTube subscribers", "ytSubs"],
      ["YouTube average views", "ytAvgViews"],
      ["Facebook", "fbLink"],
      ["Facebook followers", "fbFollowers"],
      ["Facebook average views", "fbAvgViews"],
      ["LinkedIn", "liLink"],
      ["LinkedIn followers", "liFollowers"],
      ["LinkedIn average views", "liAvgViews"],
      ["Website or blog", "webLink"],
      ["Other profile", "otherLink"],
    ],
  ],
  [
    "Audience Details",
    [
      ["Primary location", "audLocation"],
      ["Gender split", "gender"],
      ["Age group", "audAge"],
      ["Engagement rate", "engagement"],
    ],
  ],
  [
    "Collaboration Preferences",
    [
      ["Collaboration types", "collabTypes"],
      ["Reel fee", "reelFee"],
      ["Story package fee", "storyFee"],
      ["YouTube video fee", "ytFee"],
      ["UGC content fee", "ugcFee"],
      ["Monthly retainer", "retainer"],
    ],
  ],
  [
    "Content Capabilities",
    [
      ["Formats", "capabilities"],
      ["Shoots and edits self", "selfEdit"],
      ["Professional equipment", "proGear"],
    ],
  ],
  [
    "Previous Collaborations",
    [
      ["Worked with brands", "workedBefore"],
      ["Notable brands", "brands"],
      ["Collaboration links", "collabLinks"],
    ],
  ],
  [
    "Hospitality & Fashion Fit",
    [
      ["Open to travel", "openTravel"],
      ["Open to hospitality", "openHospitality"],
      ["Open to fashion", "openFashion"],
      ["Apparel size", "apparelSize"],
      ["Accepts gifted products", "gifted"],
    ],
  ],
  [
    "Consent",
    [
      ["Creator database", "consent1"],
      ["Future campaigns", "consent2"],
      ["Details are accurate", "consent3"],
    ],
  ],
];
const uploads = [
  ["Instagram insights", "file_insights"],
  ["Audience demographics", "file_demo"],
  ["Last 30 days reach", "file_reach"],
];
const formatName = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase());

const formatValue = (value) => {
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value || "—";
};

const safeUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".") ? url.href : null;
  } catch { return null; }
};
const platforms = [
  { name: "Instagram", icon: Camera, link: "igLink", color: "#b64c76", stats: [["Followers", "igFollowers"], ["Avg. reel views", "avgReel"], ["Avg. story views", "avgStory"], ["Highest reel views", "highestReel"]] },
  { name: "YouTube", icon: Play, link: "ytLink", color: "#bc4e42", stats: [["Subscribers", "ytSubs"], ["Avg. video views", "ytAvgViews"]] },
  { name: "Facebook", icon: Users, link: "fbLink", color: "#4f74b5", stats: [["Followers", "fbFollowers"], ["Avg. views", "fbAvgViews"]] },
  { name: "LinkedIn", icon: Globe, link: "liLink", color: "#397d94", stats: [["Followers", "liFollowers"], ["Avg. views", "liAvgViews"]] },
];
const numeric = (value) => {
  const match = String(value ?? "").replace(/[,\s%]/g, "").match(/^(\d+(?:\.\d+)?)([KMLB])?$/i);
  return match ? Number(match[1]) * ({ K: 1e3, L: 1e5, M: 1e6, B: 1e9 }[match[2]?.toUpperCase()] || 1) : null;
};
const compact = (value) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const SectionHeading = ({ title, icon: Icon = FileText, aside }) => <div className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2.5 text-base font-semibold text-stone-900"><Icon className="h-4 w-4 text-[#aa8241]" />{title}</h2>{aside}</div>;
const DetailSection = ({ title, fields, creator, icon, compact: narrow = false }) => (
  <section className="portal-card p-5 md:p-6">
    <SectionHeading title={title} icon={icon} />
    <dl className={`grid gap-x-6 gap-y-5 ${narrow ? "" : "sm:grid-cols-2"}`}>
      {fields.map(([label, key]) => <div key={key} className={`min-w-0 ${!narrow && ["intro", "unique", "brands", "collabLinks"].includes(key) ? "sm:col-span-2" : ""}`}>
        <dt className="text-xs font-medium text-stone-500">{label}</dt>
        <dd className="mt-1.5 break-words text-sm leading-relaxed text-stone-800">
          {Array.isArray(creator[key]) && creator[key].length ? <div className="flex flex-wrap gap-1.5">{creator[key].map((value, i) => <span key={`${value}-${i}`} className="rounded-lg bg-[#f6f2e9] px-2.5 py-1 text-xs font-medium text-[#806337]">{value}</span>)}</div>
            : key === "email" && creator.email ? <a className="hover:text-[#9a7134] hover:underline" href={`mailto:${creator.email}`}>{creator.email}</a>
            : key === "mobile" && creator.mobile ? <a className="hover:text-[#9a7134] hover:underline" href={`tel:${creator.mobile}`}>{creator.mobile}</a>
            : typeof creator[key] === "boolean" ? <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${creator[key] ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{creator[key] && <Check className="h-3 w-3" />}{creator[key] ? "Yes" : "No"}</span>
            : key === "fullName" ? formatName(creator[key]) : <span className="whitespace-pre-wrap">{formatValue(creator[key])}</span>}
        </dd>
      </div>)}
    </dl>
  </section>
);

const CreatorDetailScreen = () => {
  const { id } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  const config = { withCredentials: true };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    axios
      .get(`/api/creators/${id}`, config)
      .then(({ data }) => {
        if (active) setCreator(data);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              "Could not load creator record",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, userInfo.user._id]);

  const downloadUpload = async (field, name) => {
    setError("");
    setDownloading(field);
    try {
      const response = await axios.get(
        `/api/creators/${id}/files/${field}`,
        { ...config, responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download creator upload");
    } finally { setDownloading(null); }
  };

  const linkedPlatforms = creator ? platforms.filter((platform) => creator[platform.link]) : [];
  const followerValues = linkedPlatforms.map((platform) => numeric(creator[platform.stats[0][1]])).filter((value) => value !== null);
  const followers = followerValues.length ? compact(followerValues.reduce((sum, value) => sum + value, 0)) : "—";
  const engagement = numeric(creator?.engagement);
  const initials = (creator?.fullName || "Creator").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="portal-shell flex">
      <Sidebar />
      <div className="portal-main ml-0 flex min-w-0 flex-1 flex-col md:ml-72">
        <Navbar title="Creator Profile" />
        <main className="portal-content flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1500px]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Link to="/creators" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900"><ArrowLeft className="h-4 w-4" />All creators</Link>
              <span className="text-xs text-stone-400">Creator network / Profile</span>
            </div>
            {error && <p role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {loading ? <div role="status" className="portal-card flex min-h-64 items-center justify-center gap-3 p-8 text-sm text-stone-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading creator profile…</div> : creator ? <>
              <section className="relative mb-5 overflow-hidden rounded-3xl bg-[#292721] text-white" style={{ backgroundImage: "radial-gradient(ellipse at 95% 0%, #756044 0%, transparent 65%)" }}>
                <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-28 h-80 w-80 rounded-full border border-white/10" />
                <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-16 h-56 w-56 rounded-full border border-white/10" />
                <div className="relative flex flex-wrap items-start justify-between gap-6 p-6 md:p-8">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#d4b67e]/40 bg-[#d4b67e]/15 font-serif text-3xl text-[#ead5ae]" aria-hidden="true">{initials}</div>
                    <div className="min-w-0">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#cfb684]">Creator profile</p>
                      <h1 className="break-words font-serif text-3xl leading-tight md:text-4xl">{formatName(creator.fullName)}</h1>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-300">
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{[creator.city, creator.state].filter(Boolean).join(", ") || "Location not provided"}</span>
                        {creator.createdAt && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Added {formatIstDate(new Date(creator.createdAt))} · IST</span>}
                      </div>
                      {Array.isArray(creator.category) && <div className="mt-4 flex flex-wrap gap-2">{creator.category.map((category, i) => <span key={`${category}-${i}`} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#e8d8bb]">{category}</span>)}</div>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {userInfo.user?.role?.permissions?.includes("update_creator") && <Link to={`/creators/${id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-medium text-white transition hover:bg-white/10"><Pencil className="h-3.5 w-3.5" />Edit profile</Link>}
                  </div>
                </div>
                <div className="relative grid grid-cols-2 border-t border-white/10 bg-black/10 lg:grid-cols-4">
                  {[["Combined audience", followers, "Reported followers across platforms", Users], ["Engagement rate", engagement !== null && engagement <= 100 ? `${engagement}%` : "—", "Creator-reported engagement", Heart], ["Average reel views", numeric(creator.avgReel) !== null ? compact(numeric(creator.avgReel)) : "—", "Instagram reel performance", Play], ["Social platforms", linkedPlatforms.length, "Profiles provided by creator", Globe]].map(([label, value, detail, Icon]) => <div key={label} className="min-w-0 border-r border-white/10 px-5 py-5 last:border-r-0 md:px-8"><div className="mb-2 flex items-center gap-2 text-xs text-stone-300"><Icon className="h-3.5 w-3.5 text-[#cfb684]" />{label}</div><p className="font-serif text-3xl text-[#f1e7d4]">{value}</p><p className="mt-1.5 text-[10px] leading-relaxed text-stone-400">{detail}</p></div>)}
                </div>
              </section>

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-5">
                  <DetailSection title="About the creator" fields={sections[1][1]} creator={creator} icon={Sparkles} />
                  <section className="portal-card p-5 md:p-6">
                    <SectionHeading title="Social presence" icon={Globe} aside={<span className="text-xs text-stone-400">Reported metrics</span>} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {platforms.map(({ name, icon: Icon, link, color, stats }) => <div key={name} className="min-w-0 rounded-2xl border border-stone-200/80 bg-[#fcfbf8] p-4">
                        <div className="mb-4 flex items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm" style={{ color }}><Icon className="h-4 w-4" /></span><h3 className="text-sm font-semibold text-stone-800">{name}</h3></div>{safeUrl(creator[link]) ? <a href={safeUrl(creator[link])} target="_blank" rel="noopener noreferrer" aria-label={`Open ${name} profile`} className="rounded-lg border border-stone-200 bg-white p-2 text-stone-500 transition hover:text-[#aa8241]"><ArrowUpRight className="h-4 w-4" /></a> : <span className="text-[10px] text-stone-400">No profile link</span>}</div>
                        {creator[link] && <p className="mb-4 break-all text-xs text-stone-500">{creator[link]}</p>}
                        <dl className="grid grid-cols-2 gap-4">{stats.map(([label, key]) => <div key={key} className="min-w-0"><dt className="text-[11px] text-stone-500">{label}</dt><dd className="mt-1 break-words text-lg font-semibold text-stone-800">{formatValue(creator[key])}</dd></div>)}</dl>
                      </div>)}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">{[["Website / blog", "webLink"], ["Other profile", "otherLink"]].map(([label, key]) => safeUrl(creator[key]) ? <a key={key} href={safeUrl(creator[key])} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"><Globe className="h-3.5 w-3.5" />{label}<ArrowUpRight className="h-3 w-3" /></a> : creator[key] ? <span key={key} className="break-all text-xs text-stone-500">{label}: {creator[key]}</span> : null)}</div>
                    <p className="mt-4 text-[11px] leading-relaxed text-stone-400">Audience totals may include the same people across multiple platforms.</p>
                  </section>
                  <DetailSection title="Collaboration & rates" fields={sections[4][1]} creator={creator} icon={Handshake} />
                  <div className="grid items-start gap-5 lg:grid-cols-2">
                    <DetailSection title="Content capabilities" fields={sections[5][1]} creator={creator} icon={Camera} compact />
                    <DetailSection title="Brand experience" fields={sections[6][1]} creator={creator} icon={Sparkles} compact />
                  </div>
                  <section className="portal-card p-5 md:p-6">
                    <SectionHeading title="Analytics & documents" icon={FileText} aside={<span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500">{uploads.filter(([, field]) => creator[field]?.name).length} / 3 uploaded</span>} />
                    <div className="space-y-3">{uploads.map(([label, field]) => <div key={field} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200/80 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f2e9] text-[#aa8241]"><FileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-stone-800">{label}</h3><p className="mt-1 break-all text-xs text-stone-400">{creator[field]?.name || "No file provided"}</p></div>{creator[field]?.name && <button type="button" disabled={downloading !== null} onClick={() => downloadUpload(field, creator[field].name)} aria-label={`Download ${label}`} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50">{downloading === field ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Download</button>}</div>)}</div>
                  </section>
                </div>
                <aside className="min-w-0 space-y-5">
                  <DetailSection title="Contact & details" fields={sections[0][1]} creator={creator} icon={Phone} compact />
                  <DetailSection title="Audience snapshot" fields={sections[3][1]} creator={creator} icon={Users} compact />
                  <DetailSection title="Campaign fit" fields={sections[7][1]} creator={creator} icon={Handshake} compact />
                  <DetailSection title="Consent" fields={sections[8][1]} creator={creator} icon={ShieldCheck} compact />
                </aside>
              </div>
            </> : !error && <div className="portal-card p-10 text-center text-sm text-stone-500">Creator not found.</div>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatorDetailScreen;
