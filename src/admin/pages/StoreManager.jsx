import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function StoreManager({ showToast }) {

  const [banners, setBanners] = useState([]);

  const [form, setForm] = useState({ title: "", subtitle: "", image: "" });

  const [promoText, setPromoText] = useState("");

  const [announceBar, setAnnounceBar] = useState("");

  const [saving, setSaving] = useState(false);

  const [primaryColor, setPrimaryColor] = useState("#dc2626");

  const [storeLogo, setStoreLogo] = useState("");

  const [storeName2, setStoreName2] = useState("");



  useEffect(() => {

    const load = async () => {

      try {

        const { data } = await supabase.from("settings").select("*");

        if (!data) return;

        const map = {};

        data.forEach((r) => (map[r.key] = r.value));

        try {

          setBanners(JSON.parse(map["store_banners"] || "[]"));

        } catch {}

        setPromoText(map["promo_text"] || "");

        setAnnounceBar(map["announce_bar"] || "");

        setPrimaryColor(map["primary_color"] || "#1565C0");

        setStoreLogo(map["store_logo"] || "");

        setStoreName2(map["store_name"] || "نقاء");

      } catch (err) {

        console.error("❌ خطأ في تحميل إدارة المتجر:", err);

        showToast("❌ خطأ في تحميل البيانات", "error");

      }

    };

    load();

  }, []);



  const handleLogo = (e) => {

    const r = new FileReader();

    r.onload = (ev) => setStoreLogo(ev.target.result);

    r.readAsDataURL(e.target.files[0]);

  };

  const handleImg = (e) => {

    const r = new FileReader();

    r.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }));

    r.readAsDataURL(e.target.files[0]);

  };



  const addBanner = async () => {

    if (!form.title && !form.image) {

      showToast("أضف صورة أو عنوان", "error");

      return;

    }

    setSaving(true);

    try {

      const updated = [...banners, { id: Date.now(), ...form }];

      await supabase.from("settings").upsert({ key: "store_banners", value: JSON.stringify(updated) });

      setBanners(updated);

      setForm({ title: "", subtitle: "", image: "" });

      await logActivity("إضافة بانر", `تم إضافة بانر: ${form.title || "بدون عنوان"}`);

      showToast("✅ تمت الإضافة");

    } catch (err) {

      showToast("❌ خطأ: " + err.message, "error");

    } finally {

      setSaving(false);

    }

  };



  const delBanner = async (id) => {

    try {

      const updated = banners.filter((b) => b.id !== id);

      await supabase.from("settings").upsert({ key: "store_banners", value: JSON.stringify(updated) });

      setBanners(updated);

      await logActivity("حذف بانر", `تم حذف البانر`);

      showToast("تم الحذف");

    } catch (err) {

      showToast("❌ خطأ: " + err.message, "error");

    }

  };



  const saveTexts = async () => {

    setSaving(true);

    try {

      await Promise.all([

        supabase.from("settings").upsert({ key: "promo_text", value: promoText }),

        supabase.from("settings").upsert({ key: "announce_bar", value: announceBar }),

        supabase.from("settings").upsert({ key: "primary_color", value: primaryColor }),
        supabase.from("settings").upsert({ key: "accent_color", value: "#FF6D00" }),

        supabase.from("settings").upsert({ key: "store_logo", value: storeLogo }),

        supabase.from("settings").upsert({ key: "store_name", value: storeName2 }),

      ]);

      await logActivity("تحديث واجهة المتجر", "تم تحديث واجهة المتجر");

      showToast("✅ تم الحفظ");

    } catch (err) {

      showToast("❌ خطأ: " + err.message, "error");

    } finally {

      setSaving(false);

    }

  };



  return (

    <div>

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        🎨 إدارة واجهة المتجر

      </h1>

      <div style={{ ...S.card, background: "#f0f9ff", border: "1px solid #bfdbfe" }}>

        <strong style={{ color: "#1d4ed8" }}>📐 أحجام الصور:</strong>

        <div

          style={{

            display: "flex",

            gap: 16,

            marginTop: 8,

            flexWrap: "wrap",

            fontSize: 13,

          }}

        >

          <span>🖼️ بانر: <strong>1200×450px</strong></span>

          <span>🏷️ ماركة: <strong>300×300px</strong></span>

          <span>📂 فئة: <strong>400×300px</strong></span>

          <span>📦 منتج: <strong>600×600px</strong></span>

          <span>🎯 بانر عرض: <strong>1200×400px</strong></span>

        </div>

      </div>

      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          📢 النصوص الترويجية

        </h3>

        <label style={S.label}>شريط الإعلانات</label>

        <input

          style={S.input}

          value={announceBar}

          onChange={(e) => setAnnounceBar(e.target.value)}

          placeholder="🎉 توصيل مجاني على الطلبات فوق 500 دج"

        />

        <div style={{ marginTop: 12 }}>

          <label style={S.label}>نص ترويجي</label>

          <input

            style={S.input}

            value={promoText}

            onChange={(e) => setPromoText(e.target.value)}

            placeholder="اشتري 3 خذ 4 مجاناً!"

          />

        </div>

        <button style={{ ...S.btn, marginTop: 14 }} onClick={saveTexts} disabled={saving}>

          {saving ? "⏳..." : "💾 حفظ النصوص"}

        </button>

      </div>

      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          🎨 الهوية البصرية

        </h3>

        <div style={S.grid2}>

          <div>

            <label style={S.label}>اسم المتجر</label>

            <input

              style={S.input}

              value={storeName2}

              onChange={(e) => setStoreName2(e.target.value)}

            />

          </div>

          <div>

            <label style={S.label}>اللون الأساسي</label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

              <input

                type="color"

                value={primaryColor}

                onChange={(e) => setPrimaryColor(e.target.value)}

                style={{ width: 46, height: 38, border: "none", borderRadius: 8, cursor: "pointer" }}

              />

              <input

                style={{ ...S.input, width: 120 }}

                value={primaryColor}

                onChange={(e) => setPrimaryColor(e.target.value)}

              />

            </div>

          </div>

          <div>

            <label style={S.label}>شعار المتجر</label>

            <input style={S.input} type="file" accept="image/*" onChange={handleLogo} />

            {storeLogo && (

              <img src={storeLogo} style={{ height: 50, marginTop: 6, borderRadius: 8 }} />

            )}

          </div>

        </div>

        <button style={{ ...S.btn, marginTop: 14 }} onClick={saveTexts} disabled={saving}>

          {saving ? "⏳..." : "💾 حفظ الهوية"}

        </button>

      </div>

      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          🖼️ البانرات المتحركة

        </h3>

        <p style={{ fontSize: 12, color: CLR.textSm, marginBottom: 12 }}>

          📐 حجم البانر المثالي: <strong>1200×450 بكسل</strong>

        </p>

        <div style={S.grid2}>

          <div>

            <label style={S.label}>العنوان</label>

            <input

              style={S.input}

              value={form.title}

              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}

              placeholder="عروض الصيف"

            />

          </div>

          <div>

            <label style={S.label}>نص فرعي</label>

            <input

              style={S.input}

              value={form.subtitle}

              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>صورة</label>

            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />

          </div>

          {form.image && (

            <div>

              <img

                src={form.image}

                style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 10 }}

              />

            </div>

          )}

        </div>

        <button style={{ ...S.btn, marginTop: 14 }} onClick={addBanner} disabled={saving}>

          {saving ? "⏳..." : "➕ إضافة بانر"}

        </button>

      </div>

      {banners.length > 0 && (

        <div style={S.card}>

          <h3 style={{ fontWeight: 800, marginBottom: 14 }}>البانرات ({banners.length})</h3>

          {banners.map((b, i) => (

            <div

              key={b.id}

              style={{

                display: "flex",

                gap: 12,

                alignItems: "center",

                background: "#f8fafc",

                borderRadius: 12,

                padding: 12,

                marginBottom: 8,

              }}

            >

              <span style={{ fontWeight: 700, color: CLR.textSm }}>#{i + 1}</span>

              {b.image && (

                <img

                  src={b.image}

                  style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}

                />

              )}

              <div style={{ flex: 1 }}>

                <div style={{ fontWeight: 700 }}>{b.title || "(بدون عنوان)"}</div>

                {b.subtitle && <div style={{ fontSize: 12, color: CLR.textSm }}>{b.subtitle}</div>}

              </div>

              <button

                style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }}

                onClick={() => delBanner(b.id)}

              >

                🗑️

              </button>

            </div>

          ))}

        </div>

      )}

    </div>

  );

}



/* ══════════════════════════════════════════

   💾 نسخ احتياطي

══════════════════════════════════════════ */

