import {{ useState, useEffect, useRef, useCallback }} from 'react'
import {{ supabase }} from '../../lib/supabase.js'
import {{ CLR, S, CUR, WA_DEFAULT }} from '../styles/constants.js'
import {{ softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput }} from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Notifications() {
  const [showToast, ToastUI] = useToast();
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [addressFilter, setAddressFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [{ data: n }, { data: c }] = await Promise.all([
        supabase.from("notifications").select("*").order("id", { ascending: false }),
        supabase.from("customers").select("id,name,tier,address,phone").order("name"),
      ]);
      setItems(n || []);
      setCustomers(c || []);
    } catch (err) {
      console.error("❌ خطأ في تحميل الإشعارات:", err);
    }
  };
  useEffect(() => { load(); }, []);

  const targeted = customers.filter((c) => {
    if (targetType === "all") return true;
    if (["M1", "M2", "M3"].includes(targetType)) return (c.tier || "M1") === targetType;
    if (targetType === "address") {
      if (!addressFilter) return false;
      return (c.address || "").toLowerCase().includes(addressFilter.toLowerCase());
    }
    return true;
  });

  const send = async () => {
    if (!title || !body) {
      showToast("العنوان والنص مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("notifications").insert({
        id: Date.now(),
        title,
        body,
        target_type: targetType,
        target_count: targeted.length,
        date: new Date().toLocaleString("ar-DZ"),
        is_read: false,
      });
      await logActivity("إرسال إشعار", `تم إرسال إشعار لـ ${targeted.length} عميل: ${title}`);
      showToast(`✅ تم الإرسال لـ ${targeted.length} عميل`);
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const tierLabels = { all: "الكل", M1: "M1 عادي", M2: "M2 مميز", M3: "M3 VIP", address: "حسب العنوان" };
  const tierColors = { all: "#475569", M1: "#475569", M2: "#1d4ed8", M3: "#92400e", address: "#059669" };

  const { paged: pagedNotifs, PagerUI } = usePagination(items, 15)

  return (
    <div>
      {ToastUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        🔔 الإشعارات
      </h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          📢 إرسال إشعار
        </h3>
        <label style={S.label}>👥 أرسل إلى</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.entries(tierLabels).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTargetType(k)}
              style={{
                ...S.btnSm,
                background: targetType === k ? tierColors[k] : "#f1f5f9",
                color: targetType === k ? "white" : "#64748b",
                border: `2px solid ${targetType === k ? tierColors[k] : "transparent"}`,
                fontWeight: 700,
              }}
            >
              {v}
            </button>
          ))}
        </div>
        {targetType === "address" && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>🗺️ فلتر العنوان</label>
            <input
              style={S.input}
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              placeholder="مثال: الجزائر العاصمة"
            />
            <p style={{ fontSize: 11, color: CLR.textSm, marginTop: 4 }}>
              📌 سيتم إرسال الإشعار للعملاء الذين يحتوي عنوانهم على هذه الكلمة
            </p>
          </div>
        )}
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 13,
            fontWeight: 700,
            color: "#059669",
          }}
        >
          👥 سيصل الإشعار إلى: <strong>{targeted.length}</strong> عميل
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>العنوان *</label>
            <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>النص *</label>
            <input style={S.input} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <button style={S.btn} onClick={send} disabled={saving || targeted.length === 0}>
          {saving ? "⏳..." : "📢 إرسال"}
        </button>
      </div>
      <div style={S.card}>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", color: CLR.textSm, padding: 24 }}>لا توجد إشعارات</p>
        ) : (
          pagedNotifs.map((n) => (
            <div key={n.id} style={{ borderBottom: `1px solid ${CLR.bg}`, padding: "12px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <strong>{n.title}</strong>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {n.target_type && n.target_type !== "all" && (
                    <span
                      style={{
                        fontSize: 11,
                        background: "#f1f5f9",
                        borderRadius: 20,
                        padding: "2px 8px",
                      }}
                    >
                      {tierLabels[n.target_type] || n.target_type}
                    </span>
                  )}
                  {n.target_count > 0 && (
                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>
                      {n.target_count} عميل
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: CLR.textSm }}>{n.date}</span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: CLR.textSm, marginTop: 4 }}>{n.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════
   📈 التقارير
══════════════════════════════════════════ */
