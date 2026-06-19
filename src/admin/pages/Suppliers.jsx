import {{ useState, useEffect, useRef, useCallback }} from 'react'
import {{ supabase }} from '../../lib/supabase.js'
import {{ CLR, S, CUR, WA_DEFAULT }} from '../styles/constants.js'
import {{ softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput }} from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Suppliers() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
  });

  const load = async () => {
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setItems(data || []);
  };
  useEffect(() => {
    load();
  }, []);

  const F = (k) => (e) => {
    const value = e.target.value;
    if ((k === "phone" || k === "whatsapp") && !/^[0-9+]*$/.test(value) && value !== "") return;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      showToast("الاسم مطلوب", "error");
      return;
    }
    setSaving(true);
    try {
      const data = {
        id: form.id || Date.now(),
        name: form.name.trim(),
        phone: form.phone || "",
        whatsapp: form.whatsapp || "",
        email: form.email || "",
        address: form.address || "",
      };
      const { error } = await supabase.from("suppliers").upsert(data);
      if (error) {
        showToast("خطأ: " + error.message, "error");
        return;
      }

      await logActivity(
        form.id ? "تعديل مورد" : "إضافة مورد",
        `${form.id ? "تم تعديل" : "تم إضافة"} المورد: ${form.name}`
      );

      showToast(form.id ? "✅ تم التعديل" : "✅ تمت الإضافة");
      setForm({ id: "", name: "", phone: "", whatsapp: "", email: "", address: "" });
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const edit = (s) =>
    setForm({
      id: s.id,
      name: s.name,
      phone: s.phone || "",
      whatsapp: s.whatsapp || "",
      email: s.email || "",
      address: s.address || "",
    });

  // ✅ حذف المورد → سلة المهملات
  const del = async (id) => {
    await softDelete("suppliers", id, items, setItems, load, showToast, askConfirm);
  };

  const filtered = items.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  const { paged: pagedSuppliers, PagerUI } = usePagination(filtered, 15)

  return (
    <div>
      {ToastUI}
      {ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        🏭 الموردون
      </h1>
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>
          {form.id ? "✏️ تعديل" : "➕ إضافة"} مورد
        </h3>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={form.name} onChange={F("name")} />
          </div>
          <div>
            <label style={S.label}>الهاتف</label>
            <PhoneInput value={form.phone} onChange={F("phone")} placeholder="مثال: 0555123456" />
          </div>
          <div>
            <label style={S.label}>واتساب</label>
            <PhoneInput value={form.whatsapp} onChange={F("whatsapp")} placeholder="مثال: 0555123456" />
          </div>
          <div>
            <label style={S.label}>البريد</label>
            <input style={S.input} value={form.email} onChange={F("email")} />
          </div>
          <div>
            <label style={S.label}>العنوان</label>
            <input style={S.input} value={form.address} onChange={F("address")} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving ? "⏳..." : "💾 حفظ"}
          </button>
          <button
            style={S.btnGray}
            onClick={() => setForm({ id: "", name: "", phone: "", whatsapp: "", email: "", address: "" })}
          >
            ✖
          </button>
        </div>
      </div>
      <div style={S.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <h3 style={{ fontWeight: 800 }}>الموردون ({filtered.length})</h3>
          <input
            style={{ ...S.input, width: 200 }}
            placeholder="🔍 بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>الاسم</th>
                <th style={S.th}>الهاتف</th>
                <th style={S.th}>واتساب</th>
                <th style={S.th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pagedSuppliers.map((s) => (
                <tr key={s.id} className="nq-tr">
                  <td style={{ ...S.td, fontWeight: 700 }}>{s.name}</td>
                  <td style={S.td}>{s.phone || "—"}</td>
                  <td style={S.td}>
                    {s.whatsapp ? (
                      <a
                        href={`https://wa.me/${s.whatsapp}`}
                        target="_blank"
                        style={{ color: "#25D366", fontWeight: 700 }}
                      >
                        💬 {s.whatsapp}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ ...S.td, display: "flex", gap: 5 }}>
                    <button
                      style={{ ...S.btnSm, background: "#dbeafe", color: "#1d4ed8" }}
                      onClick={() => edit(s)}
                    >
                      ✏️
                    </button>
                    <button
                      style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }}
                      onClick={() => del(s.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 24, color: CLR.textSm }}>
                    لا توجد موردين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            {PagerUI}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   👥 العملاء (مع سلة المهملات)
══════════════════════════════════════════ */
