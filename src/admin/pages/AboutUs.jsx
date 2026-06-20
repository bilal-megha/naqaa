import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function AboutUs({ showToast }) {

  const [content, setContent] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {

    supabase

      .from("settings")

      .select("value")

      .eq("key", "about_us")

      .maybeSingle()

      .then(({ data }) =>

        setContent(

          data?.value ||

            "نقاء — متجر إلكتروني جزائري متخصص في توزيع المواد الغذائية ومنتجات العناية الشخصية.\n\nتأسس المتجر بهدف تقديم أفضل المنتجات بأسعار تنافسية مع ضمان الجودة والخدمة الممتازة."

        )

      );

  }, []);

  const save = async () => {

    setSaving(true);

    try {

      await supabase.from("settings").upsert({ key: "about_us", value: content });

      await logActivity("تحديث من نحن", "تم تحديث صفحة من نحن");

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

        🏢 من نحن

      </h1>

      <div style={S.card}>

        <label style={S.label}>محتوى الصفحة</label>

        <textarea

          style={{ ...S.input, minHeight: 200, resize: "vertical", marginBottom: 14 }}

          value={content}

          onChange={(e) => setContent(e.target.value)}

        />

        <button style={S.btn} onClick={save} disabled={saving}>

          {saving ? "⏳..." : "💾 حفظ"}

        </button>

      </div>

      {content && (

        <div style={S.card}>

          <h3 style={{ fontWeight: 800, marginBottom: 10 }}>معاينة</h3>

          <div

            style={{

              whiteSpace: "pre-wrap",

              lineHeight: 1.8,

              color: CLR.textSm,

              fontSize: 14,

            }}

          >

            {content}

          </div>

        </div>

      )}

    </div>

  );

}



/* ══════════════════════════════════════════

   📞 اتصل بنا

══════════════════════════════════════════ */

