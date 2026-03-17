"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════
const STATUSES = ["Pending", "Contacted", "Fulfilled", "Cancelled"];
const REQUEST_TYPES = ["Out of Stock", "Not Carried", "Specific Variant"];
const URGENCY_OPTIONS = ["Normal", "Urgent (3 days)", "Very Urgent (today)"];

const STATUS_STYLE = {
  Pending: "bg-amber-100 text-amber-800",
  Contacted: "bg-blue-100 text-blue-800",
  Fulfilled: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
};
const URGENCY_DOT = {
  Normal: "bg-slate-400",
  "Urgent (3 days)": "bg-amber-500",
  "Very Urgent (today)": "bg-red-500",
};

// ══════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, branches(name)")
      .eq("id", data.user.id)
      .single();
    if (!profile) {
      setError("Profile not found. Contact admin.");
      setLoading(false);
      return;
    }
    onLogin({ ...profile, email: data.user.email });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "linear-gradient(145deg, #0c1929, #1a365d, #0c1929)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">TRIKART</h1>
          <p className="text-sm text-slate-400 font-mono tracking-widest mt-1">DEMAND CAPTURE</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl rounded-2xl p-7 border border-white/10">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition" />
          </div>
          {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// NEW REQUEST FORM
// ══════════════════════════════════════
function NewRequestForm({ user, branches, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "+965 ",
    product_description: "", category_id: categories[0]?.id || "",
    request_type: REQUEST_TYPES[0], urgency: URGENCY_OPTIONS[0],
    notes: "", branch_id: user.branch_id || branches[0]?.id || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = "Required";
    if (form.customer_phone.replace(/\D/g, "").length < 8) e.customer_phone = "Valid phone required";
    if (!form.product_description.trim()) e.product_description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await supabase.from("product_requests").insert({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      product_description: form.product_description.trim(),
      category_id: form.category_id,
      request_type: form.request_type,
      urgency: form.urgency,
      notes: form.notes.trim(),
      branch_id: form.branch_id,
      created_by: user.id,
      status: "Pending",
    });
    setSubmitting(false);
    if (error) { setErrors({ submit: error.message }); return; }
    onSubmit();
  };

  const inp = (err) => `w-full px-3.5 py-3 text-sm rounded-xl border ${err ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"} outline-none focus:border-blue-400 transition`;
  const lbl = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
        <button onClick={onCancel} className="text-blue-500 text-xl font-bold">←</button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">New Request</h2>
          <p className="text-xs text-slate-400 font-mono">{user.branches?.name || "All Branches"}</p>
        </div>
      </div>

      <div className="px-5 mt-5 flex flex-col gap-4">
        <div>
          <label className={lbl}>Customer Name *</label>
          <input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="e.g. Ahmed Al-Sabah" className={inp(errors.customer_name)} />
          {errors.customer_name && <span className="text-xs text-red-500 mt-1">{errors.customer_name}</span>}
        </div>
        <div>
          <label className={lbl}>Phone Number *</label>
          <input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} type="tel" placeholder="+965 XXXX XXXX" className={inp(errors.customer_phone)} />
          {errors.customer_phone && <span className="text-xs text-red-500 mt-1">{errors.customer_phone}</span>}
        </div>
        <div>
          <label className={lbl}>Product Requested *</label>
          <textarea value={form.product_description} onChange={(e) => set("product_description", e.target.value)} rows={2} placeholder="e.g. iPhone 17 Pro Max 256GB" className={inp(errors.product_description)} />
          {errors.product_description && <span className="text-xs text-red-500 mt-1">{errors.product_description}</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Category</label>
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inp(false)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Request Type</label>
            <select value={form.request_type} onChange={(e) => set("request_type", e.target.value)} className={inp(false)}>
              {REQUEST_TYPES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        {user.role === "admin" && (
          <div>
            <label className={lbl}>Branch</label>
            <select value={form.branch_id} onChange={(e) => set("branch_id", e.target.value)} className={inp(false)}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={lbl}>Urgency</label>
          <div className="flex gap-2">
            {URGENCY_OPTIONS.map((u) => (
              <button key={u} type="button" onClick={() => set("urgency", u)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg border-2 transition ${form.urgency === u
                  ? u.includes("Very") ? "border-red-400 bg-red-50 text-red-600"
                    : u.includes("Urgent") ? "border-amber-400 bg-amber-50 text-amber-600"
                    : "border-green-400 bg-green-50 text-green-600"
                  : "border-slate-200 text-slate-400"}`}>
                {u.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Color, budget, etc." className={inp(false)} />
        </div>
        {errors.submit && <p className="text-xs text-red-500 text-center">{errors.submit}</p>}
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-1">
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// REQUEST CARD
// ══════════════════════════════════════
const STATUS_BTN = {
  Pending:   "border-amber-300 bg-amber-50 text-amber-700",
  Contacted: "border-blue-300 bg-blue-50 text-blue-700",
  Fulfilled: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-300 bg-red-50 text-red-700",
};
const STATUS_ACTIVE = {
  Pending:   "bg-amber-500 text-white border-amber-500",
  Contacted: "bg-blue-600 text-white border-blue-600",
  Fulfilled: "bg-emerald-600 text-white border-emerald-600",
  Cancelled: "bg-red-500 text-white border-red-500",
};

function RequestCard({ req, onStatusChange, onBranchChange, canEdit, isVendor, branches, userRole }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const timeAgo = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  };

  const handleStatus = async (newStatus) => {
    if (newStatus === req.status || !canEdit) return;
    setUpdating(true);
    await onStatusChange(req.id, newStatus);
    setUpdating(false);
  };

  const handleBranch = async (e) => {
    if (e.target.value === req.branch_id) return;
    setUpdating(true);
    await onBranchChange(req.id, e.target.value);
    setUpdating(false);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition ${updating ? "opacity-60" : req.vendor_response === "can_supply" ? "border-l-4 border-emerald-400 border-t-slate-100 border-r-slate-100 border-b-slate-100" : req.vendor_response === "cannot_supply" ? "border-l-4 border-red-400 border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-slate-100"}`}>
      <div onClick={() => setExpanded(!expanded)} className="px-4 py-3.5 cursor-pointer">
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${URGENCY_DOT[req.urgency] || "bg-slate-400"}`} />
            <span className="text-sm font-bold text-slate-900">
              {isVendor ? req.product_description : req.customer_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>{req.status}</span>
            <span className="text-slate-300 text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
        {!isVendor && <p className="text-sm text-slate-600 pl-4 font-medium">{req.product_description}</p>}
        <div className="flex gap-3 pl-4 mt-1 text-[11px] text-slate-400 font-mono flex-wrap">
          <span>{req.category_name || req.categories?.name || "—"}</span>
          <span>{timeAgo(req.created_at)}</span>
          <span>{req.branch_name || req.branches?.name || "—"}</span>
        </div>
        {/* Vendor Badge — visible without expanding */}
        {!isVendor && req.vendor_response && (
          <div className="pl-4 mt-1.5 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.vendor_response === "can_supply" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {req.vendor_response === "can_supply" ? "✅ Vendor: Can Supply" : "❌ Vendor: Cannot Supply"}
            </span>
            {req.vendor_price && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                💰 KWD {parseFloat(req.vendor_price).toFixed(3)}
              </span>
            )}
            {req.vendor_delivery_date && (
              <span className="text-[10px] font-semibold text-emerald-600">
                📅 {new Date(req.vendor_delivery_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {/* Details */}
          <div className="pt-3 grid grid-cols-2 gap-2.5 text-xs mb-3">
            {!isVendor && (
              <>
                <div><span className="text-slate-400 font-semibold block mb-0.5">Phone</span><span className="text-slate-700 font-mono">{req.customer_phone}</span></div>
                <div><span className="text-slate-400 font-semibold block mb-0.5">By</span><span className="text-slate-700">{req.created_by_name || "—"}</span></div>
              </>
            )}
            <div><span className="text-slate-400 font-semibold block mb-0.5">Type</span><span className="text-slate-700">{req.request_type}</span></div>
            <div><span className="text-slate-400 font-semibold block mb-0.5">Urgency</span><span className="text-slate-700">{req.urgency}</span></div>
          </div>

          {req.notes && <p className="text-xs text-slate-500 mb-3 italic bg-slate-50 px-3 py-2 rounded-lg">📝 {req.notes}</p>}

          {/* Vendor Response Badge */}
          {req.vendor_response && (
            <div className={`mb-3 px-3 py-2.5 rounded-xl border ${req.vendor_response === "can_supply" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm">{req.vendor_response === "can_supply" ? "✅" : "❌"}</span>
                <span className={`text-xs font-bold ${req.vendor_response === "can_supply" ? "text-emerald-700" : "text-red-700"}`}>
                  Vendor: {req.vendor_response === "can_supply" ? "Can Supply" : "Cannot Supply"}
                </span>
              </div>
              {req.vendor_price && (
                <p className="text-xs font-extrabold text-blue-600 ml-6">💰 KWD {parseFloat(req.vendor_price).toFixed(3)}</p>
              )}
              {req.vendor_delivery_date && (
                <p className="text-[11px] text-emerald-600 font-semibold ml-6">
                  📅 Delivery by {new Date(req.vendor_delivery_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
              {req.vendor_note && <p className="text-[11px] text-slate-500 italic ml-6 mt-0.5">"{req.vendor_note}"</p>}
            </div>
          )}

          {!isVendor && canEdit && (
            <>
              {/* Status Buttons */}
              <div className="mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Change Status</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => handleStatus(s)} disabled={updating}
                      className={`py-2 text-[11px] font-bold rounded-lg border-2 transition ${req.status === s ? STATUS_ACTIVE[s] : STATUS_BTN[s]}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Reassign (admin only) */}
              {userRole === "admin" && branches?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reassign Branch</p>
                  <select value={req.branch_id || ""} onChange={handleBranch} disabled={updating}
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-blue-400">
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Call Button */}
          {!isVendor && (
            <a href={`tel:${req.customer_phone?.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold bg-green-50 text-green-600 rounded-xl border border-green-200 mt-1">
              📞 Call {req.customer_name}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// REQUEST LIST
// ══════════════════════════════════════
function RequestList({ user, branches, onStatusChange, onBranchChange, refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState(user.branch_id || "All");

  useEffect(() => {
    loadRequests();
  }, [refreshKey]);

  const loadRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("product_requests")
      .select("*, categories(name), branches(name), profiles!product_requests_created_by_fkey(full_name), vendor_response, vendor_delivery_date, vendor_note, vendor_responded_at")
      .order("created_at", { ascending: false });
    if (user.role === "salesman" || user.role === "manager") {
      query = query.eq("branch_id", user.branch_id);
    }
    const { data } = await query;
    setRequests((data || []).map((r) => ({
      ...r,
      category_name: r.categories?.name,
      branch_name: r.branches?.name,
      created_by_name: r.profiles?.full_name,
    })));
    setLoading(false);
  };

  let filtered = requests;
  if (branchFilter !== "All") filtered = filtered.filter((r) => r.branch_id === branchFilter);
  if (filter !== "All") filtered = filtered.filter((r) => r.status === filter);
  if (search) filtered = filtered.filter((r) => r.customer_name?.toLowerCase().includes(search.toLowerCase()) || r.product_description?.toLowerCase().includes(search.toLowerCase()));

  const counts = { All: requests.filter((r) => branchFilter === "All" || r.branch_id === branchFilter).length };
  STATUSES.forEach((s) => { counts[s] = requests.filter((r) => r.status === s && (branchFilter === "All" || r.branch_id === branchFilter)).length; });

  return (
    <div className="pb-24">
      <div className="px-5 pt-4 pb-3 sticky top-0 bg-white z-10 border-b border-slate-100">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer or product..."
          className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-400" />
        {user.role === "admin" && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full mt-2 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white">
            <option value="All">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full whitespace-nowrap transition ${filter === s ? "bg-blue-700 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>
              {s} ({counts[s] || 0})
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pt-3 flex flex-col gap-2.5">
        {loading ? (
          <p className="text-center text-slate-400 py-10">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400"><div className="text-4xl mb-2">📋</div><p className="text-sm font-semibold">No requests found</p></div>
        ) : filtered.map((r) => (
          <RequestCard key={r.id} req={r} onStatusChange={onStatusChange} onBranchChange={onBranchChange} canEdit={user.role !== "salesman" || r.created_by === user.id} isVendor={false} branches={branches} userRole={user.role} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════
function Dashboard({ user, branches }) {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [branchFilter, setBranchFilter] = useState("All");

  useEffect(() => { loadStats(); }, [branchFilter]);

  const loadStats = async () => {
    const branchId = branchFilter === "All" ? null : branchFilter;
    const { data: s } = await supabase.rpc("get_dashboard_stats", { p_branch_id: branchId });
    setStats(s);
    const { data: tp } = await supabase.rpc("get_top_products", { p_limit: 8, p_branch_id: branchId });
    setTopProducts(tp || []);
  };

  if (!stats) return <p className="text-center text-slate-400 py-20">Loading dashboard...</p>;
  const maxP = topProducts[0]?.request_count || 1;

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-extrabold text-slate-900">Dashboard</h2>
        {user.role === "admin" && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white">
            <option value="All">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {[
          { l: "Today", v: stats.today, c: "text-blue-600", i: "📥" },
          { l: "Pending", v: stats.pending, c: "text-amber-600", i: "⏳" },
          { l: "Contacted", v: stats.contacted, c: "text-indigo-600", i: "📞" },
          { l: "Fulfill Rate", v: stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) + "%" : "0%", c: "text-emerald-600", i: "✅" },
        ].map((k) => (
          <div key={k.l} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-[11px] text-slate-400 font-semibold mb-1">{k.i} {k.l}</div>
            <div className={`text-2xl font-extrabold ${k.c}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">🔥 Most Requested Products</h3>
        {topProducts.length === 0 ? <p className="text-xs text-slate-400">No data yet</p> : topProducts.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5 mb-2.5">
            <span className="text-xs font-extrabold text-blue-500 w-5 font-mono">{i + 1}</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-700 mb-1">{p.product}</div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${(Number(p.request_count) / maxP) * 100}%` }} />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">{String(p.request_count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// VENDOR PORTAL
// ══════════════════════════════════════
function VendorPortal({ user, branches, categories }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [responseForm, setResponseForm] = useState({});
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadRequests(); }, [catFilter]);

  const loadRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("product_requests")
      .select("*, categories(name), branches(name)")
      .eq("status", "Pending")
      .order("urgency", { ascending: false })
      .order("created_at", { ascending: false });
    if (catFilter !== "All") query = query.eq("category_id", catFilter);
    const { data } = await query;
    setRequests(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleRespond = async (req) => {
    const form = responseForm[req.id] || {};
    if (!form.vendor_response) return;
    setSaving(req.id);
    const { error } = await supabase.from("product_requests").update({
      vendor_response: form.vendor_response,
      vendor_delivery_date: form.vendor_delivery_date || null,
      vendor_note: form.vendor_note || null,
      vendor_price: form.vendor_price ? parseFloat(form.vendor_price) : null,
      vendor_responded_at: new Date().toISOString(),
      vendor_id: user.id,
    }).eq("id", req.id);
    setSaving(null);
    if (!error) {
      showToast(form.vendor_response === "can_supply" ? "✅ Response sent!" : "❌ Response sent!");
      setExpandedId(null);
      loadRequests();
    }
  };

  const setField = (id, key, val) => setResponseForm((f) => ({ ...f, [id]: { ...(f[id] || {}), [key]: val } }));

  const urgencyDot = { Normal: "bg-slate-400", "Urgent (3 days)": "bg-amber-500", "Very Urgent (today)": "bg-red-500" };
  const urgencyBadge = { Normal: "", "Urgent (3 days)": "🔶 Urgent", "Very Urgent (today)": "🔴 Very Urgent" };

  const pendingCount = requests.filter((r) => !r.vendor_response).length;
  const respondedCount = requests.filter((r) => r.vendor_response).length;

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Pending Requests</h2>
          <p className="text-xs text-slate-400 font-mono">{user.full_name} · Vendor Portal</p>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">🏷️ VENDOR</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-amber-700">{pendingCount}</div>
          <div className="text-[10px] font-semibold text-amber-600">Awaiting</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-emerald-700">{respondedCount}</div>
          <div className="text-[10px] font-semibold text-emerald-600">Responded</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <div className="text-xl font-extrabold text-red-700">{requests.filter((r) => r.urgency === "Very Urgent (today)").length}</div>
          <div className="text-[10px] font-semibold text-red-600">Very Urgent</div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 flex gap-2 items-center">
        <span>🔒</span>
        <p className="text-[11px] text-amber-700 font-medium">Customer details hidden. Product & branch info only.</p>
      </div>

      {/* Category Filter */}
      <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white mb-4">
        <option value="All">All Categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {/* Request Cards */}
      {loading ? (
        <p className="text-center text-slate-400 py-10 text-sm">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-sm font-semibold">No pending requests</p>
          <p className="text-xs mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => {
            const isOpen = expandedId === req.id;
            const form = responseForm[req.id] || {};
            const hasResponse = req.vendor_response;
            return (
              <div key={req.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${hasResponse ? (req.vendor_response === "can_supply" ? "border-emerald-200" : "border-red-200") : "border-slate-100"}`}>
                {/* Card Header */}
                <div onClick={() => setExpandedId(isOpen ? null : req.id)} className="px-4 py-3.5 cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${urgencyDot[req.urgency] || "bg-slate-400"}`} />
                      <span className="text-sm font-bold text-slate-900 leading-tight">{req.product_description}</span>
                    </div>
                    {hasResponse ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${req.vendor_response === "can_supply" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {req.vendor_response === "can_supply" ? "✅ Can Supply" : "❌ Cannot"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0 ml-2">⏳ Respond</span>
                    )}
                  </div>
                  <div className="flex gap-2.5 pl-4 mt-1 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-mono">{req.categories?.name || "—"}</span>
                    <span className="text-[11px] text-slate-400 font-mono">🏪 {req.branches?.name || "—"}</span>
                    {urgencyBadge[req.urgency] && <span className="text-[11px] font-semibold text-red-500">{urgencyBadge[req.urgency]}</span>}
                  </div>
                  {hasResponse && req.vendor_delivery_date && (
                    <div className="pl-4 mt-1">
                      <span className="text-[11px] font-semibold text-emerald-600">📅 Delivery: {new Date(req.vendor_delivery_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </div>
                  )}
                  {hasResponse && req.vendor_price && (
                    <div className="pl-4 mt-0.5">
                      <span className="text-[11px] font-bold text-blue-600">💰 KWD {parseFloat(req.vendor_price).toFixed(3)}</span>
                    </div>
                  )}
                  {hasResponse && req.vendor_note && (
                    <div className="pl-4 mt-0.5">
                      <span className="text-[11px] text-slate-500 italic">"{req.vendor_note}"</span>
                    </div>
                  )}
                </div>

                {/* Response Form */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Your Response</p>

                    {/* Can / Cannot Supply */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button onClick={() => setField(req.id, "vendor_response", "can_supply")}
                        className={`py-3 rounded-xl border-2 text-xs font-bold transition ${form.vendor_response === "can_supply" ? "bg-emerald-500 border-emerald-500 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                        ✅ Can Supply
                      </button>
                      <button onClick={() => setField(req.id, "vendor_response", "cannot_supply")}
                        className={`py-3 rounded-xl border-2 text-xs font-bold transition ${form.vendor_response === "cannot_supply" ? "bg-red-500 border-red-500 text-white" : "border-red-200 bg-red-50 text-red-700"}`}>
                        ❌ Cannot Supply
                      </button>
                    </div>

                    {/* Delivery Date & Price (only if can supply) */}
                    {form.vendor_response === "can_supply" && (
                      <>
                        <div className="mb-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">📅 Promised Delivery Date</label>
                          <input type="date" value={form.vendor_delivery_date || ""} onChange={(e) => setField(req.id, "vendor_delivery_date", e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2.5 text-xs font-semibold rounded-lg border-2 border-slate-200 bg-slate-50 outline-none focus:border-emerald-400" />
                        </div>
                        <div className="mb-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">💰 Offer Price (KWD)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KWD</span>
                            <input type="number" step="0.001" min="0" value={form.vendor_price || ""} onChange={(e) => setField(req.id, "vendor_price", e.target.value)}
                              placeholder="0.000"
                              className="w-full pl-12 pr-3 py-2.5 text-xs font-semibold rounded-lg border-2 border-slate-200 bg-slate-50 outline-none focus:border-blue-400" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Note */}
                    <div className="mb-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">💬 Note to Branch (optional)</label>
                      <textarea value={form.vendor_note || ""} onChange={(e) => setField(req.id, "vendor_note", e.target.value)}
                        rows={2} placeholder="e.g. Stock arrives Thursday, color limited..."
                        className="w-full px-3 py-2.5 text-xs rounded-lg border-2 border-slate-200 bg-slate-50 outline-none focus:border-blue-400 resize-none" />
                    </div>

                    <button onClick={() => handleRespond(req)} disabled={!form.vendor_response || saving === req.id}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs shadow disabled:opacity-40">
                      {saving === req.id ? "Sending..." : "Send Response to Branch"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl z-50">{toast}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// VENDOR OFFERS
// ══════════════════════════════════════
function VendorOffers({ user, categories }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ product_name: "", category_id: "", price_kwd: "", quantity: "1", description: "", valid_until: "" });

  const isVendor = user.role === "vendor";

  useEffect(() => { loadOffers(); }, []);

  const loadOffers = async () => {
    setLoading(true);
    let query = supabase
      .from("vendor_offers")
      .select("*, categories(name), profiles!vendor_offers_vendor_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    if (isVendor) query = query.eq("vendor_id", user.id);
    else query = query.eq("status", "active");
    const { data } = await query;
    setOffers(data || []);
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handlePost = async () => {
    if (!form.product_name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("vendor_offers").insert({
      vendor_id: user.id,
      product_name: form.product_name.trim(),
      category_id: form.category_id || null,
      price_kwd: form.price_kwd ? parseFloat(form.price_kwd) : null,
      quantity: parseInt(form.quantity) || 1,
      description: form.description.trim() || null,
      valid_until: form.valid_until || null,
      status: "active",
    });
    setSaving(false);
    if (!error) {
      showToast("✅ Offer posted to all branches!");
      setShowForm(false);
      setForm({ product_name: "", category_id: "", price_kwd: "", quantity: "1", description: "", valid_until: "" });
      loadOffers();
    }
  };

  const handlePurchase = async (offer) => {
    setPurchasing(offer.id);
    const { error } = await supabase.from("vendor_offers").update({
      status: "purchased",
      purchased_by: user.id,
      purchased_at: new Date().toISOString(),
    }).eq("id", offer.id);
    setPurchasing(null);
    if (!error) {
      showToast("🛒 Marked as Purchased!");
      loadOffers();
    }
  };

  const inp = "w-full px-3 py-2.5 text-xs font-semibold rounded-lg border-2 border-slate-200 bg-slate-50 outline-none focus:border-blue-400";
  const lbl = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Vendor Offers</h2>
          <p className="text-xs text-slate-400 font-mono">{isVendor ? "Push stock to all branches" : "Available from vendors"}</p>
        </div>
        {isVendor && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow">
            {showForm ? "✕ Cancel" : "+ New Offer"}
          </button>
        )}
      </div>

      {/* Post Offer Form (vendor only) */}
      {isVendor && showForm && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-amber-800 mb-3">📢 Push Stock to All Branches</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className={lbl}>Product Name *</label>
              <input value={form.product_name} onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                placeholder="e.g. Samsung Galaxy S25 Ultra 256GB" className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Category</label>
                <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className={inp}>
                  <option value="">Select...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Qty Available</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>💰 Price (KWD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KWD</span>
                  <input type="number" step="0.001" min="0" value={form.price_kwd} onChange={(e) => setForm((f) => ({ ...f, price_kwd: e.target.value }))}
                    placeholder="0.000" className={`${inp} pl-10`} />
                </div>
              </div>
              <div>
                <label className={lbl}>Valid Until</label>
                <input type="date" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]} className={inp} />
              </div>
            </div>
            <div>
              <label className={lbl}>Description / Notes</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Color, condition, specs..." className={`${inp} resize-none`} />
            </div>
            <button onClick={handlePost} disabled={!form.product_name.trim() || saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs shadow disabled:opacity-40">
              {saving ? "Posting..." : "📢 Post Offer to All Branches"}
            </button>
          </div>
        </div>
      )}

      {/* Offers List */}
      {loading ? (
        <p className="text-center text-slate-400 py-10 text-sm">Loading...</p>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-sm font-semibold">{isVendor ? "No offers posted yet" : "No active vendor offers"}</p>
          {isVendor && <p className="text-xs mt-1">Tap "+ New Offer" to push stock to branches</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <div key={offer.id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm ${offer.status === "purchased" ? "border-slate-200 opacity-60" : "border-amber-200"}`}>
              <div className="px-4 py-3.5">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-slate-900 flex-1">{offer.product_name}</span>
                  {offer.status === "purchased" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-2">🛒 Purchased</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-2">🟢 Available</span>
                  )}
                </div>
                <div className="flex gap-2.5 mt-1 flex-wrap">
                  {offer.categories?.name && <span className="text-[11px] text-slate-400 font-mono">{offer.categories.name}</span>}
                  {!isVendor && offer.profiles?.full_name && <span className="text-[11px] text-slate-400 font-mono">by {offer.profiles.full_name}</span>}
                  {offer.quantity && <span className="text-[11px] font-semibold text-slate-600">Qty: {offer.quantity}</span>}
                </div>
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  {offer.price_kwd && (
                    <span className="text-sm font-extrabold text-blue-600">💰 KWD {parseFloat(offer.price_kwd).toFixed(3)}</span>
                  )}
                  {offer.valid_until && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Valid till {new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                {offer.description && <p className="text-[11px] text-slate-500 italic mt-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">"{offer.description}"</p>}

                {/* Purchase button for staff */}
                {!isVendor && offer.status === "active" && (
                  <button onClick={() => handlePurchase(offer)} disabled={purchasing === offer.id}
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold text-xs shadow disabled:opacity-40">
                    {purchasing === offer.id ? "Marking..." : "🛒 Mark as Purchased"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl z-50">{toast}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("list");
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, branches(name)")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        setUser({ ...profile, email: session.user.email });
        setScreen(profile.role === "vendor" ? "vendor" : "list");
      }
    }
    await loadMasterData();
    setLoading(false);
  };

  const loadMasterData = async () => {
    const { data: b } = await supabase.from("branches").select("*").order("name");
    const { data: c } = await supabase.from("categories").select("*").order("sort_order");
    setBranches(b || []);
    setCategories(c || []);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleLogin = (profile) => {
    setUser(profile);
    setScreen(profile.role === "vendor" ? "vendor" : "list");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen("list");
  };

  const handleBranchChange = async (id, newBranchId) => {
    await supabase.from("product_requests").update({ branch_id: newBranchId }).eq("id", id);
    setRefreshKey((k) => k + 1);
    showToast("Branch updated!");
  };

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from("product_requests").update({ status: newStatus }).eq("id", id);
    setRefreshKey((k) => k + 1);
    showToast(`Status → ${newStatus}`);
  };

  const handleSubmitRequest = () => {
    setScreen("list");
    setRefreshKey((k) => k + 1);
    showToast("Request submitted!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const isVendor = user.role === "vendor";
  const NAV = isVendor
    ? [
        { id: "vendor", icon: "📋", label: "Requests" },
        { id: "offers", icon: "📢", label: "My Offers" },
      ]
    : [
        { id: "list", icon: "📋", label: "Requests" },
        { id: "new", icon: "➕", label: "New" },
        { id: "offers", icon: "📦", label: "Offers" },
        ...(user.role !== "salesman" ? [{ id: "dashboard", icon: "📊", label: "Dashboard" }] : []),
      ];

  return (
    <div className="min-h-screen bg-slate-50 max-w-lg mx-auto relative">
      {/* Header */}
      <div className={`px-5 py-3.5 flex justify-between items-center sticky top-0 z-20 ${isVendor ? "bg-gradient-to-r from-amber-800 to-amber-600" : "bg-gradient-to-r from-slate-800 to-blue-700"}`}>
        <div>
          <h1 className="text-base font-extrabold text-white">TRIKART{isVendor ? " · VENDOR" : ""}</h1>
          <p className={`text-[10px] font-mono tracking-wider ${isVendor ? "text-amber-200" : "text-blue-200"}`}>
            {user.full_name} · {isVendor ? "Vendor Portal" : user.role === "admin" ? "Admin" : user.branches?.name}
          </p>
        </div>
        <button onClick={handleLogout}
          className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold ${isVendor ? "bg-white/10 text-amber-200" : "bg-white/10 text-blue-200"}`}>
          Logout
        </button>
      </div>

      {/* Content */}
      {screen === "new" && !isVendor ? (
        <NewRequestForm user={user} branches={branches} categories={categories} onSubmit={handleSubmitRequest} onCancel={() => setScreen("list")} />
      ) : screen === "dashboard" && !isVendor ? (
        <Dashboard user={user} branches={branches} />
      ) : screen === "offers" ? (
        <VendorOffers user={user} categories={categories} />
      ) : isVendor ? (
        <VendorPortal user={user} branches={branches} categories={categories} />
      ) : (
        <RequestList user={user} branches={branches} onStatusChange={handleStatusChange} onBranchChange={handleBranchChange} refreshKey={refreshKey} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl z-50">
          ✅ {toast}
        </div>
      )}

      {/* Bottom Nav */}
      {screen !== "new" && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-100 flex justify-around py-2 pb-3 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setScreen(n.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 ${screen === n.id ? (isVendor ? "text-amber-700" : "text-blue-700") : "text-slate-400"}`}>
              <span className="text-xl">{n.icon}</span>
              <span className="text-[10px] font-bold">{n.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
