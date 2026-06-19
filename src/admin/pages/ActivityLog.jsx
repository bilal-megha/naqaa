import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function ActivityLog() {

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const load = async () => {

      try {

        const { data } = await supabase

          .from("activity_log")

          .select("*")

          .order("id", { ascending: false })

          .limit(50);

        setItems(data || []);

      } catch (err) {

        console.error("❌ خطأ في تحميل سجل النشاطات:", err);

      } finally {

        setLoading(false);

      }

    };

    load();

  }, []);

  return (

    <div>

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        📋 سجل النشاطات

      </h1>

      <div style={{ ...S.card, maxHeight: 500, overflowY: "auto" }}>

        {loading ? (

          <div style={{ textAlign: "center", padding: 24, color: CLR.textSm }}>

            ⏳ جاري التحميل...

          </div>

        ) : items.length === 0 ? (

          <p style={{ textAlign: "center", color: CLR.textSm, padding: 24 }}>

            📭 لا توجد نشاطات مسجلة

          </p>

        ) : (

          items.map((log) => (

            <div

              key={log.id}

              style={{ borderBottom: `1px solid ${CLR.bg}`, padding: "10px 0" }}

            >

              <div style={{ display: "flex", justifyContent: "space-between" }}>

                <strong style={{ color: CLR.accent }}>{log.action}</strong>

                <span style={{ fontSize: 12, color: CLR.textSm }}>{log.date}</span>

              </div>

              <p style={{ fontSize: 13, color: CLR.textSm, marginTop: 2 }}>{log.details}</p>

            </div>

          ))

        )}

      </div>

    </div>

  );

}

/* ══════════════════════════════════════════

   🗑️ سلة المهملات (مصححة بالكامل)

══════════════════════════════════════════ */

