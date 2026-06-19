import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Reports() {

  const [showToast, ToastUI] = useToast();

  const [data, setData] = useState({ orders: [], purchases: [], expenses: [], customers: [] });

  const [repTab, setRepTab] = useState("overview");



  useEffect(() => {

    const load = async () => {

      try {

        const [{ data: o }, { data: p }, { data: e }, { data: cu }] = await Promise.all([

          supabase.from("orders").select("*").order("id", { ascending: false }),

          supabase.from("purchases").select("*"),

          supabase.from("expenses").select("*"),

          supabase.from("customers").select("id,name,total_purchases,tier,address"),

        ]);

        setData({ orders: o || [], purchases: p || [], expenses: e || [], customers: cu || [] });

      } catch (err) {

        console.error("❌ خطأ في تحميل التقارير:", err);

        showToast("❌ خطأ في تحميل التقارير", "error");

      }

    };

    load();

  }, []);



  const exportPDF = () => {

    const content = `

      <div class="header"><div><h1>🛍️ نقاء</h1><p>تقرير شامل</p></div><div>${new Date().toLocaleDateString("ar-DZ")}</div></div>

      <h2>إحصائيات</h2>

      <table>

        <thead><tr><th>المؤشر</th><th>القيمة</th></tr></thead>

        <tbody>

          <tr><td>إجمالي المبيعات</td><td>${data.orders.reduce((s, o) => s + Number(o.total), 0).toFixed(0)} ${CUR}</td></tr>

          <tr><td>عدد الطلبيات</td><td>${data.orders.length}</td></tr>

          <tr><td>عدد العملاء</td><td>${data.customers.length}</td></tr>

          <tr><td>إجمالي المشتريات</td><td>${data.purchases.reduce((s, p) => s + Number(p.total), 0).toFixed(0)} ${CUR}</td></tr>

          <tr><td>إجمالي المصاريف</td><td>${data.expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(0)} ${CUR}</td></tr>

        </tbody>

      </table>

      <div class="footer">نقاء — تقرير شهري</div>

    `;

    printA4(content);

  };



  const now = new Date();

  const thisM = now.getMonth();

  const thisY = now.getFullYear();

  const lastM = thisM === 0 ? 11 : thisM - 1;

  const lastY = thisM === 0 ? thisY - 1 : thisY;

  const salesThisM = data.orders

    .filter((o) => {

      const d = new Date(o.created_at || o.date);

      return d.getMonth() === thisM && d.getFullYear() === thisY;

    })

    .reduce((s, o) => s + Number(o.total), 0);

  const salesLastM = data.orders

    .filter((o) => {

      const d = new Date(o.created_at || o.date);

      return d.getMonth() === lastM && d.getFullYear() === lastY;

    })

    .reduce((s, o) => s + Number(o.total), 0);

  const chg = salesLastM > 0 ? Math.round(((salesThisM - salesLastM) / salesLastM) * 100) : 0;

  const totalSales = data.orders.reduce((s, o) => s + Number(o.total), 0);

  const totalPurch = data.purchases.reduce((s, p) => s + Number(p.total), 0);

  const totalExp = data.expenses.reduce((s, e) => s + Number(e.amount), 0);

  const profit = totalSales - totalPurch - totalExp;



  const prodSales = {};

  data.orders.forEach((o) => {

    const its = typeof o.items === "string" ? JSON.parse(o.items || "[]") : (o.items || []);

    its.forEach((i) => {

      prodSales[i.name] = (prodSales[i.name] || 0) + ((i.qty || 1) * (i.price || 0));

    });

  });

  const topProds = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const topCusts = [...data.customers]

    .sort((a, b) => Number(b.total_purchases || 0) - Number(a.total_purchases || 0))

    .slice(0, 8);

  const geoData = {};

  data.orders.forEach((o) => {

    const w = (o.address || o.customer_address || "غير محدد").split(/[,،]/)[0].trim() || "غير محدد";

    geoData[w] = (geoData[w] || 0) + Number(o.total);

  });

  const topGeo = Object.entries(geoData).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const maxP = topProds[0]?.[1] || 1;

  const maxC = Number(topCusts[0]?.total_purchases || 1);

  const maxG = topGeo[0]?.[1] || 1;



  const sSt = (s) => ({

    padding: "3px 9px",

    borderRadius: 20,

    fontSize: 11,

    fontWeight: 700,

    background:

      {

        pending: "#FEF9C3",

        confirmed: "#DBEAFE",

        shipping: "#E0E7FF",

        delivered: "#D1FAE5",

        cancelled: "#FEE2E2",

      }[s] || "#F1F5F9",

    color:

      {

        pending: "#92400E",

        confirmed: "#1D4ED8",

        shipping: "#5B21B6",

        delivered: "#059669",

        cancelled: "#DC2626",

      }[s] || "#475569",

  });



  return (

    <div>

      {ToastUI}

      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>

        📈 التقارير

      </h1>

      <button

        style={{ ...S.btn, background: "#7c3aed", marginBottom: 16 }}

        onClick={exportPDF}

      >

        📄 تصدير تقرير PDF

      </button>



      <div

        style={{

          display: "grid",

          gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",

          gap: 12,

          marginBottom: 20,

        }}

      >

        {[

          { l: "هذا الشهر", v: salesThisM, c: CLR.accent, i: "📅", ch: chg },

          { l: "الشهر الماضي", v: salesLastM, c: "#94A3B8", i: "🗓️" },

          { l: "إجمالي المبيعات", v: totalSales, c: CLR.success, i: "💰" },

          { l: "صافي الربح", v: profit, c: profit >= 0 ? CLR.success : CLR.danger, i: "📊" },

        ].map((s, i) => (

          <div key={i} style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${s.c}` }}>

            <div

              style={{

                display: "flex",

                justifyContent: "space-between",

                alignItems: "flex-start",

              }}

            >

              <div

                style={{

                  width: 36,

                  height: 36,

                  borderRadius: 8,

                  background: s.c + "18",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  fontSize: 18,

                }}

              >

                {s.i}

              </div>

              {s.ch !== undefined && (

                <span

                  style={{

                    fontSize: 11,

                    fontWeight: 700,

                    padding: "2px 7px",

                    borderRadius: 20,

                    background: s.ch >= 0 ? "#D1FAE5" : "#FEE2E2",

                    color: s.ch >= 0 ? "#059669" : "#DC2626",

                  }}

                >

                  {s.ch >= 0 ? "↑" : "↓"}

                  {Math.abs(s.ch)}%

                </span>

              )}

            </div>

            <div style={{ fontSize: 19, fontWeight: 900, color: s.c, marginTop: 8 }}>

              {s.v.toFixed(0)} {CUR}

            </div>

            <div style={{ fontSize: 12, color: CLR.textSm }}>{s.l}</div>

          </div>

        ))}

      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>

        {[

          ["overview", "نظرة عامة"],

          ["products", "المنتجات"],

          ["customers", "العملاء"],

          ["geo", "جغرافي"],

        ].map(([v, l]) => (

          <button

            key={v}

            onClick={() => setRepTab(v)}

            style={{

              ...S.btnSm,

              background: repTab === v ? CLR.accent : "white",

              color: repTab === v ? "white" : CLR.textSm,

              border: `1px solid ${repTab === v ? CLR.accent : CLR.border}`,

              padding: "7px 16px",

              fontSize: 13,

            }}

          >

            {l}

          </button>

        ))}

      </div>

      {repTab === "overview" && (

        <div style={S.card}>

          <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>

            📋 آخر الطلبيات

          </h3>

          <div style={{ overflowX: "auto" }}>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>

              <thead>

                <tr style={{ background: CLR.bg }}>

                  <th style={S.th}>#</th>

                  <th style={S.th}>العميل</th>

                  <th style={S.th}>الولاية</th>

                  <th style={S.th}>الإجمالي</th>

                  <th style={S.th}>الحالة</th>

                </tr>

              </thead>

              <tbody>

                {data.orders.slice(0, 15).map((o, i) => (

                  <tr key={o.id} className="nq-tr" style={{ background: i % 2 === 0 ? "white" : CLR.bg }}>

                    <td style={{ ...S.td, fontSize: 11, color: CLR.textSm }}>

                      #{String(o.id).slice(-5)}

                    </td>

                    <td style={{ ...S.td, fontWeight: 700 }}>{o.customer_name}</td>

                    <td style={{ ...S.td, color: CLR.textSm }}>

                      {(o.address || o.customer_address || "—").split(/[,،]/)[0]}

                    </td>

                    <td style={{ ...S.td, color: CLR.accent, fontWeight: 700 }}>

                      {Number(o.total).toFixed(0)} {CUR}

                    </td>

                    <td style={S.td}>

                      <span style={sSt(o.status)}>{o.status || "انتظار"}</span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {repTab === "products" && (

        <div style={S.card}>

          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>

            📦 أكثر المنتجات مبيعاً

          </h3>

          {topProds.length === 0 ? (

            <p style={{ color: CLR.textSm, textAlign: "center", padding: 24 }}>لا بيانات</p>

          ) : (

            topProds.map(([name, val], i) => (

              <div key={i} style={{ marginBottom: 14 }}>

                <div

                  style={{

                    display: "flex",

                    justifyContent: "space-between",

                    marginBottom: 5,

                    fontSize: 13,

                  }}

                >

                  <span style={{ fontWeight: 700 }}>

                    {i + 1}. {name}

                  </span>

                  <span style={{ color: CLR.accent, fontWeight: 700 }}>

                    {val.toFixed(0)} {CUR}

                  </span>

                </div>

                <div style={{ background: CLR.bg, borderRadius: 30, height: 8, overflow: "hidden" }}>

                  <div

                    style={{

                      width: `${(val / maxP) * 100}%`,

                      height: "100%",

                      background: `linear-gradient(90deg,${CLR.accent},${CLR.accentDk})`,

                      borderRadius: 30,

                    }}

                  />

                </div>

              </div>

            ))

          )}

        </div>

      )}

      {repTab === "customers" && (

        <div style={S.card}>

          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>

            👥 أكثر العملاء شراءً

          </h3>

          <div style={{ overflowX: "auto" }}>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>

              <thead>

                <tr style={{ background: CLR.bg }}>

                  <th style={S.th}>#</th>

                  <th style={S.th}>الاسم</th>

                  <th style={S.th}>الرتبة</th>

                  <th style={S.th}>المشتريات</th>

                  <th style={S.th}>التقدم</th>

                </tr>

              </thead>

              <tbody>

                {topCusts.map((c, i) => {

                  const ts = {

                    M1: { bg: "#F1F5F9", color: CLR.textSm },

                    M2: { bg: "#DBEAFE", color: "#1D4ED8" },

                    M3: { bg: "#FEF9C3", color: "#92400E" },

                  }[c.tier || "M1"];

                  return (

                    <tr key={c.id} className="nq-tr" style={{ background: i % 2 === 0 ? "white" : CLR.bg }}>

                      <td style={{ ...S.td, fontWeight: 900, color: CLR.textSm }}>{i + 1}</td>

                      <td style={{ ...S.td, fontWeight: 700 }}>{c.name}</td>

                      <td style={S.td}>

                        <span

                          style={{

                            ...ts,

                            padding: "2px 9px",

                            borderRadius: 20,

                            fontSize: 11,

                            fontWeight: 700,

                          }}

                        >

                          {c.tier || "M1"}

                        </span>

                      </td>

                      <td style={{ ...S.td, color: CLR.accent, fontWeight: 700 }}>

                        {Number(c.total_purchases || 0).toFixed(0)} {CUR}

                      </td>

                      <td style={{ ...S.td, minWidth: 100 }}>

                        <div

                          style={{

                            background: CLR.bg,

                            borderRadius: 30,

                            height: 6,

                            overflow: "hidden",

                          }}

                        >

                          <div

                            style={{

                              width: `${Math.min(

                                100,

                                (Number(c.total_purchases || 0) / maxC) * 100

                              )}%`,

                              height: "100%",

                              background: `linear-gradient(90deg,${CLR.accent},#FB923C)`,

                              borderRadius: 30,

                            }}

                          />

                        </div>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {repTab === "geo" && (

        <div style={S.card}>

          <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>

            🗺️ المبيعات حسب الولاية

          </h3>

          {topGeo.length === 0 ? (

            <p style={{ color: CLR.textSm, textAlign: "center", padding: 24 }}>لا بيانات</p>

          ) : (

            topGeo.map(([wil, val], i) => (

              <div key={i} style={{ marginBottom: 14 }}>

                <div

                  style={{

                    display: "flex",

                    justifyContent: "space-between",

                    marginBottom: 5,

                    fontSize: 13,

                  }}

                >

                  <span style={{ fontWeight: 700 }}>📍 {wil}</span>

                  <span style={{ color: CLR.info, fontWeight: 700 }}>

                    {val.toFixed(0)} {CUR}

                  </span>

                </div>

                <div style={{ background: CLR.bg, borderRadius: 30, height: 8, overflow: "hidden" }}>

                  <div

                    style={{

                      width: `${(val / maxG) * 100}%`,

                      height: "100%",

                      background: `linear-gradient(90deg,${CLR.info},#60A5FA)`,

                      borderRadius: 30,

                    }}

                  />

                </div>

              </div>

            ))

          )}

        </div>

      )}

    </div>

  );

}



/* ══════════════════════════════════════════

   💸 المصاريف

══════════════════════════════════════════ */

