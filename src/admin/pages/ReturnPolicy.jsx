import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function ReturnPolicy({ showToast }) {

  const [content, setContent] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {

    supabase

      .from("settings")

      .select("value")

      .eq("key", "return_policy")

      .maybeSingle()

      .then(({ data }) =>

        setContent(

          data?.value ||

            "يمكن للعميل استرجاع المنتج خلال 14 يوم من الاستلام بشرط أن يكون بحالته الأصلية.\n\nشروط الاسترجاع:\n• المنتج بدون استخدام\n• مع الفاتورة الأصلية\n• خلال 14 يوم"

        )

      );

  }, []);

  const save = async () => {

    setSaving(true);

    try {

      await supabase.from("settings").upsert({ key: "return_policy", value: content });

      await logActivity("تحديث سياسة الاسترجاع", "تم تحديث سياسة الاسترجاع");

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

        🔄 سياسة الاسترجاع

      </h1>

      <div style={S.card}>

        <label style={S.label}>محتوى السياسة</label>

        <textarea

          style={{ ...S.input, minHeight: 220, resize: "vertical", marginBottom: 14 }}

          value={content}

          onChange={(e) => setContent(e.target.value)}

        />

        <button style={S.btn} onClick={save} disabled={saving}>

          {saving ? "⏳..." : "💾 حفظ"}

        </button>

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════

   🏠 المكوّن الرئيسي Admin

══════════════════════════════════════════ */

