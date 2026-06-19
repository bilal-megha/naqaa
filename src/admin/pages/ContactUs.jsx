import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function ContactUs({ showToast }) {

  const [form, setForm] = useState({

    contact_phone: "0696668065",

    contact_whatsapp: WA_DEFAULT,

    contact_email: "",

    contact_address: "",

    contact_facebook: "",

    contact_instagram: "",

    contact_hours: "السبت–الخميس: 8ص–6م",

  });

  const [saving, setSaving] = useState(false);



  useEffect(() => {

    supabase

      .from("settings")

      .select("*")

      .then(({ data }) => {

        if (data) {

          const map = {};

          data.forEach((r) => (map[r.key] = r.value));

          setForm((f) => ({ ...f, ...map }));

        }

      });

  }, []);



  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));



  const save = async () => {

    setSaving(true);

    try {

      await Promise.all(

        Object.entries(form).map(([key, value]) =>

          supabase.from("settings").upsert({ key, value: String(value) })

        )

      );

      await logActivity("تحديث اتصل بنا", "تم تحديث صفحة اتصل بنا");

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

        📞 اتصل بنا

      </h1>

      <div style={S.card}>

        <div style={S.grid2}>

          <div>

            <label style={S.label}>📱 الهاتف</label>

            <PhoneInput value={form.contact_phone} onChange={F("contact_phone")} />

          </div>

          <div>

            <label style={S.label}>💬 واتساب</label>

            <PhoneInput value={form.contact_whatsapp} onChange={F("contact_whatsapp")} />

          </div>

          <div>

            <label style={S.label}>📧 البريد</label>

            <input style={S.input} value={form.contact_email} onChange={F("contact_email")} />

          </div>

          <div>

            <label style={S.label}>📍 العنوان</label>

            <input style={S.input} value={form.contact_address} onChange={F("contact_address")} />

          </div>

          <div>

            <label style={S.label}>📘 فيسبوك</label>

            <input style={S.input} value={form.contact_facebook} onChange={F("contact_facebook")} />

          </div>

          <div>

            <label style={S.label}>📸 إنستغرام</label>

            <input style={S.input} value={form.contact_instagram} onChange={F("contact_instagram")} />

          </div>

          <div style={{ gridColumn: "span 2" }}>

            <label style={S.label}>🕒 ساعات العمل</label>

            <input style={S.input} value={form.contact_hours} onChange={F("contact_hours")} />

          </div>

        </div>

        <button style={{ ...S.btn, marginTop: 18 }} onClick={save} disabled={saving}>

          {saving ? "⏳..." : "💾 حفظ"}

        </button>

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════

   🔄 سياسة الاسترجاع

══════════════════════════════════════════ */

