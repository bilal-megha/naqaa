import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function RecycleBin() {

  const [showToast, ToastUI] = useToast();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);



  const load = async () => {

    setLoading(true);

    try {

      const { data, error } = await supabase

        .from("deleted_items")

        .select("*")

        .order("deleted_at", { ascending: false });



      if (error) {

        console.error("❌ خطأ في تحميل سلة المهملات:", error);

        showToast("❌ خطأ في تحميل سلة المهملات", "error");

        setItems([]);

      } else {

        setItems(data || []);

        console.log("✅ تم تحميل سلة المهملات:", data?.length || 0);

      }

    } catch (err) {

      console.error("❌ خطأ:", err);

      setItems([]);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    load();

  }, []);



  // ✅ استعادة العنصر

  const restore = async (id) => {

    const item = items.find((i) => i.id === id);

    if (!item) {

      showToast("❌ العنصر غير موجود", "error");

      return;

    }

    try {

      const data = JSON.parse(item.data);

      const { error } = await supabase.from(item.table_name).insert(data);

      if (error) {

        console.error("❌ خطأ:", error);

        showToast("❌ خطأ: " + error.message, "error");

        return;

      }



      const { error: deleteError } = await supabase.from("deleted_items").delete().eq("id", id);

      if (deleteError) {

        console.error("❌ خطأ:", deleteError);

        showToast("❌ خطأ في الحذف", "error");

        return;

      }



      await logActivity("استعادة عنصر", `تم استعادة عنصر من سلة المهملات`);

      showToast("✅ تم استعادة العنصر");

      load();

    } catch (err) {

      console.error("❌ خطأ في الاستعادة:", err);

      showToast("❌ خطأ في استعادة العنصر", "error");

    }

  };



  // ✅ حذف نهائي

  const permanentDelete = async (id) => {

    if (!confirm("⚠️ حذف نهائي؟ لا يمكن استعادته")) return;

    try {

      const { error } = await supabase.from("deleted_items").delete().eq("id", id);

      if (error) {

        console.error("❌ خطأ:", error);

        showToast("❌ خطأ: " + error.message, "error");

        return;

      }

      await logActivity("حذف نهائي", `تم حذف عنصر نهائياً من سلة المهملات`);

      showToast("🗑️ تم الحذف النهائي");

      load();

    } catch (err) {

      console.error("❌ خطأ:", err);

      showToast("❌ خطأ في الحذف", "error");

    }

  };



  return (

    <div>

      {ToastUI}

      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>🗑️ سلة المهملات</h1>

      <p style={{ color: CLR.textSm, marginBottom: 16, fontSize: 13 }}>

        العناصر المحذوفة خلال آخر 30 يوم يمكن استعادتها

      </p>

      <div style={S.card}>

        {loading ? (

          <div style={{ textAlign: "center", padding: 40 }}>⏳ جاري التحميل...</div>

        ) : items.length === 0 ? (

          <div style={{ textAlign: "center", padding: 40, color: CLR.textSm }}>

            🗑️ سلة المهملات فارغة

            <p style={{ fontSize: 12, marginTop: 8 }}>عند حذف منتج أو عنصر، سيظهر هنا</p>

          </div>

        ) : (

          <div style={{ overflowX: "auto" }}>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>

              <thead>

                <tr style={{ background: CLR.bg }}>

                  <th style={S.th}>الجدول</th>

                  <th style={S.th}>البيانات</th>

                  <th style={S.th}>تاريخ الحذف</th>

                  <th style={S.th}>إجراءات</th>

                </tr>

              </thead>

              <tbody>

                {items.map((item) => {

                  let dataPreview = "";

                  try {

                    const d = JSON.parse(item.data);

                    dataPreview = d.name || d.title || d.code || `#${d.id || item.item_id}`;

                  } catch {

                    dataPreview = `#${item.item_id}`;

                  }

                  return (

                    <tr key={item.id} className="nq-tr">

                      <td style={S.td}>{item.table_name}</td>

                      <td style={S.td}>{dataPreview}</td>

                      <td style={S.td}>

                        {new Date(item.deleted_at).toLocaleDateString("ar-DZ")}

                      </td>

                      <td style={S.td}>

                        <div style={{ display: "flex", gap: 5 }}>

                          <button

                            style={{ ...S.btnSm, background: "#D1FAE5", color: "#059669" }}

                            onClick={() => restore(item.id)}

                          >

                            ↩️ استعادة

                          </button>

                          <button

                            style={{ ...S.btnSm, background: "#FEE2E2", color: "#DC2626" }}

                            onClick={() => permanentDelete(item.id)}

                          >

                            🗑️ حذف نهائي

                          </button>

                        </div>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

}



/* ══════════════════════════════════════════

   ⚙️ الإعدادات

══════════════════════════════════════════ */

