import {{ useState, useEffect, useRef, useCallback }} from 'react'
import {{ supabase }} from '../../lib/supabase.js'
import {{ CLR, S, CUR, WA_DEFAULT }} from '../styles/constants.js'
import {{ softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput }} from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Categories() {
  const [showToast, ToastUI] = useToast();
  const [askConfirm, ConfirmUI] = useConfirm();
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setItems(data || []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!name.trim()) {
      showToast("الاسم مطلوب", "error");
      return;
    }
    try {
      if (editId) {
        await supabase
          .from("categories")
          .update({ name: name.trim(), image: image || null })
          .eq("id", editId);
        await logActivity("تعديل فئة", `تم تعديل الفئة: ${name}`);
        showToast("✅ تم التعديل");
        setEditId(null);
      } else {
        await supabase
          .from("categories")
          .insert({ id: Date.now(), name: name.trim(), image: image || null });
        await logActivity("إضافة فئة", `تم إضافة الفئة: ${name}`);
        showToast("✅ تمت الإضافة");
      }
      setName("");
      setImage("");
      await load();
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    }
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setName(c.name);
    setImage(c.image || "");
  };
  const cancel = () => {
    setEditId(null);
    setName("");
    setImage("");
  };

  // ✅ حذف الفئة → سلة المهملات
  const del = async (id) => {
    await softDelete("categories", id, items, setItems, load, showToast, askConfirm);
  };

  const { paged: pagedCategories, PagerUI } = usePagination(items, 12)

  return (
    <div>
      {ToastUI}
      {ConfirmUI}
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        📂 الفئات
      </h1>

      {editId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 7000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 440,
              direction: "rtl",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 900, fontSize: 16 }}>✏️ تعديل الفئة</h3>
              <button
                onClick={cancel}
                style={{
                  background: CLR.bg,
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
            <label style={S.label}>الاسم *</label>
            <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} />
            <label style={{ ...S.label, marginTop: 10 }}>صورة جديدة (400×300)</label>
            <input
              style={S.input}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const r = new FileReader();
                r.onload = (ev) => setImage(ev.target.result);
                r.readAsDataURL(e.target.files[0]);
              }}
            />
            {image && (
              <LazyImage src={image} width={60} height={60} radius={8} fallback="📂" />
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={S.btn} onClick={save}>
                💾 حفظ التعديل
              </button>
              <button style={S.btnGray} onClick={cancel}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10, color: CLR.accent }}>
          ➕ إضافة فئة جديدة
        </h3>
        <p style={{ fontSize: 12, color: CLR.textSm, marginBottom: 12 }}>
          📐 حجم صورة الفئة المثالي: <strong>400×300 بكسل</strong>
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>اسم الفئة *</label>
            <input
              style={S.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مواد غذائية"
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>صورة (400×300)</label>
            <input
              style={S.input}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const r = new FileReader();
                r.onload = (ev) => setImage(ev.target.result);
                r.readAsDataURL(e.target.files[0]);
              }}
            />
          </div>
          {image && (
            <LazyImage src={image} width={60} height={60} radius={8} fallback="📂" />
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button style={S.btn} onClick={save}>
            {editId ? "💾 حفظ التعديل" : "➕ إضافة"}
          </button>
          {editId && (
            <button style={S.btnGray} onClick={cancel}>
              ✖ إلغاء
            </button>
          )}
        </div>
      </div>
      <div style={S.card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={S.th}>الصورة</th>
              <th style={S.th}>الاسم</th>
              <th style={S.th}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map((c, i) => (
              <tr
                key={c.id}
                className="nq-tr"
                style={{ background: i % 2 === 0 ? "white" : CLR.bg, cursor: "pointer" }}
                onClick={() => startEdit(c)}
              >
                <td style={S.td}>
                  {c.image ? (
                    <LazyImage src={c.image} width={48} height={48} radius={8} fallback="📂" />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 42,
                        borderRadius: 8,
                        background: CLR.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      📁
                    </div>
                  )}
                </td>
                <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>
                <td style={S.td} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      style={{ ...S.btnSm, background: "#DBEAFE", color: "#1D4ED8" }}
                      onClick={() => startEdit(c)}
                    >
                      ✏️
                    </button>
                    <button
                      style={{ ...S.btnSm, background: "#FEE2E2", color: "#DC2626" }}
                      onClick={() => del(c.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: 28, color: CLR.textSm }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                  لا توجد فئات
                </td>
              </tr>
            )}
          </tbody>
        </table>
            {PagerUI}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   🏷️ العلامات التجارية (مع سلة المهملات)
══════════════════════════════════════════ */
