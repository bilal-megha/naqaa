import { useState, useEffect, useRef, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

const hashPwd = p => CryptoJS.SHA256(p || "").toString()

export default function Customers() {

  const [showToast, ToastUI] = useToast();

  const [askConfirm, ConfirmUI] = useConfirm();

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const [tierSettings, setTierSettings] = useState({ m1: 0, m2: 5000, m3: 20000, d1: 0, d2: 5, d3: 10 });

  const [form, setForm] = useState({

    id: "",

    name: "",

    email: "",

    phone: "",

    address: "",

    wilaya: "",

    activite: "",

    rc: "",

    nif: "",

    nis: "",

    art: "",

    password: "",

    tier: "M1",

    group: "",

  });

  const [tierFilter, setTierFilter] = useState("all");

  const [groupFilter, setGroupFilter] = useState("all");

  const [groups, setGroups] = useState([]);



  const load = async () => {

    const { data } = await supabase.from("customers").select("*").order("name");

    setItems(data || []);

    const uniqueGroups = [...new Set((data || []).map((c) => c.group).filter(Boolean))];

    setGroups(uniqueGroups);

  };

  useEffect(() => {

    load();

    supabase

      .from("settings")

      .select("*")

      .in("key", [

        "tier_m2_min",

        "tier_m3_min",

        "tier_m1_discount",

        "tier_m2_discount",

        "tier_m3_discount",

      ])

      .then(({ data }) => {

        if (!data) return;

        const m = {};

        data.forEach((r) => (m[r.key] = parseFloat(r.value)));

        setTierSettings({

          m1: 0,

          m2: m["tier_m2_min"] || 5000,

          m3: m["tier_m3_min"] || 20000,

          d1: m["tier_m1_discount"] || 0,

          d2: m["tier_m2_discount"] || 5,

          d3: m["tier_m3_discount"] || 10,

        });

      });

  }, []);



  const F = (k) => (e) => {

    const value = e.target.value;

    if (k === "phone" && !/^[0-9+]*$/.test(value) && value !== "") return;

    setForm((f) => ({ ...f, [k]: value }));

  };



  const calculatePoints = (totalAmount) => {

    return Math.floor(totalAmount / 100);

  };



  const pointsToDiscount = (points) => {

    return Math.floor(points / 100);

  };



  const save = async () => {

    if (!form.name.trim()) {

      showToast("الاسم مطلوب", "error");

      return;

    }

    setSaving(true);

    try {

      const ex = items.find((c) => c.id == form.id);

      const { error } = await supabase.from("customers").upsert({

        id: form.id || Date.now(),

        name: form.name.trim(),

        email: form.email,

        phone: form.phone,

        address: form.address,
        wilaya: form.wilaya,
        activite: form.activite,
        rc: form.rc,
        nif: form.nif,
        nis: form.nis,
        art: form.art,

        tier: form.tier,

        group: form.group || null,

        password: form.password ? hashPwd(form.password) : ex?.password || hashPwd("123456"),

        points: ex?.points || 0,

        created_at: ex?.created_at || new Date().toISOString(),

      });

      if (error) {

        showToast("خطأ: " + error.message, "error");

        return;

      }



      await logActivity(

        form.id ? "تعديل عميل" : "إضافة عميل",

        `${form.id ? "تم تعديل" : "تم إضافة"} العميل: ${form.name}`

      );



      showToast(form.id ? "✅ تم التعديل" : "✅ تمت الإضافة");

      setForm({ id: "", name: "", email: "", phone: "", address: "", wilaya: "", activite: "", rc: "", nif: "", nis: "", art: "", password: "", tier: "M1", group: "" });

      await load();

    } catch (err) {

      showToast("❌ خطأ: " + err.message, "error");

    } finally {

      setSaving(false);

    }

  };



  const edit = (c) =>

    setForm({

      id: c.id,

      name: c.name,

      email: c.email || "",

      phone: c.phone || "",

      address: c.address || "",
      wilaya: c.wilaya || "",
      activite: c.activite || "",
      rc: c.rc || "",
      nif: c.nif || "",
      nis: c.nis || "",
      art: c.art || "",

      password: "",

      tier: c.tier || "M1",

      group: c.group || "",

    });



  // ✅ حذف العميل → سلة المهملات

  const del = async (id) => {

    await softDelete("customers", id, items, setItems, load, showToast, askConfirm);

  };



  const [showDebtModal, setShowDebtModal] = useState(null) // { customer, amount }
  const [debtPayment, setDebtPayment] = useState('')

  const payDebt = async () => {
    if (!showDebtModal || !debtPayment) return
    const payment = parseFloat(debtPayment) || 0
    const currentDebt = parseFloat(showDebtModal.customer.debt || 0)
    const orderTotal = parseFloat(showDebtModal.orderTotal || 0)

    let newDebt
    if (orderTotal > 0) {
      // دفع على طلبية: إذا الدفع > قيمة الطلبية → الفارق ينقص من الدين
      if (payment >= orderTotal) {
        const extra = payment - orderTotal
        newDebt = Math.max(0, currentDebt - extra)
      } else {
        // الدفع أقل من الطلبية → الفارق يضاف للدين
        newDebt = currentDebt + (orderTotal - payment)
      }
    } else {
      // دفع مباشر على الدين
      newDebt = Math.max(0, currentDebt - payment)
    }

    await supabase.from('customers').update({ debt: newDebt }).eq('id', showDebtModal.customer.id)
    await logActivity('دفع دين', `العميل ${showDebtModal.customer.name}: دفع ${payment} دج، الدين الجديد: ${newDebt} دج`)
    showToast(`✅ تم تسجيل الدفع — الدين المتبقي: ${newDebt.toFixed(2)} دج`)
    setShowDebtModal(null); setDebtPayment(''); await load()
  }

  const addDebt = async (customerId, amount) => {
    const c = items.find(x => x.id == customerId)
    if (!c) return
    const newDebt = parseFloat(c.debt || 0) + parseFloat(amount || 0)
    await supabase.from('customers').update({ debt: newDebt }).eq('id', customerId)
  }





  const filtered = items.filter((c) => {

    const matchName = c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);

    const matchTier = tierFilter === "all" || (c.tier || "M1") === tierFilter;

    const matchGroup = groupFilter === "all" || c.group === groupFilter;

    return matchName && matchTier && matchGroup;

  });



  return (

    <div>

      {ToastUI}

      {ConfirmUI}

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        👥 العملاء

      </h1>



      <div

        style={{

          ...S.card,

          background: "linear-gradient(135deg,#fffbeb,#fef3c7)",

          border: "1px solid #fcd34d",

        }}

      >

        <h3 style={{ fontWeight: 800, marginBottom: 12, color: "#92400e" }}>

          🏅 إعدادات تصنيف العملاء

        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>

          {[

            { tier: "M1", label: "🥉 M1 عادي", min: 0, disc: tierSettings.d1, color: CLR.textSm },

            { tier: "M2", label: "🥈 M2 مميز", min: tierSettings.m2, disc: tierSettings.d2, color: "#3b82f6" },

            { tier: "M3", label: "🥇 M3 VIP", min: tierSettings.m3, disc: tierSettings.d3, color: "#f59e0b" },

          ].map(({ tier, label, min, disc, color }) => (

            <div

              key={tier}

              style={{

                background: "white",

                borderRadius: 12,

                padding: 12,

                textAlign: "center",

                border: `2px solid ${color}`,

              }}

            >

              <div style={{ fontWeight: 800, color, marginBottom: 4 }}>{label}</div>

              <div style={{ fontSize: 13, color: CLR.textSm }}>من {min} {CUR}</div>

              <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>خصم {disc}%</div>

            </div>

          ))}

        </div>

        <p style={{ fontSize: 12, color: "#92400e", marginTop: 10 }}>

          💡 لتعديل حدود الرتب اذهب إلى ⚙️ الإعدادات → تصنيف العملاء

        </p>

      </div>



      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, color: "#dc2626" }}>

          {form.id ? "✏️ تعديل" : "➕ إضافة"} عميل

        </h3>

        {/* ── القسم 1: المعلومات الأساسية ── */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1565C0', marginBottom: 12 }}>👤 المعلومات الأساسية</div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>الاسم / CLIENT *</label>
              <input style={S.input} value={form.name} onChange={F("name")} placeholder="مثال: MAHDI SAID" />
            </div>
            <div>
              <label style={S.label}>النشاط / ACTIVITE</label>
              <input style={S.input} value={form.activite} onChange={F("activite")} placeholder="نوع النشاط التجاري" />
            </div>
            <div>
              <label style={S.label}>الهاتف / TEL</label>
              <PhoneInput value={form.phone} onChange={F("phone")} placeholder="مثال: 0555123456" />
            </div>
            <div>
              <label style={S.label}>البريد الإلكتروني</label>
              <input style={S.input} value={form.email} onChange={F("email")} placeholder="exemple@mail.com" />
            </div>
          </div>
        </div>

        {/* ── القسم 2: العنوان ── */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1565C0', marginBottom: 12 }}>📍 العنوان / ADRESSE</div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>العنوان التفصيلي</label>
              <input style={S.input} value={form.address} onChange={F("address")} placeholder="مثال: DOUFANA - OULED FADEL" />
            </div>
            <div>
              <label style={S.label}>الولاية / WILAYA</label>
              <input style={S.input} value={form.wilaya} onChange={F("wilaya")} placeholder="مثال: BATNA, ALGERIE" />
            </div>
          </div>
        </div>

        {/* ── القسم 3: المعرفات الجبائية ── */}
        <div style={{ background: '#fffbeb', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #fcd34d' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#92400e', marginBottom: 12 }}>🏛️ المعرفات الجبائية (اختياري)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>RC N°</label>
              <input style={S.input} value={form.rc} onChange={F("rc")} placeholder="مثال: 05/00-1191251A18" />
            </div>
            <div>
              <label style={S.label}>NIF N°</label>
              <input style={S.input} value={form.nif} onChange={F("nif")} placeholder="مثال: 199005500015930" />
            </div>
            <div>
              <label style={S.label}>NIS N°</label>
              <input style={S.input} value={form.nis} onChange={F("nis")} placeholder="NIS..." />
            </div>
            <div>
              <label style={S.label}>N° Art.</label>
              <input style={S.input} value={form.art} onChange={F("art")} placeholder="مثال: 05310025119" />
            </div>
          </div>
        </div>

        {/* ── القسم 4: إعدادات الحساب ── */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#1565C0', marginBottom: 12 }}>⚙️ إعدادات الحساب</div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>الرتبة</label>
              <select style={S.input} value={form.tier} onChange={F("tier")}>
                <option value="M1">🥉 M1 — عميل عادي</option>
                <option value="M2">🥈 M2 — عميل مميز</option>
                <option value="M3">🥇 M3 — عميل VIP</option>
              </select>
            </div>
            <div>
              <label style={S.label}>المجموعة</label>
              <input style={S.input} value={form.group} onChange={F("group")} placeholder="مثال: ولاية باتنة" />
            </div>
            <div>
              <label style={S.label}>كلمة المرور</label>
              <input style={S.input} type="password" value={form.password} onChange={F("password")} placeholder="اتركه فارغاً للإبقاء على الحالية" />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>

          <button style={S.btn} onClick={save} disabled={saving}>

            {saving ? "⏳..." : "💾 حفظ"}

          </button>

          <button

            style={S.btnGray}

            onClick={() =>

              setForm({

                id: "",

                name: "",

                email: "",

                phone: "",

                address: "",

                password: "",

                tier: "M1",

                group: "",

              })

            }

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

            alignItems: "center",

          }}

        >

          <h3 style={{ fontWeight: 800, fontSize: 15 }}>

            العملاء

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

              style={{ ...S.input, width: 200 }}

              placeholder="🔍 اسم / هاتف..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

            />

            <select

              style={{ ...S.input, width: 110 }}

              value={tierFilter || "all"}

              onChange={(e) => setTierFilter(e.target.value)}

            >

              <option value="all">كل الرتب</option>

              <option value="M1">🥉 M1</option>

              <option value="M2">🥈 M2</option>

              <option value="M3">🥇 M3</option>

            </select>

            <select

              style={{ ...S.input, width: 130 }}

              value={groupFilter || "all"}

              onChange={(e) => setGroupFilter(e.target.value)}

            >

              <option value="all">كل المجموعات</option>

              {groups.map((g) => (

                <option key={g} value={g}>

                  {g}

                </option>

              ))}

            </select>

          </div>

        </div>

        <div style={{ overflowX: "auto" }}>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead>

              <tr style={{ background: CLR.bg }}>

                <th style={S.th}>الاسم</th>

                <th style={S.th}>الهاتف</th>

                <th style={S.th}>الولاية</th>

                <th style={S.th}>الرتبة</th>

                <th style={S.th}>المجموعة</th>

                <th style={S.th}>المشتريات</th>

                <th style={S.th}>النقاط</th>

                <th style={{ ...S.th, color: '#dc2626', background: '#fff1f2' }}>💰 الدين (كريدي)</th>

                <th style={S.th}>إجراءات</th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((c, i) => {

                const ts = {

                  M1: { bg: "#F1F5F9", color: CLR.textSm },

                  M2: { bg: "#DBEAFE", color: "#1D4ED8" },

                  M3: { bg: "#FEF9C3", color: "#92400E" },

                }[c.tier || "M1"];

                return (

                  <tr

                    key={c.id}

                    style={{

                      background: i % 2 === 0 ? "white" : CLR.bg,

                      cursor: "pointer",

                      transition: "background .15s",

                    }}

                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF7ED")}

                    onMouseLeave={(e) =>

                      (e.currentTarget.style.background = i % 2 === 0 ? "white" : CLR.bg)

                    }

                    onClick={() => edit(c)}

                  >

                    <td style={{ ...S.td, fontWeight: 700 }}>

                      <div>{c.name}</div>

                      {c.email && <div style={{ fontSize: 11, color: CLR.textSm }}>{c.email}</div>}

                    </td>

                    <td style={{ ...S.td, color: CLR.textSm }}>{c.phone || "—"}</td>

                    <td style={{ ...S.td, color: CLR.textSm }}>{(c.address || "—").split(",")[0]}</td>

                    <td style={S.td}>

                      <span

                        style={{

                          padding: "3px 10px",

                          borderRadius: 20,

                          fontSize: 11,

                          fontWeight: 700,

                          background: ts?.bg,

                          color: ts?.color,

                        }}

                      >

                        {tierLabel(c.tier || "M1")}

                      </span>

                    </td>

                    <td style={{ ...S.td, color: CLR.textSm }}>{c.group || "—"}</td>

                    <td style={{ ...S.td, fontWeight: 700, color: CLR.accent }}>

                      {Number(c.total_purchases || 0).toFixed(0)} {CUR}

                    </td>

                    <td style={{ ...S.td, color: CLR.textSm }}>

                      {c.points || 0} ⭐

                      {c.points > 0 && (

                        <span style={{ fontSize: 10, color: "#10b981", marginRight: 4 }}>

                          (خصم {pointsToDiscount(c.points)}%)

                        </span>

                      )}

                    </td>

                    <td style={{ ...S.td, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {parseFloat(c.debt || 0) > 0 ? (
                        <div>
                          <div style={{ fontWeight: 900, color: '#dc2626', fontSize: 14 }}>
                            {Number(c.debt || 0).toFixed(2)} {CUR}
                          </div>
                          <button
                            style={{ ...S.btnSm, background: '#dcfce7', color: '#16a34a', marginTop: 4, fontSize: 11 }}
                            onClick={() => setShowDebtModal({ customer: c, orderTotal: 0 })}>
                            💵 تسديد
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>✅ لا دين</span>
                      )}
                    </td>

                    <td style={S.td} onClick={(e) => e.stopPropagation()}>

                      <div style={{ display: "flex", gap: 4 }}>

                        <button

                          style={{ ...S.btnSm, background: "#DBEAFE", color: "#1D4ED8" }}

                          onClick={() => edit(c)}

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

                );

              })}

              {filtered.length === 0 && (

                <tr>

                  <td colSpan={9} style={{ textAlign: "center", padding: 36, color: CLR.textSm }}>

                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>

                    لا يوجد عملاء

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ── مودال تسديد الدين ── */}
      {showDebtModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 400, maxWidth: '95vw', direction: 'rtl' }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: '#dc2626' }}>💰 تسديد الدين</h3>
            <div style={{ background: '#fff1f2', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>👤 {showDebtModal.customer.name}</div>
              <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>
                الدين الحالي: <strong>{Number(showDebtModal.customer.debt || 0).toFixed(2)} {CUR}</strong>
              </div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#16a34a' }}>
              <strong>💡 كيف يعمل الحساب:</strong><br />
              • إذا دفع أكثر من الطلبية → الفارق ينقص من الدين<br />
              • إذا دفع أقل → الفارق يضاف للدين<br />
              • إذا لا توجد طلبية → المبلغ ينقص مباشرة من الدين
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>المبلغ المدفوع (دج) *</label>
              <input type="number" style={{ ...S.input, fontSize: 18, fontWeight: 700 }}
                value={debtPayment} onChange={e => setDebtPayment(e.target.value)}
                placeholder="أدخل المبلغ..." autoFocus />
            </div>
            {debtPayment && (
              <div style={{ background: '#fef9c3', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                {(() => {
                  const payment = parseFloat(debtPayment) || 0
                  const currentDebt = parseFloat(showDebtModal.customer.debt || 0)
                  const newDebt = Math.max(0, currentDebt - payment)
                  return <>
                    <div>الدين الحالي: <strong>{currentDebt.toFixed(2)} {CUR}</strong></div>
                    <div>المبلغ المدفوع: <strong style={{ color: '#16a34a' }}>- {payment.toFixed(2)} {CUR}</strong></div>
                    <div style={{ borderTop: '1px solid #fcd34d', marginTop: 6, paddingTop: 6, fontWeight: 900, color: newDebt > 0 ? '#dc2626' : '#16a34a' }}>
                      الدين المتبقي: {newDebt.toFixed(2)} {CUR} {newDebt === 0 ? '✅' : ''}
                    </div>
                  </>
                })()}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btn} onClick={payDebt} disabled={!debtPayment}>✅ تأكيد الدفع</button>
              <button style={S.btnGray} onClick={() => { setShowDebtModal(null); setDebtPayment('') }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )

}

/* ══════════════════════════════════════════

   👔 الموظفون (مع صلاحيات تفصيلية)

══════════════════════════════════════════ */

const ALL_PERMISSIONS = [

  { id:'dashboard',    label:'📊 لوحة القيادة', actions: ['view'] },

  { id:'products',     label:'📦 المنتجات', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'categories',   label:'📂 الفئات', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'brands',       label:'🏷️ العلامات التجارية', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'suppliers',    label:'🏭 الموردون', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'customers',    label:'👥 العملاء', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'coupons',      label:'🎟️ الكوبونات', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'purchases',    label:'🛒 المشتريات', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'inventory',    label:'🗂️ المخزون', actions: ['view', 'edit'] },

  { id:'orders',       label:'📋 الطلبيات', actions: ['view', 'edit', 'delete'] },

  { id:'promotions',   label:'🎯 العروض', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'notifications',label:'🔔 الإشعارات', actions: ['view', 'add'] },

  { id:'reports',      label:'📈 التقارير', actions: ['view'] },

  { id:'expenses',     label:'💸 المصاريف', actions: ['view', 'add', 'edit', 'delete'] },

  { id:'activityLog',  label:'📋 سجل النشاطات', actions: ['view'] },

  { id:'storeManager', label:'🎨 إدارة المتجر', actions: ['view', 'edit'] },

  { id:'recycle',      label:'🗑️ سلة المهملات', actions: ['view', 'restore', 'delete'] },

]



