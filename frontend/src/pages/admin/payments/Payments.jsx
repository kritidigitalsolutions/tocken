import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import {
  CreditCard, CheckCircle, Clock, XCircle,
  RefreshCw, Search, ChevronLeft, ChevronRight, IndianRupee, ExternalLink
} from "lucide-react";
import { adminGetAllPayments, adminGetPaymentStats } from "../../../api/admin.payment.api";
import toast from "react-hot-toast";

// ─── Status badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    SUCCESS:  { color: "bg-green-100 text-green-700 dark-green",  icon: CheckCircle },
    PENDING:  { color: "bg-yellow-100 text-yellow-700",           icon: Clock },
    FAILED:   { color: "bg-red-100 text-red-700",                 icon: XCircle },
    REFUNDED: { color: "bg-blue-100 text-blue-700",               icon: RefreshCw }
  };
  const cfg = map[status] || map.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={11} /> {status}
    </span>
  );
};

// ─── Stat card ──────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, isDark }) => (
  <div className={`rounded-xl p-5 border flex items-center gap-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm"}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-slate-400" : "text-gray-500"}`}>{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
const Payments = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [stats,    setStats]    = useState(null);
  const [payments, setPayments] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search,   setSearch]   = useState("");
  const LIMIT = 15;

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const { data } = await adminGetPaymentStats();
      if (data.success) setStats(data.data);
    } catch { toast.error("Failed to load stats"); }
    finally { setStatsLoading(false); }
  }, []);

  // ── Fetch payments list ──
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminGetAllPayments(params);
      if (data.success) {
        setPayments(data.data.payments);
        setTotal(data.data.total);
      }
    } catch { toast.error("Failed to load payments"); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPages = Math.ceil(total / LIMIT);

  // ── Client-side search filter ──
  const filtered = search.trim()
    ? payments.filter(p =>
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.phone?.includes(search) ||
        p.merchantOrderId?.includes(search) ||
        p.phonepeOrderId?.includes(search) ||
        p.phonepeTransactionId?.includes(search)
      )
    : payments;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-gray-50"}`}>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Payments
          </h1>
          <p className={`mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Razorpay transactions — plan purchases by users
          </p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchPayments(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`rounded-xl p-5 border h-24 animate-pulse ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`} />
          ))
        ) : stats ? (
          <>
            <StatCard icon={IndianRupee} label="Total Revenue"    value={fmt(stats.totalRevenue)}  color="bg-indigo-600" isDark={isDark} />
            <StatCard icon={CheckCircle} label="Successful"       value={stats.totalSuccess}        color="bg-green-600"  isDark={isDark} />
            <StatCard icon={Clock}       label="Pending"          value={stats.totalPending}        color="bg-yellow-500" isDark={isDark} />
            <StatCard icon={XCircle}     label="Failed"           value={stats.totalFailed}         color="bg-red-500"    isDark={isDark} />
          </>
        ) : null}
      </div>

      {/* Monthly Revenue Chart */}
      {stats?.monthly?.length > 0 && (() => {
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const getMonthLabel = (m) => {
          const parts = m.month.split('-');
          const idx = parseInt(parts[1], 10) - 1;
          return monthNames[idx] || m.month.slice(5);
        };

        const data = stats.monthly;
        const revenues = data.map(d => d.revenue);
        const totalMonthlyRev = revenues.reduce((s, v) => s + v, 0);
        const minRev = Math.min(...revenues);
        const maxRev = Math.max(...revenues);
        const range = maxRev - minRev || 1;
        const padded = { min: minRev - range * 0.15, max: maxRev + range * 0.15 };
        const valueRange = padded.max - padded.min || 1;

        // Chart dimensions
        const W = 900, H = 280;
        const padL = 60, padR = 30, padT = 20, padB = 40;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        // Points
        const points = data.map((d, i) => ({
          x: padL + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
          y: padT + chartH - ((d.revenue - padded.min) / valueRange) * chartH,
          revenue: d.revenue,
          label: getMonthLabel(d),
        }));

        // Smooth cubic bezier path
        const smoothLine = (pts) => {
          if (pts.length < 2) return `M${pts[0].x},${pts[0].y}`;
          let d = `M${pts[0].x},${pts[0].y}`;
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(i - 1, 0)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(i + 2, pts.length - 1)];
            const tension = 0.3;
            const cp1x = p1.x + (p2.x - p0.x) * tension;
            const cp1y = p1.y + (p2.y - p0.y) * tension;
            const cp2x = p2.x - (p3.x - p1.x) * tension;
            const cp2y = p2.y - (p3.y - p1.y) * tension;
            d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
          }
          return d;
        };

        const linePath = smoothLine(points);
        const areaPath = `${linePath} L${points[points.length-1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`;

        // Y-axis ticks
        const tickCount = 5;
        const yTicks = Array.from({ length: tickCount }, (_, i) => {
          const val = padded.min + (i / (tickCount - 1)) * valueRange;
          const y = padT + chartH - (i / (tickCount - 1)) * chartH;
          return { val, y };
        });

        const fmtShort = (n) => {
          if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
          if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
          return `₹${Math.round(n)}`;
        };

        return (
          <div className={`rounded-2xl border mb-8 overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm"}`}>
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-start justify-between">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Revenue</h2>
                <p className={`mt-1 flex items-center gap-2`}>
                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>Total Revenue</span>
                  <span className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{fmt(totalMonthlyRev)}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>Revenue</span>
                </div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="px-4 pb-4">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ maxHeight: '300px' }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? "#818cf8" : "#6366f1"} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={isDark ? "#818cf8" : "#6366f1"} stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Horizontal grid lines */}
                {yTicks.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={padL} y1={t.y} x2={W - padR} y2={t.y}
                      stroke={isDark ? "#334155" : "#f1f5f9"}
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? "0" : "4,4"}
                    />
                    <text
                      x={padL - 8} y={t.y + 4}
                      textAnchor="end"
                      fill={isDark ? "#94a3b8" : "#94a3b8"}
                      fontSize="11"
                      fontFamily="inherit"
                    >
                      {fmtShort(t.val)}
                    </text>
                  </g>
                ))}

                {/* Gradient area fill */}
                <path d={areaPath} fill="url(#revenueGradient)" />

                {/* Smooth line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={isDark ? "#818cf8" : "#6366f1"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />

                {/* Data points + month labels */}
                {points.map((p, i) => (
                  <g key={i} className="group">
                    {/* Vertical dashed hover line */}
                    <line
                      x1={p.x} y1={padT} x2={p.x} y2={padT + chartH}
                      stroke={isDark ? "#475569" : "#cbd5e1"}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Visible dot */}
                    <circle
                      cx={p.x} cy={p.y} r="4"
                      fill={isDark ? "#818cf8" : "#6366f1"}
                      stroke={isDark ? "#1e293b" : "#ffffff"}
                      strokeWidth="2"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Hover target (invisible larger area) */}
                    <rect
                      x={p.x - (chartW / data.length) / 2}
                      y={padT}
                      width={chartW / data.length}
                      height={chartH}
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Tooltip */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <rect
                        x={p.x - 45} y={p.y - 40}
                        width="90" height="28"
                        rx="6"
                        fill={isDark ? "#1e293b" : "#1f2937"}
                        opacity="0.95"
                      />
                      <text
                        x={p.x} y={p.y - 22}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="inherit"
                      >
                        {`Revenue: ${fmt(p.revenue)}`}
                      </text>
                      {/* Arrow */}
                      <polygon
                        points={`${p.x - 4},${p.y - 12} ${p.x + 4},${p.y - 12} ${p.x},${p.y - 7}`}
                        fill={isDark ? "#1e293b" : "#1f2937"}
                      />
                    </g>

                    {/* Month label */}
                    <text
                      x={p.x} y={H - 10}
                      textAnchor="middle"
                      fill={isDark ? "#94a3b8" : "#94a3b8"}
                      fontSize="12"
                      fontWeight="500"
                      fontFamily="inherit"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className={`rounded-xl p-4 border mb-4 flex flex-wrap gap-3 items-center ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm"}`}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
          <input
            type="text"
            placeholder="Search by name, phone or order ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
          />
        </div>

        {/* Status filter */}
        {["", "SUCCESS", "PENDING", "FAILED", "REFUNDED"].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
              statusFilter === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : isDark
                  ? "border-slate-600 text-slate-300 hover:border-indigo-500"
                  : "border-gray-200 text-gray-600 hover:border-indigo-500"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase tracking-wide font-semibold border-b ${isDark ? "bg-slate-700/60 text-slate-400 border-slate-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Merchant Order ID</th>
                <th className="px-4 py-3 text-left">PhonePe Order ID</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-100"}`}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-100"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`px-4 py-16 text-center ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                    No payments found
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p._id} className={`transition ${isDark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"}`}>
                    <td className={`px-4 py-3 font-mono text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                      {(page - 1) * LIMIT + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      {p.user?._id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/users?userId=${p.user._id}`); }}
                          className={`text-left group`}
                        >
                          <p className={`font-medium flex items-center gap-1 group-hover:text-indigo-500 transition ${isDark ? "text-white" : "text-gray-900"}`}>
                            {p.user?.name || "—"}
                            <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition" />
                          </p>
                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>{p.user?.phone}</p>
                          <p className={`text-xs capitalize ${isDark ? "text-slate-500" : "text-gray-400"}`}>{p.user?.userType?.toLowerCase()}</p>
                        </button>
                      ) : (
                        <>
                          <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{p.user?.name || "—"}</p>
                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>{p.user?.phone}</p>
                          <p className={`text-xs capitalize ${isDark ? "text-slate-500" : "text-gray-400"}`}>{p.user?.userType?.toLowerCase()}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{p.planSnapshot?.planName || p.plan?.planName || "—"}</p>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>{p.planSnapshot?.validityDays} days · {p.planSnapshot?.leadsPerMonth === 0 ? "Unlimited" : p.planSnapshot?.leadsPerMonth} leads/mo</p>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                      {fmt((p.amount || 0) / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                      {p.failureReason && (
                        <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate">{p.failureReason}</p>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      <span className="truncate block max-w-[130px]" title={p.merchantOrderId}>{p.merchantOrderId}</span>
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      {p.phonepeOrderId
                        ? <span className="truncate block max-w-[130px]" title={p.phonepeOrderId}>{p.phonepeOrderId}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className={`px-4 py-3 text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      {fmtDate(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t text-sm ${isDark ? "border-slate-700 text-slate-400" : "border-gray-200 text-gray-500"}`}>
            <span>{total} total · page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border disabled:opacity-40 hover:border-indigo-500 transition border-current"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border disabled:opacity-40 hover:border-indigo-500 transition border-current"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
