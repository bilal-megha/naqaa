import {{ useState, useEffect, useRef, useCallback }} from 'react'
import {{ supabase }} from '../../lib/supabase.js'
import {{ CLR, S, CUR, WA_DEFAULT }} from '../styles/constants.js'
import {{ softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput }} from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function DataBackup({ showToast }) {
  const [loading, setLoading] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem("nq_last_backup") || "—");

  useEffect(() => {
    const ab = localStorage.getItem("nq_auto_backup") === "1";
    setAutoBackup(ab);
    if (ab) {
      const last = localStorage.getItem("nq_last_backup_date");
      const today = new Date().toDateString();
      if (last !== today) {
        setTimeout(() => doAutoBackup(), 3000);
      }
    }
  }, []);

  const doAutoBackup = async () => {
    try {
      const tables = [
        "products",
        "categories",
        "brands",
        "suppliers",
        "customers",
        "orders",
        "purchases",
        "expenses",
        "promotions",
        "settings",
      ];
      const backup = {};
      for (const t of tables) {
        const { data } = await supabase.from(t).select("*").catch(() => ({ data: [] }));
        backup[t] = data || [];
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naqaa_auto_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = new Date().toLocaleString("ar-DZ");
      localStorage.setItem("nq_last_backup_date", new Date().toDateString());
      localStorage.setItem("nq_last_backup", now);
      setLastBackup(now);
    } catch (err) {
      console.error("❌ خطأ في النسخ الاحتياطي التلقائي:", err);
    }
  };

  const toggleAuto = () => {
    const v = !autoBackup;
    setAutoBackup(v);
    localStorage.setItem("nq_auto_backup", v ? "1" : "0");
    showToast(v ? "✅ سيتم النسخ الاحتياطي تلقائياً كل يوم" : "⏸️ تم إيقاف النسخ التلقائي");
  };

  const tables = [
    "products",
    "orders",
    "customers",
    "suppliers",
    "brands",
    "categories",
    "purchases",
    "coupons",
    "expenses",
    "notifications",
    "settings",
  ];

  const backup = async () => {
    setLoading(true);
    try {
      const backup = {};
      for (const table of tables) {
        const { data } = await supabase.from(table).select("*");
        backup[table] = data || [];
      }
      backup._date = new Date().toISOString();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naqaa_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logActivity("نسخ احتياطي", "تم إنشاء نسخة احتياطية");
      showToast("✅ تم تحميل النسخة الاحتياطية");
    } catch (err) {
      showToast("❌ خطأ: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const restore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("⚠️ هذا سيستبدل البيانات الحالية. هل أنت متأكد؟")) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        let restored = 0;
        for (const table of tables) {
          if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
            await supabase.from(table).upsert(data[table]);
            restored += data[table].length;
          }
        }
        await logActivity("استعادة نسخة احتياطية", `تم استعادة ${restored} سجل`);
        showToast(`✅ تم استعادة ${restored} سجل`);
      } catch (err) {
        showToast("❌ خطأ في ملف النسخة الاحتياطية", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        💾 النسخ الاحتياطي
      </h1>
      <div style={S.card}>
        <p style={{ color: CLR.textSm, fontSize: 14, marginBottom: 20 }}>
          احفظ نسخة من جميع بيانات متجرك في ملف JSON. يمكنك استعادتها في أي وقت.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button
            style={{ ...S.btn, padding: "14px 28px", fontSize: 15 }}
            onClick={backup}
            disabled={loading}
          >
            {loading ? "⏳ جاري التحميل..." : "📥 تحميل نسخة احتياطية"}
          </button>
          <label
            style={{
              ...S.btnGray,
              padding: "14px 28px",
              fontSize: 15,
              cursor: "pointer",
              borderRadius: 30,
              fontWeight: 700,
            }}
          >
            📤 استعادة من ملف
            <input type="file" accept=".json" style={{ display: "none" }} onChange={restore} />
          </label>
        </div>
        <div
          style={{
            marginTop: 20,
            background: "#fef9c3",
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          ⚠️ <strong>تنبيه:</strong> استعادة النسخة الاحتياطية ستضيف البيانات للموجودة ولن تحذف شيئاً.
          يُنصح بعمل نسخة احتياطية أسبوعية.
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={autoBackup} onChange={toggleAuto} />
            <span>🔄 نسخ احتياطي تلقائي يومي</span>
          </label>
          {lastBackup !== "—" && (
            <span style={{ fontSize: 12, color: CLR.textSm }}>📅 آخر نسخ: {lastBackup}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   🏢 من نحن
══════════════════════════════════════════ */
