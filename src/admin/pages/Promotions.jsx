import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function PromotionsManager() {

  const [showToast, ToastUI] = useToast();

  const [askConfirm, ConfirmUI] = useConfirm();

  const [promos, setPromos] = useState([]);

  const [products, setProducts] = useState([]);

  const [saving, setSaving] = useState(false);

  const [prodSearch, setProdSearch] = useState("");

  const [form, setForm] = useState({

    id: "",

    name: "",

    type: "percent",

    active: true,

    buy_qty: 3,

    get_qty: 1,

    discount_value: 0,

    product_ids: [],

    min_amount: 0,

    description: "",

    end_date: "",

    image: "",

    tier_qty: 1,

    tier_type: "percent",

    tier_value: 0,

    region: "",

  });



  const load = async () => {

    try {

      const [{ data: p }, { data: pr }] = await Promise.all([

        supabase.from("products").select("id,name,price,image,stock").order("name"),

        supabase.from("promotions").select("*").order("id", { ascending: false }),

      ]);

      setProducts(p || []);

      setPromos(pr || []);

      console.log("✅ تم تحميل المنتجات:", p?.length || 0);

      console.log("✅ تم تحميل العروض:", pr?.length || 0);

    } catch (err) {

      console.error("❌ خطأ في تحميل العروض:", err);

      showToast("❌ خطأ في تحميل البيانات", "error");

    }

  };

  useEffect(() => { load(); }, []);



  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));



  const toggleProduct = (id) =>

    setForm((f) => ({

      ...f,

      product_ids: f.product_ids.includes(id)

        ? f.product_ids.filter((x) => x !== id)

        : [...f.product_ids, id],

    }));



  const handleImg = (e) => {

    const r = new FileReader();

    r.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }));

    r.readAsDataURL(e.target.files[0]);

  };



  const save = async () => {

    if (!form.name.trim()) {

      showToast("⚠️ اسم العرض مطلوب", "error");

      return;

    }



    setSaving(true);

    try {

      const row = {

        id: form.id || Date.now(),

        name: form.name.trim(),

        type: form.type,

        active: form.active !== undefined ? form.active : true,

        buy_qty: parseInt(form.buy_qty) || 3,

        get_qty: parseInt(form.get_qty) || 1,

        discount_value: parseFloat(form.discount_value) || 0,

        product_ids: JSON.stringify(form.product_ids || []),

        min_amount: parseFloat(form.min_amount) || 0,

        description: form.description || "",

        image: form.image || null,

        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,

        tier_qty: parseInt(form.tier_qty) || 1,

        tier_type: form.tier_type || "percent",

        tier_value: parseFloat(form.tier_value) || 0,

        region: form.region || null,

        created_at: form.id ? undefined : new Date().toISOString(),

      };



      if (!form.id) delete row.created_at;



      const { error } = await supabase.from("promotions").upsert(row);



      if (error) {

        console.error("❌ خطأ في حفظ العرض:", error);

        showToast("❌ خطأ: " + error.message, "error");

        return;

      }



      await logActivity(

        form.id ? "تعديل عرض" : "إضافة عرض",

        `${form.id ? "تم تعديل" : "تم إضافة"} العرض: ${form.name}`

      );



      showToast(form.id ? "✅ تم التعديل" : "✅ تمت الإضافة");



      setForm({

        id: "",

        name: "",

        type: "percent",

        active: true,

        buy_qty: 3,

        get_qty: 1,

        discount_value: 0,

        product_ids: [],

        min_amount: 0,

        description: "",

        end_date: "",

        image: "",

        region: "",

      });

      setProdSearch("");

      await load();

    } catch (err) {

      console.error("❌ خطأ:", err);

      showToast("❌ حدث خطأ غير متوقع", "error");

    } finally {

      setSaving(false);

    }

  };



  const edit = (p) =>

    setForm({

      id: p.id,

      name: p.name,

      type: p.type,

      active: p.active,

      buy_qty: p.buy_qty || 3,

      get_qty: p.get_qty || 1,

      discount_value: p.discount_value || 0,

      product_ids: typeof p.product_ids === "string" ? JSON.parse(p.product_ids || "[]") : (p.product_ids || []),

      min_amount: p.min_amount || 0,

      description: p.description || "",

      end_date: p.end_date?.split("T")[0] || "",

      image: p.image || "",

      region: p.region || "",

    });



  // ✅ حذف العرض → سلة المهملات

  const del = async (id) => {

    await softDelete("promotions", id, promos, setPromos, load, showToast, askConfirm);

  };



  const toggleActive = async (id, val) => {

    try {

      const { error } = await supabase.from("promotions").update({ active: val }).eq("id", id);

      if (error) {

        console.error("❌ خطأ:", error);

        showToast("❌ خطأ: " + error.message, "error");

        return;

      }

      await logActivity(val ? "تفعيل عرض" : "إيقاف عرض", `تم ${val ? "تفعيل" : "إيقاف"} العرض`);

      await load();

      showToast(val ? "✅ تم تفعيل العرض" : "⏸️ تم إيقاف العرض");

    } catch (err) {

      console.error("❌ خطأ:", err);

      showToast("❌ خطأ في التحديث", "error");

    }

  };



  const typeLabel = {

    percent: "خصم نسبة %",

    fixed: "خصم مبلغ ثابت",


    tier_discount: "خصم حسب الرتبة",


  };



  return (

    <div>

      {ToastUI}

      {ConfirmUI}

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        🎯 إدارة العروض

      </h1>



      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          {form.id ? "✏️ تعديل" : "➕ إنشاء"} عرض

        </h3>



        <div style={S.grid2}>

          <div>

            <label style={S.label}>اسم العرض *</label>

            <input style={S.input} value={form.name} onChange={F("name")} placeholder="مثال: عرض الصيف" />

          </div>

          <div>

            <label style={S.label}>نوع العرض</label>

            <select style={S.input} value={form.type} onChange={F("type")}>

              <option value="percent">خصم نسبة %</option>

              <option value="fixed">خصم مبلغ ثابت</option>

              
              
            </select>

          </div>

          <div>

            <label style={S.label}>تاريخ الانتهاء</label>

            <input style={S.input} type="datetime-local" value={form.end_date} onChange={F("end_date")} />

          </div>

          <div>

            <label style={S.label}>الحد الأدنى للطلب</label>

            <NumInput value={form.min_amount} onChange={F("min_amount")} />

          </div>

          <div>

            <label style={S.label}>المنطقة</label>

            <input style={S.input} value={form.region} onChange={F("region")} placeholder="مثال: الجزائر العاصمة" />

          </div>

        </div>



        {form.type === "percent" && (

          <div style={{ marginTop: 12 }}>

            <label style={S.label}>نسبة الخصم %</label>

            <NumInput value={form.discount_value} onChange={F("discount_value")} placeholder="مثال: 20" />

          </div>

        )}

        {form.type === "fixed" && (

          <div style={{ marginTop: 12 }}>

            <label style={S.label}>مبلغ الخصم (دج)</label>

            <NumInput value={form.discount_value} onChange={F("discount_value")} />

          </div>

        )}

         />

            </div>

            <div>

              <label style={S.label}>خذ كم مجاناً؟</label>

              <NumInput value={form.get_qty} onChange={F("get_qty")} />

            </div>

            <div style={{ padding: "14px 0", fontSize: 14, color: CLR.textSm, alignSelf: "flex-end" }}>

              ← أي منتج من الأرخص يكون مجاناً

            </div>

          </div>

        )}



        <div style={{ marginTop: 12 }}>

          <label style={S.label}>وصف العرض (يظهر للزبون)</label>

          <input style={S.input} value={form.description} onChange={F("description")} placeholder="مثال: عند شراء 3 منتجات تحصل على الرابع مجاناً!" />

        </div>

        <div style={ marginTop: 12 }>
          <label style={S.label}>صورة بانر العرض (1200×400)</label>

          <input style={S.input} type="file" accept="image/*" onChange={handleImg} />

          {form.image && (

            <img

              src={form.image}

              style={{

                width: "100%",

                height: 80,

                objectFit: "cover",

                borderRadius: 10,

                marginTop: 6,

              }}

            />

          )}

        </div>



         />

              </div>

              <div>

                <label style={S.label}>نوع الخصم</label>

                <select style={S.input} value={form.tier_type} onChange={F("tier_type")}>

                  <option value="percent">نسبة %</option>

                  <option value="fixed">مبلغ ثابت</option>

                </select>

              </div>

              <div>

                <label style={S.label}>قيمة الخصم</label>

                <NumInput value={form.tier_value} onChange={F("tier_value")} />

              </div>

            </div>

            <p style={{ fontSize: 12, color: CLR.textSm, marginTop: 8 }}>

              مثال: اشتري {form.tier_qty} كرتون من نفس الشركة → {form.tier_value}

              {form.tier_type === "percent" ? "%" : " " + CUR} خصم

            </p>

          </div>

        )}



        <div style={{ marginTop: 14 }}>

          <label style={{ ...S.label, marginBottom: 8 }}>

            🔍 المنتجات المشمولة بالعرض

          </label>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>

            <input

              style={{ ...S.input, flex: 1, marginBottom: 0 }}

              placeholder="🔍 ابحث عن منتج..."

              value={prodSearch}

              onChange={(e) => setProdSearch(e.target.value)}

            />

            <button

              style={{ ...S.btnSm, background: CLR.accent, color: "white", padding: "6px 14px" }}

              onClick={() => {

                const vis = products.filter(

                  (p) => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase())

                );

                const visIds = vis.map((p) => p.id);

                const allSel = visIds.every(

                  (id) => form.product_ids.includes(id) || form.product_ids.includes(String(id))

                );

                setForm((f) => ({

                  ...f,

                  product_ids: allSel

                    ? f.product_ids.filter(

                        (x) => !visIds.includes(x) && !visIds.map(String).includes(String(x))

                      )

                    : [...new Set([...f.product_ids, ...visIds])],

                }));

              }}

            >

              تحديد الكل

            </button>

            {form.product_ids.length > 0 && (

              <button

                style={{ ...S.btnSm, background: "#FEE2E2", color: CLR.danger }}

                onClick={() => setForm((f) => ({ ...f, product_ids: [] }))}

              >

                إلغاء الكل

              </button>

            )}

          </div>

          <div

            style={{

              maxHeight: 280,

              overflowY: "auto",

              border: `1.5px solid ${CLR.border}`,

              borderRadius: 10,

              background: "white",

            }}

          >

            {products.length === 0 ? (

              <div style={{ padding: 24, textAlign: "center", color: CLR.textSm }}>

                ⏳ جاري تحميل المنتجات...

              </div>

            ) : products.filter((p) => {

                if (!prodSearch || prodSearch.trim() === "") return true;

                return p.name?.toLowerCase().includes(prodSearch.toLowerCase());

              }).length === 0 ? (

              <div style={{ padding: 24, textAlign: "center", color: CLR.textSm }}>

                🔍 لا توجد نتائج لـ "{prodSearch}"

              </div>

            ) : (

              products

                .filter((p) => {

                  if (!prodSearch || prodSearch.trim() === "") return true;

                  return p.name?.toLowerCase().includes(prodSearch.toLowerCase());

                })

                .map((p, i) => {

                  const sel = form.product_ids.includes(p.id) || form.product_ids.includes(String(p.id));

                  return (

                    <label

                      key={p.id}

                      onClick={() => toggleProduct(p.id)}

                      style={{

                        display: "flex",

                        alignItems: "center",

                        gap: 10,

                        padding: "10px 12px",

                        cursor: "pointer",

                        background: sel ? "#FFF7ED" : i % 2 === 0 ? "white" : CLR.bg,

                        borderBottom: `1px solid ${CLR.border}`,

                      }}

                    >

                      <input

                        type="checkbox"

                        checked={sel}

                        onChange={() => {}}

                        style={{ accentColor: CLR.accent, width: 16, height: 16, cursor: "pointer" }}

                      />

                      {p.image ? (

                        <img

                          src={p.image}

                          style={{

                            width: 38,

                            height: 38,

                            borderRadius: 8,

                            objectFit: "cover",

                            border: `1px solid ${CLR.border}`,

                          }}

                        />

                      ) : (

                        <div

                          style={{

                            width: 38,

                            height: 38,

                            borderRadius: 8,

                            background: CLR.bg,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            fontSize: 20,

                          }}

                        >

                          📦

                        </div>

                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>

                        <div

                          style={{

                            fontSize: 13,

                            fontWeight: sel ? 700 : 500,

                            color: sel ? CLR.accent : CLR.text,

                            overflow: "hidden",

                            whiteSpace: "nowrap",

                            textOverflow: "ellipsis",

                          }}

                        >

                          {p.name}

                        </div>

                        <div style={{ fontSize: 11, color: CLR.textSm, marginTop: 1 }}>

                          💰 {p.price} {CUR} | 📦 {p.stock || 0} كرتون

                        </div>

                      </div>

                      {sel && (

                        <div

                          style={{

                            background: CLR.accent,

                            color: "white",

                            borderRadius: "50%",

                            width: 22,

                            height: 22,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            fontSize: 12,

                            fontWeight: 900,

                          }}

                        >

                          ✓

                        </div>

                      )}

                    </label>

                  );

                })

            )}

          </div>

          <div

            style={{

              marginTop: 8,

              fontSize: 12,

              fontWeight: 700,

              color: form.product_ids.length > 0 ? CLR.success : CLR.textSm,

            }}

          >

            {form.product_ids.length > 0

              ? `✅ ${form.product_ids.length} منتج محدد`

              : "📦 لم يُحدَّد أي منتج — العرض يشمل جميع المنتجات"}

          </div>

        </div>



        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>

          <input

            type="checkbox"

            id="active"

            checked={form.active}

            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}

          />

          <label htmlFor="active" style={{ fontWeight: 700, cursor: "pointer" }}>

            ⚡ تفعيل العرض فور الحفظ

          </label>

        </div>



        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>

          <button style={S.btn} onClick={save} disabled={saving}>

            {saving ? "⏳..." : "💾 حفظ العرض"}

          </button>

          <button

            style={S.btnGray}

            onClick={() =>

              setForm({

                id: "",

                name: "",

                type: "percent",

                active: true,

                buy_qty: 3,

                get_qty: 1,

                discount_value: 0,

                product_ids: [],

                min_amount: 0,

                description: "",

                end_date: "",

                image: "",

                region: "",

              })

            }

          >

            ✖ إلغاء

          </button>

        </div>

      </div>



      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14 }}>العروض الحالية ({promos.length})</h3>

        {promos.length === 0 && (

          <p style={{ textAlign: "center", color: CLR.textSm, padding: 24 }}>لا توجد عروض</p>

        )}

        {promos.map((p) => {

          const pids = typeof p.product_ids === "string" ? JSON.parse(p.product_ids || "[]") : (p.product_ids || []);

          const isExpired = p.end_date && new Date(p.end_date) < new Date();

          return (

            <div

              key={p.id}

              style={{

                background: p.active && !isExpired ? "#f0fdf4" : "#f8fafc",

                borderRadius: 14,

                padding: 14,

                marginBottom: 10,

                border: `1px solid ${p.active && !isExpired ? "#10b981" : "#e2e8f0"}`,

              }}

            >

              <div

                style={{

                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "flex-start",

                  flexWrap: "wrap",

                  gap: 8,

                }}

              >

                <div>

                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>

                  <div style={{ fontSize: 12, color: CLR.textSm, marginTop: 2 }}>

                    {typeLabel[p.type] || p.type}

                  </div>

                  {p.description && (

                    <div

                      style={{

                        fontSize: 12,

                        color: CLR.textSm,

                        marginTop: 4,

                        fontStyle: "italic",

                      }}

                    >

                      "{p.description}"

                    </div>

                  )}

                  {p.end_date && (

                    <div

                      style={{

                        fontSize: 11,

                        color: isExpired ? "#ef4444" : "#f59e0b",

                        marginTop: 2,

                      }}

                    >

                      {isExpired ? "⏰ انتهى" : "⏳ ينتهي"}:{" "}

                      {new Date(p.end_date).toLocaleDateString("ar-DZ")}

                    </div>

                  )}

                  {p.region && (

                    <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}>

                      📍 {p.region}

                    </div>

                  )}

                  <div style={{ fontSize: 11, color: CLR.textSm, marginTop: 4 }}>

                    {pids.length === 0

                      ? "📦 يشمل كل المنتجات"

                      : `📦 ${pids.length} منتج محدد`}

                  </div>

                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>

                  <span

                    style={{

                      padding: "3px 10px",

                      borderRadius: 20,

                      fontSize: 12,

                      fontWeight: 700,

                      background:

                        p.active && !isExpired

                          ? "#d1fae5"

                          : isExpired

                          ? "#fee2e2"

                          : "#fef9c3",

                      color:

                        p.active && !isExpired

                          ? "#059669"

                          : isExpired

                          ? "#dc2626"

                          : "#92400e",

                    }}

                  >

                    {isExpired ? "منتهي" : p.active ? "✅ فعّال" : "⏸️ موقوف"}

                  </span>

                  <button

                    style={{

                      ...S.btnSm,

                      background: p.active ? "#fef9c3" : "#d1fae5",

                      color: p.active ? "#92400e" : "#059669",

                    }}

                    onClick={() => toggleActive(p.id, !p.active)}

                  >

                    {p.active ? "⏸️ إيقاف" : "▶️ تفعيل"}

                  </button>

                  <button

                    style={{ ...S.btnSm, background: "#dbeafe", color: "#1d4ed8" }}

                    onClick={() => edit(p)}

                  >

                    ✏️

                  </button>

                  <button

                    style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }}

                    onClick={() => del(p.id)}

                  >

                    🗑️

                  </button>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════

   🔔 الإشعارات

══════════════════════════════════════════ */

