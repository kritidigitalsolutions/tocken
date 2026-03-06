import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  CreditCard, TrendingUp, CheckCircle, Clock, XCircle,
  RefreshCw, Search, ChevronLeft, ChevronRight, IndianRupee
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

      {/* Monthly Revenue Chart (simple bars) */}
      {stats?.monthly?.length > 0 && (
        <div className={`rounded-xl p-6 border mb-8 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <TrendingUp size={18} className="text-indigo-500" /> Monthly Revenue
          </h2>
          <div className="flex items-end gap-3 h-32">
            {stats.monthly.map((m) => {
              const maxRev = Math.max(...stats.monthly.map(x => x.revenue), 1);
              const pct    = Math.round((m.revenue / maxRev) * 100);
              return (
                <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                  <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    {fmt(m.revenue)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-indigo-500 transition-all duration-500"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    {m.month.slice(5)} {/* MM */}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                      <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{p.user?.name || "—"}</p>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>{p.user?.phone}</p>
                      <p className={`text-xs capitalize ${isDark ? "text-slate-500" : "text-gray-400"}`}>{p.user?.userType?.toLowerCase()}</p>
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
