import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Expenses() {

  const [showToast, ToastUI] = useToast();

  const [askConfirm, ConfirmUI] = useConfirm();

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({

    name: "",

    amount: "",

    date: new Date().toISOString().split("T")[0],

    category: "other",

  });

  const load = async () => {

    try {

      const { data } = await supabase.from("expenses").select("*").order("id", { ascending: false });

      setItems(data || []);

    } catch (err) {

      console.error("❌ خطأ في تحميل المصاريف:", err);

      showToast("❌ خطأ في تحميل المصاريف", "error");

    }

  };

  useEffect(() => {

    load();

  }, []);

  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async () => {

    if (!form.name || !form.amount) {

      showToast("الاسم والمبلغ مطلوبان", "error");

      return;

    }

    setSaving(true);

    try {

      await supabase.from("expenses").insert({

        id: Date.now(),

        name: form.name.trim(),

        amount: parseFloat(form.amount),

        date: form.date,

        category: form.category,

      });

      await logActivity("إضافة مصروف", `تم إضافة مصروف: ${form.name} بقيمة ${form.amount} دج`);

      showToast("✅ تمت الإضافة");

      setForm({

        name: "",

        amount: "",

        date: new Date().toISOString().split("T")[0],

        category: "other",

      });

      await load();

    } catch (err) {

      showToast("❌ خطأ: " + err.message, "error");

    } finally {

      setSaving(false);

    }

  };

  const del = async (id) => {

    if (!(await askConfirm("حذف؟"))) return;

    try {

      await supabase.from("expenses").delete().eq("id", id);

      await logActivity("حذف مصروف", `تم حذف المصروف`);

      showToast("تم الحذف");

      await load();

    } catch (err) {

      showToast("❌ خطأ: " + err.message, "error");

    }

  };

  const catLabel = { rent: "إيجار", salary: "رواتب", utilities: "فواتير", other: "أخرى" };

  const filtered = items.filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()));

  const total = items.reduce((s, e) => s + Number(e.amount), 0);

  return (

    <div>

      {ToastUI}

      {ConfirmUI}

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        💸 المصاريف

      </h1>

      <div style={S.card}>

        <div style={S.grid2}>

          <div>

            <label style={S.label}>الاسم *</label>

            <input style={S.input} value={form.name} onChange={F("name")} />

          </div>

          <div>

            <label style={S.label}>المبلغ *</label>

            <NumInput value={form.amount} onChange={F("amount")} />

          </div>

          <div>

            <label style={S.label}>التاريخ</label>

            <input style={S.input} type="date" value={form.date} onChange={F("date")} />

          </div>

          <div>

            <label style={S.label}>الفئة</label>

            <select style={S.input} value={form.category} onChange={F("category")}>

              <option value="rent">إيجار</option>

              <option value="salary">رواتب</option>

              <option value="utilities">فواتير</option>

              <option value="other">أخرى</option>

            </select>

          </div>

        </div>

        <button style={{ ...S.btn, marginTop: 14 }} onClick={add} disabled={saving}>

          {saving ? "⏳..." : "➕ إضافة"}

        </button>

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

          <h3 style={{ fontWeight: 800 }}>المصاريف</h3>

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

                <th style={S.th}>المبلغ</th>

                <th style={S.th}>الفئة</th>

                <th style={S.th}>التاريخ</th>

                <th style={S.th}>حذف</th>

              </tr>

            </thead>

            <tbody>

              {filtered.map((e) => (

                <tr key={e.id} className="nq-tr">

                  <td style={{ ...S.td, fontWeight: 700 }}>{e.name}</td>

                  <td style={{ ...S.td, color: "#ef4444", fontWeight: 700 }}>

                    {Number(e.amount).toFixed(0)} {CUR}

                  </td>

                  <td style={S.td}>{catLabel[e.category] || e.category}</td>

                  <td style={S.td}>{e.date}</td>

                  <td style={S.td}>

                    <button

                      style={{ ...S.btnSm, background: "#fee2e2", color: "#dc2626" }}

                      onClick={() => del(e.id)}

                    >

                      🗑️

                    </button>

                  </td>

                </tr>

              ))}

              {filtered.length === 0 && (

                <tr>

                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: CLR.textSm }}>

                    لا توجد مصاريف

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        <div style={{ marginTop: 14, fontWeight: 900, color: "#ef4444", fontSize: 16 }}>

          💰 الإجمالي: {total.toFixed(0)} {CUR}

        </div>

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════

   📋 سجل النشاطات

══════════════════════════════════════════ */

