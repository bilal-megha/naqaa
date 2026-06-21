import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Settings({ showToast }) {

  const [form, setForm] = useState({

    store_name: "نقاء",

    store_currency: "دج",

    whatsapp_number: WA_DEFAULT,

    admin_phone: WA_DEFAULT,

    contact_whatsapp: WA_DEFAULT,

    free_shipping_threshold: "5000",
    points_per_100: "1",
    points_to_dzd: "1",

    shipping_cost: "500",

    tier_m2_min: "5000",

    tier_m3_min: "20000",

    tier_m1_discount: "0",

    tier_m2_discount: "5",

    tier_m3_discount: "10",

    maintenance_mode: "0",

    maintenance_msg: "المتجر في طور التحديث، سنعود قريباً 🔧",

    terms_text: "",

    announce_bar: "",

    contact_hours: "من 8 صباحاً إلى 10 مساءً",

    contact_address: "",

    contact_email: "",

  });

  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const loadSettings = async () => {

      try {

        const { data } = await supabase.from("settings").select("*");

        if (data) {

          const map = {};

          data.forEach((r) => (map[r.key] = r.value));

          setForm((f) => ({ ...f, ...map }));



          try {

            const b = JSON.parse(map["branches"] || "[]");

            setBranches(

              b.length > 0

                ? b

                : [{ id: Date.now(), name: "الفرع الرئيسي", address: "الجزائر العاصمة", phone: "" }]

            );

          } catch {

            setBranches([

              { id: Date.now(), name: "الفرع الرئيسي", address: "الجزائر العاصمة", phone: "" },

            ]);

          }

        }

      } catch (err) {

        console.error("❌ خطأ في تحميل الإعدادات:", err);

        showToast("❌ خطأ في تحميل الإعدادات", "error");

      } finally {

        setLoading(false);

      }

    };

    loadSettings();

  }, []);



  const addBranch = () => {

    setBranches([...branches, { id: Date.now(), name: "", address: "", phone: "" }]);

  };



  const updateBranch = (id, field, value) => {

    setBranches(branches.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  };



  const removeBranch = (id) => {

    if (!confirm("حذف هذا الفرع؟")) return;

    setBranches(branches.filter((b) => b.id !== id));

  };



  const saveBranches = async () => {

    try {

      await supabase.from("settings").upsert({ key: "branches", value: JSON.stringify(branches) });

      return true;

    } catch (err) {

      console.error("❌ خطأ في حفظ الفروع:", err);

      showToast("❌ خطأ في حفظ الفروع", "error");

      return false;

    }

  };



  const save = async () => {

    setSaving(true);

    try {

      await Promise.all(

        Object.entries(form).map(([key, value]) =>

          supabase.from("settings").upsert({ key, value: String(value) })

        )

      );

      await saveBranches();

      await logActivity("تحديث الإعدادات", "تم تحديث إعدادات المتجر");

      showToast("✅ تم حفظ جميع الإعدادات");

    } catch (err) {

      console.error("❌ خطأ في الحفظ:", err);

      showToast("❌ خطأ في حفظ الإعدادات", "error");

    } finally {

      setSaving(false);

    }

  };



  if (loading) {

    return <div style={{ textAlign: "center", padding: 40 }}>⏳ جاري تحميل الإعدادات...</div>;

  }



  return (

    <div>

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        ⚙️ إعدادات المتجر

      </h1>

      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>

          🏪 إعدادات عامة

        </h3>

        <div style={S.grid2}>

          <div>

            <label style={S.label}>اسم المتجر</label>

            <input

              style={S.input}

              value={form.store_name}

              onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))}

              placeholder="نقاء"

            />

          </div>

          <div>

            <label style={S.label}>العملة</label>

            <input

              style={S.input}

              value={form.store_currency}

              onChange={(e) => setForm((f) => ({ ...f, store_currency: e.target.value }))}

              placeholder="دج"

            />

          </div>

          <div>

            <label style={S.label}>📱 رقم واتساب المتجر</label>

            <PhoneInput

              value={form.whatsapp_number}

              onChange={(e) =>

                setForm((f) => ({

                  ...f,

                  whatsapp_number: e.target.value,

                  admin_phone: e.target.value,

                  contact_whatsapp: e.target.value,

                }))

              }

              placeholder="213xxxxxxxxx"

            />

          </div>

          <div>

            <label style={S.label}>📧 البريد الإلكتروني للتواصل</label>

            <input

              style={S.input}

              value={form.contact_email}

              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}

              placeholder="info@naqaa.dz"

            />

          </div>

          <div>


          {/* ── قسم النقاط والمكافآت ── */}
          <div style={{...S.card, background:'linear-gradient(135deg,#FFF7ED,#FFEDD5)', border:'2px solid #FED7AA', marginBottom:16}}>
            <h3 style={{fontWeight:900,fontSize:15,marginBottom:14,color:'#92400E'}}>⭐ نظام النقاط والمكافآت</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={S.label}>نقاط لكل 100 دج من الطلبية</label>
                <NumInput
                  value={form.points_per_100}
                  onChange={e=>setForm(f=>({...f,points_per_100:e.target.value}))}
                  placeholder="مثال: 1"
                />
              </div>
              <div>
                <label style={S.label}>قيمة النقطة بالدينار</label>
                <NumInput
                  value={form.points_to_dzd}
                  onChange={e=>setForm(f=>({...f,points_to_dzd:e.target.value}))}
                  placeholder="مثال: 1"
                />
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.7)',borderRadius:10,padding:'10px 14px',fontSize:13,fontWeight:700,color:'#92400E'}}>
              💡 مثال: طلبية 1000 دج = <strong>{Number(form.points_per_100||1)*10} نقطة</strong> = خصم <strong>{Number(form.points_per_100||1)*10*Number(form.points_to_dzd||1)} دج</strong> في الطلب القادم
            </div>
          </div>

            <label style={S.label}>🚚 حد التوصيل المجاني (دج)</label>

            <NumInput

              value={form.free_shipping_threshold}

              onChange={(e) => setForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>🚚 تكلفة التوصيل (دج)</label>

            <NumInput

              value={form.shipping_cost}

              onChange={(e) => setForm((f) => ({ ...f, shipping_cost: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>⏰ ساعات العمل</label>

            <input

              style={S.input}

              value={form.contact_hours}

              onChange={(e) => setForm((f) => ({ ...f, contact_hours: e.target.value }))}

              placeholder="من 8 صباحاً إلى 10 مساءً"

            />

          </div>

          <div>

            <label style={S.label}>📍 العنوان</label>

            <input

              style={S.input}

              value={form.contact_address}

              onChange={(e) => setForm((f) => ({ ...f, contact_address: e.target.value }))}

              placeholder="الجزائر العاصمة"

            />

          </div>

        </div>

        <div style={{ marginTop: 12 }}>

          <label style={S.label}>📢 شريط الإعلانات</label>

          <input

            style={S.input}

            value={form.announce_bar}

            onChange={(e) => setForm((f) => ({ ...f, announce_bar: e.target.value }))}

            placeholder="🎉 توصيل مجاني على الطلبات فوق 5000 دج"

          />

        </div>

      </div>



      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>🏢 إدارة الفروع</h3>

        {branches.map((branch) => (

          <div

            key={branch.id}

            style={{

              display: "grid",

              gridTemplateColumns: "2fr 2fr 1fr auto",

              gap: 8,

              alignItems: "center",

              marginBottom: 8,

              background: CLR.bg,

              padding: 10,

              borderRadius: 8,

            }}

          >

            <input

              style={S.input}

              value={branch.name}

              onChange={(e) => updateBranch(branch.id, "name", e.target.value)}

              placeholder="اسم الفرع"

            />

            <input

              style={S.input}

              value={branch.address}

              onChange={(e) => updateBranch(branch.id, "address", e.target.value)}

              placeholder="العنوان"

            />

            <PhoneInput

              value={branch.phone}

              onChange={(e) => updateBranch(branch.id, "phone", e.target.value)}

              placeholder="الهاتف"

            />

            <button

              style={{ ...S.btnSm, background: "#FEE2E2", color: "#DC2626" }}

              onClick={() => removeBranch(branch.id)}

            >

              🗑️

            </button>

          </div>

        ))}

        <button

          style={{ ...S.btnSm, background: CLR.success, color: "white" }}

          onClick={addBranch}

        >

          ➕ إضافة فرع

        </button>

      </div>



      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          🏅 إعدادات تصنيف العملاء

        </h3>

        <div

          style={{

            display: "grid",

            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",

            gap: 14,

          }}

        >

          <div>

            <label style={S.label}>🥈 M2 — الحد الأدنى (دج)</label>

            <NumInput

              value={form.tier_m2_min}

              onChange={(e) => setForm((f) => ({ ...f, tier_m2_min: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>🥇 M3 — الحد الأدنى (دج)</label>

            <NumInput

              value={form.tier_m3_min}

              onChange={(e) => setForm((f) => ({ ...f, tier_m3_min: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>خصم M1 %</label>

            <NumInput

              value={form.tier_m1_discount}

              onChange={(e) => setForm((f) => ({ ...f, tier_m1_discount: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>خصم M2 %</label>

            <NumInput

              value={form.tier_m2_discount}

              onChange={(e) => setForm((f) => ({ ...f, tier_m2_discount: e.target.value }))}

            />

          </div>

          <div>

            <label style={S.label}>خصم M3 %</label>

            <NumInput

              value={form.tier_m3_discount}

              onChange={(e) => setForm((f) => ({ ...f, tier_m3_discount: e.target.value }))}

            />

          </div>

        </div>

      </div>

      <button style={{ ...S.btn, marginTop: 16 }} onClick={save} disabled={saving}>

        {saving ? "⏳ جاري الحفظ..." : "💾 حفظ جميع الإعدادات"}

      </button>

    </div>

  );

}



/* ══════════════════════════════════════════

   🎨 إدارة واجهة المتجر

══════════════════════════════════════════ */

