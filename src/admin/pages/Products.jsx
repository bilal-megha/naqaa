import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Products() {

  const [showToast, ToastUI] = useToast();

  const [askConfirm, ConfirmUI] = useConfirm();

  const [products, setProducts] = useState([]);

  const [brands, setBrands] = useState([]);

  const [categories, setCategories] = useState([]);

  const [selCats, setSelCats] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [brandFilter, setBrandFilter] = useState("");

  const [stockFilter, setStockFilter] = useState("all");

  const [form, setForm] = useState({

    id: "",

    name: "",

    price: "",

    costPrice: "",

    cartonPrice: "",

    units: 12,

    stock: 0,

    minStock: 5,

    sku: "",

    brandId: "",

    image: "",

    discount: 0,

    isPromo: false,

    description: "",

  });



  const load = useCallback(async () => {

    setLoading(true);

    try {

      const [{ data: p }, { data: b }, { data: c }] = await Promise.all([

        supabase.from("products").select("*").order("name"),

        supabase.from("brands").select("*").order("name"),

        supabase.from("categories").select("*").order("name"),

      ]);

      setProducts(p || []);

      setBrands(b || []);

      setCategories(c || []);

    } catch (err) {

      console.error("❌ خطأ في تحميل المنتجات:", err);

      showToast("❌ خطأ في تحميل المنتجات", "error");

    } finally {

      setLoading(false);

    }

  }, [showToast]);



  useEffect(() => {

    load();

  }, []);



  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleImg = (e) => {

    const r = new FileReader();

    r.onload = (ev) => setForm((f) => ({ ...f, image: ev.target.result }));

    r.readAsDataURL(e.target.files[0]);

  };



  const generateBarcode = (id) => {

    return `NAQ-${String(id).padStart(6, "0")}`;

  };



  const save = async () => {

    if (!form.name.trim() || !form.price) {

      showToast("الاسم والسعر مطلوبان", "error");

      return;

    }

    setSaving(true);

    try {

      const row = {

        id: form.id || Date.now(),

        name: form.name.trim(),

        price: parseFloat(form.price) || 0,

        cost_price: parseFloat(form.costPrice) || 0,

        carton_price: form.cartonPrice ? parseFloat(form.cartonPrice) : null,

        units: parseInt(form.units) || 12,

        stock: parseInt(form.stock) || 0,

        min_stock: parseInt(form.minStock) || 5,

        sku: form.sku || generateBarcode(form.id || Date.now()),

        brand_id: form.brandId ? parseInt(form.brandId) : null,

        image: form.image || null,

        is_promo: form.isPromo,

        description: form.description || "",

        discount: parseFloat(form.discount) || 0,

        disabled: false,

        created_at: form.id ? undefined : new Date().toISOString(),

      };

      if (!form.id) delete row.created_at;

      const { error } = await supabase.from("products").upsert(row);

      if (error) {

        showToast("خطأ: " + error.message, "error");

        return;

      }

      if (form.id)

        await supabase.from("product_categories").delete().eq("product_id", row.id);

      if (selCats.length > 0) {

        await supabase

          .from("product_categories")

          .upsert(

            selCats.map((cid) => ({

              id: Date.now() + Math.random(),

              product_id: row.id,

              category_id: cid,

            }))

          )

          .catch(() => {});

      }



      await logActivity(

        form.id ? "تعديل منتج" : "إضافة منتج",

        `${form.id ? "تم تعديل" : "تم إضافة"} المنتج: ${form.name}`

      );



      showToast(form.id ? "✅ تم التعديل" : "✅ تمت الإضافة");

      setForm({

        id: "",

        name: "",

        price: "",

        costPrice: "",

        cartonPrice: "",

        units: 12,

        stock: 0,

        minStock: 5,

        sku: "",

        brandId: "",

        image: "",

        discount: 0,

        isPromo: false,

        description: "",

      });

      setSelCats([]);

      await load();

    } catch (err) {

      console.error("❌ خطأ:", err);

      showToast("❌ حدث خطأ غير متوقع", "error");

    } finally {

      setSaving(false);

    }

  };



  const edit = async (p) => {

    setForm({

      id: p.id,

      name: p.name,

      price: p.price || "",

      costPrice: p.cost_price || "",

      cartonPrice: p.carton_price || "",

      units: p.units || 12,

      stock: p.stock || 0,

      minStock: p.min_stock || 5,

      sku: p.sku || generateBarcode(p.id),

      brandId: p.brand_id || "",

      image: p.image || "",

      discount: p.discount || 0,

      isPromo: p.is_promo || false,

      description: p.description || "",

    });

    const { data } = await supabase

      .from("product_categories")

      .select("category_id")

      .eq("product_id", p.id);

    setSelCats((data || []).map((r) => r.category_id));

  };



  // ✅ حذف المنتج → سلة المهملات

  const del = async (id) => {

    await softDelete("products", id, products, setProducts, load, showToast, askConfirm);

  };



  const toggleCat = (id) =>

    setSelCats((prev) =>

      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]

    );



  const filtered = products.filter((p) => {

    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());

    const matchBrand = !brandFilter || p.brand_id == brandFilter;

    const matchStock =

      stockFilter === "all" ||

      (stockFilter === "low" && (p.stock || 0) < 5) ||

      (stockFilter === "ok" && (p.stock || 0) >= 5);

    return matchSearch && matchBrand && matchStock;

  });



  return (

    <div>

      {ToastUI}

      {ConfirmUI}

      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>📦 المنتجات</h1>



      <div style={{ ...S.card, background: "#f0f9ff", borderRight: "4px solid #3b82f6" }}>

        <strong style={{ color: "#1d4ed8" }}>📐 أحجام الصور المثالية:</strong>

        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", fontSize: 13 }}>

          <span>📦 منتج: <strong>600×600</strong></span>

          <span>🏷️ ماركة: <strong>300×300</strong></span>

          <span>📂 فئة: <strong>400×300</strong></span>

          <span>🖼️ بانر: <strong>1200×450</strong></span>

        </div>

      </div>



      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          {form.id ? "✏️ تعديل" : "➕ إضافة"} منتج

        </h3>

        <div style={S.grid2}>

          <div>

            <label style={S.label}>اسم المنتج *</label>

            <input style={S.input} value={form.name} onChange={F("name")} placeholder="اسم المنتج" />

          </div>

          <div>

            <label style={S.label}>سعر البيع (قطعة) *</label>

            <NumInput value={form.price} onChange={F("price")} placeholder="0" />

          </div>

          <div>

            <label style={S.label}>سعر الشراء (قطعة)</label>

            <NumInput value={form.costPrice} onChange={F("costPrice")} />

          </div>

          <div>

            <label style={S.label}>سعر الكرتون</label>

            <NumInput value={form.cartonPrice} onChange={F("cartonPrice")} />

          </div>

          <div>

            <label style={S.label}>قطع في الكرتون</label>

            <NumInput value={form.units} onChange={F("units")} />

          </div>

          <div>

            <label style={S.label}>المخزون (قطعة)</label>

            <NumInput value={form.stock} onChange={F("stock")} />

          </div>

          <div>

            <label style={S.label}>خصم % (0 = بدون خصم)</label>

            <NumInput value={form.discount} onChange={F("discount")} placeholder="0" />

          </div>

          <div>

            <label style={S.label}>الباركود / SKU</label>

            <input style={S.input} value={form.sku} onChange={F("sku")} placeholder="اختياري" />

          </div>

          <div>

            <label style={S.label}>العلامة التجارية</label>

            <select style={S.input} value={form.brandId} onChange={F("brandId")}>

              <option value="">-- بدون --</option>

              {brands.map((b) => (

                <option key={b.id} value={b.id}>

                  {b.name}

                </option>

              ))}

            </select>

          </div>

          <div>

            <label style={S.label}>صورة المنتج (600×600)</label>

            <input style={S.input} type="file" accept="image/*" onChange={handleImg} />

          </div>

          {form.image && (

            <div style={{ display: "flex", alignItems: "center" }}>

              <img src={form.image} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12 }} />

            </div>

          )}

        </div>

        <div style={{ marginTop: 14 }}>

          <label style={S.label}>الفئات (يمكن اختيار أكثر من فئة)</label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>

            {categories.map((c) => (

              <button

                key={c.id}

                onClick={() => toggleCat(c.id)}

                style={{

                  ...S.btnSm,

                  background: selCats.includes(c.id) ? "#dc2626" : "#e2e8f0",

                  color: selCats.includes(c.id) ? "white" : "#475569",

                }}

              >

                {selCats.includes(c.id) ? "✓ " : ""}

                {c.name}

              </button>

            ))}

          </div>

        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>

          <input

            type="checkbox"

            id="isPromo"

            checked={form.isPromo}

            onChange={(e) => setForm((f) => ({ ...f, isPromo: e.target.checked }))}

          />

          <label htmlFor="isPromo" style={{ fontWeight: 700, fontSize: 14, cursor: "pointer" }}>

            ⚡ منتج ضمن العروض الخاصة

          </label>

        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>

          <button style={S.btn} onClick={save} disabled={saving}>

            {saving ? "⏳ حفظ..." : "💾 حفظ المنتج"}

          </button>

          <button

            style={S.btnGray}

            onClick={() => {

              setForm({

                id: "",

                name: "",

                price: "",

                costPrice: "",

                cartonPrice: "",

                units: 12,

                stock: 0,

                minStock: 5,

                sku: "",

                brandId: "",

                image: "",

                discount: 0,

                isPromo: false,

                description: "",

              });

              setSelCats([]);

            }}

          >

            ✖ إلغاء

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

            alignItems: "center",

          }}

        >

          <h3 style={{ fontWeight: 800, fontSize: 15 }}>

            قائمة المنتجات

            <span

              style={{

                marginRight: 8,

                background: CLR.bg,

                border: "1px solid #E2E8F0",

                borderRadius: 20,

                padding: "2px 10px",

                fontSize: 12,

                fontWeight: 600,

                color: CLR.textSm,

              }}

            >

              {filtered.length}

            </span>

          </h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

            <input

              style={{ ...S.input, width: 180 }}

              placeholder="🔍 بحث بالاسم..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

            />

            <select

              style={{ ...S.input, width: 130 }}

              value={brandFilter || ""}

              onChange={(e) => setBrandFilter(e.target.value)}

            >

              <option value="">كل الماركات</option>

              {brands.map((b) => (

                <option key={b.id} value={b.id}>

                  {b.name}

                </option>

              ))}

            </select>

            <select

              style={{ ...S.input, width: 120 }}

              value={stockFilter || "all"}

              onChange={(e) => setStockFilter(e.target.value)}

            >

              <option value="all">كل المخزون</option>

              <option value="low">منخفض (&lt;5)</option>

              <option value="ok">متوفر</option>

            </select>

          </div>

        </div>

        {loading ? (

          <div style={{ padding: 40, textAlign: "center" }}>

            {[1, 2, 3, 4].map((i) => (

              <div

                key={i}

                style={{

                  height: 48,

                  background: "#F1F5F9",

                  borderRadius: 8,

                  marginBottom: 8,

                  animation: "pulse 1.5s ease infinite",

                }}

              />

            ))}

          </div>

        ) : (

          <div style={{ overflowX: "auto" }}>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>

              <thead>

                <tr style={{ background: CLR.bg }}>

                  <th style={S.th}>الصورة</th>

                  <th style={S.th}>الاسم</th>

                  <th style={S.th}>السعر</th>

                  <th style={S.th}>الكرتون</th>

                  <th style={S.th}>المخزون</th>

                  <th style={S.th}>الماركة</th>

                  <th style={S.th}>الباركود</th>

                  <th style={S.th}>إجراءات</th>

                </tr>

              </thead>

              <tbody>

                {filtered.map((p, i) => {

                  const stockLvl = (p.stock || 0) < 5 ? "low" : (p.stock || 0) < 20 ? "med" : "ok";

                  const stockStyle = {

                    low: { bg: "#FEE2E2", color: "#DC2626" },

                    med: { bg: "#FEF9C3", color: "#92400E" },

                    ok: { bg: "#D1FAE5", color: "#059669" },

                  }[stockLvl];

                  return (

                    <tr

                      key={p.id}

                      style={{

                        background: i % 2 === 0 ? "white" : CLR.bg,

                        cursor: "pointer",

                        transition: "background .15s",

                      }}

                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF7ED")}

                      onMouseLeave={(e) =>

                        (e.currentTarget.style.background = i % 2 === 0 ? "white" : CLR.bg)

                      }

                      onClick={() => edit(p)}

                    >

                      <td style={S.td}>

                        {p.image ? (

                          <img

                            src={p.image}

                            style={{

                              width: 44,

                              height: 44,

                              objectFit: "cover",

                              borderRadius: 8,

                              border: "1px solid #E2E8F0",

                            }}

                          />

                        ) : (

                          <div

                            style={{

                              width: 44,

                              height: 44,

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

                      </td>

                      <td style={{ ...S.td, fontWeight: 700, maxWidth: 200, color: '#0D1B2A' }}>

                        <div>{p.name}</div>

                        {p.is_promo && (

                          <span

                            style={{

                              background: "#FEF9C3",

                              color: "#92400E",

                              padding: "1px 7px",

                              borderRadius: 20,

                              fontSize: 10,

                              fontWeight: 700,

                            }}

                          >

                            عرض

                          </span>

                        )}

                      </td>

                      <td style={{ ...S.td, fontWeight: 700, color: CLR.accent }}>

                        {p.price} {CUR}

                      </td>

                      <td style={{ ...S.td, color: CLR.textSm }}>

                        {p.carton_price ? `${p.carton_price} ${CUR}` : "—"}

                      </td>

                      <td style={S.td}>

                        <span

                          style={{

                            padding: "3px 10px",

                            borderRadius: 20,

                            fontSize: 11,

                            fontWeight: 700,

                            background: stockStyle.bg,

                            color: stockStyle.color,

                          }}

                        >

                          {p.stock || 0} كرتون

                        </span>

                      </td>

                      <td style={{ ...S.td, color: CLR.textSm }}>

                        {brands.find((b) => b.id == p.brand_id)?.name || "—"}

                      </td>

                      <td style={{ ...S.td, fontSize: 11, color: CLR.textSm }}>

                        <code>{p.sku || generateBarcode(p.id)}</code>

                      </td>

                      <td style={S.td} onClick={(e) => e.stopPropagation()}>

                        <div style={{ display: "flex", gap: 4 }}>

                          <button

                            style={{ ...S.btnSm, background: "#DBEAFE", color: "#1D4ED8" }}

                            onClick={() => edit(p)}

                          >

                            ✏️

                          </button>

                          <button

                            style={{ ...S.btnSm, background: "#FEE2E2", color: "#DC2626" }}

                            onClick={() => del(p.id)}

                          >

                            🗑️

                          </button>

                        </div>

                      </td>

                    </tr>

                  );

                })}

                {filtered.length === 0 && (

                  <tr>

                    <td colSpan={8} style={{ textAlign: "center", padding: 36, color: CLR.textSm }}>

                      <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>

                      لا توجد منتجات

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>



      {/* Modal تعديل المنتج */}

      {form.id && (

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

              borderRadius: 16,

              padding: 24,

              width: "100%",

              maxWidth: 640,

              maxHeight: "90vh",

              overflowY: "auto",

              direction: "rtl",

            }}

          >

            <div

              style={{

                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                marginBottom: 18,

              }}

            >

              <h3 style={{ fontWeight: 900, fontSize: 17 }}>✏️ تعديل: {form.name}</h3>

              <button

                onClick={() => {

                  setForm({

                    id: "",

                    name: "",

                    price: "",

                    costPrice: "",

                    cartonPrice: "",

                    units: 12,

                    stock: 0,

                    minStock: 5,

                    sku: "",

                    brandId: "",

                    image: "",

                    discount: 0,

                    isPromo: false,

                    description: "",

                  });

                  setSelCats([]);

                }}

                style={{

                  background: CLR.bg,

                  border: "none",

                  borderRadius: "50%",

                  width: 32,

                  height: 32,

                  cursor: "pointer",

                  fontSize: 16,

                }}

              >

                ✕

              </button>

            </div>

            <div style={S.grid2}>

              <div>

                <label style={S.label}>اسم المنتج *</label>

                <input style={S.input} value={form.name} onChange={F("name")} />

              </div>

              <div>

                <label style={S.label}>سعر البيع *</label>

                <NumInput value={form.price} onChange={F("price")} />

              </div>

              <div>

                <label style={S.label}>سعر الشراء/قطعة</label>

                <NumInput value={form.costPrice} onChange={F("costPrice")} />

              </div>

              <div>

                <label style={S.label}>سعر الكرتون</label>

                <NumInput value={form.cartonPrice} onChange={F("cartonPrice")} />

              </div>

              <div>

                <label style={S.label}>قطع/كرتون</label>

                <NumInput value={form.units} onChange={F("units")} />

              </div>

              <div>

                <label style={S.label}>المخزون</label>

                <NumInput value={form.stock} onChange={F("stock")} />

              </div>

              <div>

                <label style={S.label}>الحد الأدنى للتنبيه</label>

                <NumInput

                  value={form.minStock}

                  onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}

                />

              </div>

              <div>

                <label style={S.label}>خصم %</label>

                <NumInput value={form.discount} onChange={F("discount")} />

              </div>

              <div>

                <label style={S.label}>العلامة التجارية</label>

                <select style={S.input} value={form.brandId} onChange={F("brandId")}>

                  <option value="">-- بدون --</option>

                  {brands.map((b) => (

                    <option key={b.id} value={b.id}>

                      {b.name}

                    </option>

                  ))}

                </select>

              </div>

              <div>

                <label style={S.label}>صورة جديدة</label>

                <input style={S.input} type="file" accept="image/*" onChange={handleImg} />

              </div>

            </div>

            <div style={{ marginTop: 12 }}>

              <label style={S.label}>الفئات</label>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>

                {categories.map((c) => (

                  <button

                    key={c.id}

                    onClick={() => toggleCat(c.id)}

                    style={{

                      ...S.btnSm,

                      background: selCats.includes(c.id) ? CLR.accent : "#E2E8F0",

                      color: selCats.includes(c.id) ? "white" : CLR.textSm,

                    }}

                  >

                    {selCats.includes(c.id) ? "✓ " : ""}

                    {c.name}

                  </button>

                ))}

              </div>

            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>

              <button style={S.btn} onClick={save} disabled={saving}>

                {saving ? "⏳..." : "💾 حفظ التعديل"}

              </button>

              <button

                style={S.btnGray}

                onClick={() => {

                  setForm({

                    id: "",

                    name: "",

                    price: "",

                    costPrice: "",

                    cartonPrice: "",

                    units: 12,

                    stock: 0,

                    minStock: 5,

                    sku: "",

                    brandId: "",

                    image: "",

                    discount: 0,

                    isPromo: false,

                    description: "",

                  });

                  setSelCats([]);

                }}

              >

                إلغاء

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



/* ══════════════════════════════════════════

   📂 الفئات (مع سلة المهملات)

══════════════════════════════════════════ */

