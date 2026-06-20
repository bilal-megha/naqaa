import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

function Sparkline({ data, color }) {

  if(!data||data.length<2) return null

  const max=Math.max(...data,1); const min=Math.min(...data,0)

  const range=max-min||1; const W=80; const H=32

  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-min)/range)*H}`)

  return (

    <svg width={W} height={H} style={{overflow:'visible'}}>

      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2"

        strokeLinecap="round" strokeLinejoin="round"/>

    </svg>

  )

}



function StatCard({ label, value, icon, color, change, spark }) {

  const up = change >= 0

  return (

    <div style={{ background:'white', borderRadius:12, padding:18, border:'1px solid #E2E8F0',

      boxShadow:'0 1px 6px rgba(0,0,0,.06)', display:'flex', flexDirection:'column', gap:8 }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>

        <div style={{ width:40,height:40,borderRadius:10,background:color+'18',

          display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{icon}</div>

        {change!==undefined&&<span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20,

          background:up?'#D1FAE5':'#FEE2E2', color:up?'#059669':'#DC2626' }}>

          {up?'↑':'↓'} {Math.abs(change)}%

        </span>}

      </div>

      <div style={{ fontSize:22, fontWeight:900, color:CLR.text }}>{value}</div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>

        <span style={{ fontSize:12, color:CLR.textSm }}>{label}</span>

        {spark&&<Sparkline data={spark} color={color}/>}

      </div>

    </div>

  )

}



function AdvancedChart({ data, labels, title }) {

  const max = Math.max(...data, 1)

  const chartH = 150

  

  return (

    <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', marginBottom: 12 }}>

      <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: CLR.text }}>{title}</h4>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: chartH + 30, paddingBottom: 20, position: 'relative' }}>

        {data.map((v, i) => {

          const h = Math.max(4, (v / max) * chartH)

          return (

            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

              <div style={{ fontSize: 10, color: CLR.textSm, fontWeight: 600 }}>{v > 0 ? v.toFixed(0) : ''}</div>

              <div style={{

                width: '100%',

                height: h,

                borderRadius: '4px 4px 0 0',

                background: i === data.length - 1 ? `linear-gradient(180deg,${CLR.accent},${CLR.accentDk})` : '#DBEAFE',

                transition: 'height .4s ease',

                minHeight: 4

              }} />

              <div style={{ fontSize: 9, color: CLR.textSm, position: 'absolute', bottom: 0 }}>{labels?.[i] || ''}</div>

            </div>

          )

        })}

      </div>

    </div>

  )

}



function NotificationBadge({ notifications }) {

  if (!notifications || notifications.length === 0) return null

  return (

    <span style={{

      position: 'absolute',

      top: -6,

      right: -6,

      background: CLR.danger,

      color: 'white',

      borderRadius: '50%',

      width: 18,

      height: 18,

      fontSize: 10,

      fontWeight: 800,

      display: 'flex',

      alignItems: 'center',

      justifyContent: 'center'

    }}>{notifications.length}</span>

  )

}



export default function Dashboard({ user, showToast }) {

  const [stats, setStats] = useState({ 

    products: 0, orders: 0, sales: 0, profit: 0, todaySales: 0,

    lastMonthSales: 0, thisMonthSales: 0, lowStockCount: 0, totalProducts: 0

  })

  const [recent, setRecent] = useState([])

  const [lowStock, setLowStock] = useState([])

  const [weekData, setWeekData] = useState([0,0,0,0,0,0,0])

  const [monthData, setMonthData] = useState([0,0,0,0])

  const [chartMode, setChartMode] = useState('week')

  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState([])

  const [showNotif, setShowNotif] = useState(false)

  const [darkMode, setDarkMode] = useState(localStorage.getItem('nq_dark_mode') === 'true')



  useEffect(() => {

    if (darkMode) {

      document.body.classList.add('dark')

    } else {

      document.body.classList.remove('dark')

    }

    localStorage.setItem('nq_dark_mode', darkMode)

  }, [darkMode])



  useEffect(() => {

    const channel = supabase

      .channel('admin-notifications')

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },

        payload => {

          const msg = `📋 طلبية جديدة من ${payload.new.customer_name || 'عميل'}`

          setNotifications(prev => [{ id: Date.now(), message: msg, time: new Date().toLocaleTimeString() }, ...prev])

          if (showToast) showToast(`🛎️ ${msg}`)

        }

      )

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' },

        payload => {

          const msg = `📦 منتج جديد: ${payload.new.name || 'بدون اسم'}`

          setNotifications(prev => [{ id: Date.now(), message: msg, time: new Date().toLocaleTimeString() }, ...prev])

          if (showToast) showToast(`🛎️ ${msg}`)

        }

      )

      .subscribe()

    return () => channel.unsubscribe()

  }, [showToast])



  // ✅ دالة load مصححة - تجلب جميع البيانات بشكل صحيح

  const load = async () => {

    setLoading(true)

    try {

      const [{ data: prods }, { data: ords }, { data: purcs }, { data: exps }, { data: revs }] = await Promise.all([

        supabase.from('products').select('id,name,stock,price,disabled').order('name'),

        supabase.from('orders').select('*').order('id', { ascending: false }),

        supabase.from('purchases').select('total'),

        supabase.from('expenses').select('amount'),

        supabase.from('reviews').select('rating').catch(() => ({ data: [] })),

      ])

      

      const now = new Date()

      const thisMonth = now.getMonth()

      const thisYear = now.getFullYear()

      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1

      const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear

      const today = now.toLocaleDateString()

      

      // ✅ مبيعات اليوم

      const todayO = (ords || []).filter(o => {

        const d = new Date(o.created_at || o.date)

        return d.toLocaleDateString() === today

      })

      

      // ✅ إجمالي المبيعات

      const sales = (ords || []).reduce((s, o) => s + Number(o.total), 0)

      const pur = (purcs || []).reduce((s, p) => s + Number(p.total), 0)

      const exp = (exps || []).reduce((s, e) => s + Number(e.amount), 0)

      

      // ✅ عدد المنتجات

      const totalProducts = (prods || []).filter(p => p.disabled !== true).length

      

      // ✅ المنتجات منخفضة المخزون

      const minStk = () => 5 // حد المخزون المنخفض الافتراضي

      const lowStockItems = (prods || []).filter(p => p.disabled !== true && (p.stock || 0) <= minStk())

      

      // ✅ مبيعات الأسبوع (7 أيام)

      const week7 = Array(7).fill(0)

      ;(ords || []).forEach(o => {

        const d = new Date(o.created_at || o.date)

        const diff = Math.floor((now - d) / 86400000)

        if (diff >= 0 && diff < 7) week7[6 - diff] += Number(o.total)

      })

      

      // ✅ مبيعات 4 أسابيع

      const wk4 = Array(4).fill(0)

      ;(ords || []).forEach(o => {

        const d = new Date(o.created_at || o.date)

        const diff = Math.floor((now - d) / (86400000 * 7))

        if (diff >= 0 && diff < 4) wk4[3 - diff] += Number(o.total)

      })

      

      // ✅ مبيعات هذا الشهر

      const thisM = (ords || []).filter(o => { 

        const d = new Date(o.created_at || o.date)

        return d.getMonth() === thisMonth && d.getFullYear() === thisYear 

      }).reduce((s, o) => s + Number(o.total), 0)

      

      // ✅ مبيعات الشهر الماضي

      const lastM = (ords || []).filter(o => { 

        const d = new Date(o.created_at || o.date)

        return d.getMonth() === lastMonth && d.getFullYear() === lastYear 

      }).reduce((s, o) => s + Number(o.total), 0)

      

      // ✅ نسبة التغيير

      const changeP = lastM > 0 ? Math.round((thisM - lastM) / lastM * 100) : 0

      

      // ✅ التقييمات

      const rv = revs || []

      const avgRating = rv.length ? (rv.reduce((s, r) => s + (r.rating || 0), 0) / rv.length).toFixed(1) : 0

      

      setStats({

        products: totalProducts,

        orders: (ords || []).length,

        sales: sales,

        profit: sales - pur - exp,

        todaySales: todayO.reduce((s, o) => s + Number(o.total), 0),

        thisMonthSales: thisM,

        lastMonthSales: lastM,

        changeP: changeP,

        avgRating: parseFloat(avgRating),

        totalReviews: rv.length,

        lowStockCount: lowStockItems.length,

        totalProducts: totalProducts

      })

      

      setRecent((ords || []).slice(0, 8))

      setLowStock(lowStockItems)

      setWeekData(week7)

      setMonthData(wk4)

    } catch (err) {

      console.error('❌ خطأ في تحميل لوحة القيادة:', err)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => { load() }, [])



  const days=['أحد','اثن','ثلا','أرب','خمس','جمع','سبت']

  const now=new Date(); const wkDays=Array(7).fill(0).map((_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return days[d.getDay()]})

  const maxW=Math.max(...weekData,1); const maxM=Math.max(...monthData,1)

  const chartH=100



  const statusStyle = s => ({

    padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap',

    background:{pending:'#FEF9C3',confirmed:'#DBEAFE',shipping:'#E0E7FF',delivered:'#D1FAE5',cancelled:'#FEE2E2'}[s]||'#F1F5F9',

    color:{pending:'#92400E',confirmed:'#1D4ED8',shipping:'#5B21B6',delivered:'#059669',cancelled:'#DC2626'}[s]||'#475569'

  })

  const statusLabel={pending:'انتظار',confirmed:'مؤكد',shipping:'شحن',delivered:'تسليم',cancelled:'ملغي'}



  return (

    <div style={{ direction: 'rtl' }}>

      {/* شريط الإشعارات */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          <button

            onClick={() => setShowNotif(!showNotif)}

            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}

          >

            🔔

            <NotificationBadge notifications={notifications} />

          </button>

          {showNotif && (

            <div style={{

              position: 'absolute',

              top: 50,

              right: 20,

              background: 'white',

              borderRadius: 12,

              padding: 12,

              boxShadow: '0 4px 20px rgba(0,0,0,.15)',

              maxHeight: 200,

              overflowY: 'auto',

              width: 300,

              zIndex: 1000,

              border: '1px solid #E2E8F0'

            }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>

                <strong>الإشعارات</strong>

                <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: CLR.danger, cursor: 'pointer' }}>مسح الكل</button>

              </div>

              {notifications.length === 0 ? (

                <p style={{ color: CLR.textSm, textAlign: 'center' }}>لا توجد إشعارات</p>

              ) : (

                notifications.map(n => (

                  <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid #E2E8F0', fontSize: 13 }}>

                    <div>{n.message}</div>

                    <div style={{ fontSize: 10, color: CLR.textSm }}>{n.time}</div>

                  </div>

                ))

              )}

            </div>

          )}

        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

          <button

            onClick={() => setDarkMode(!darkMode)}

            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}

          >

            {darkMode ? '☀️' : '🌙'}

          </button>

          <span style={{ fontSize: 12, color: CLR.textSm }}>{darkMode ? 'وضع مظلم' : 'وضع فاتح'}</span>

        </div>

      </div>



      {/* عنوان + تاريخ */}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>

        <div>

          <h1 style={{ fontSize:20, fontWeight:900, color:CLR.text }}>لوحة القيادة</h1>

          <div style={{ fontSize:12, color:CLR.textSm }}>{new Date().toLocaleDateString('ar-DZ',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>

        </div>

        <div style={{ fontSize:11, color:CLR.textSm, background:'white', border:'1px solid #E2E8F0',

          borderRadius:8, padding:'6px 12px', fontWeight:600 }}>

          {stats.changeP>=0?'↑':'↓'} {Math.abs(stats.changeP||0)}% vs الشهر الماضي

        </div>

      </div>



      {/* ✅ بطاقات إحصاء - تعرض الأرقام الصحيحة */}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>

        <StatCard label="المنتجات"        value={stats.products}  icon="📦" color={CLR.info}    spark={[stats.products,stats.products]}/>

        <StatCard label="الطلبيات"        value={stats.orders}    icon="📋" color={CLR.success}  spark={weekData}/>

        <StatCard label="مبيعات اليوم"    value={`${stats.todaySales.toFixed(0)} ${CUR}`} icon="⚡" color={CLR.warn} spark={weekData}/>

        <StatCard label="هذا الشهر"       value={`${stats.thisMonthSales.toFixed(0)} ${CUR}`} icon="📅" color={CLR.accent} change={stats.changeP} spark={monthData}/>

        <StatCard label="صافي الربح"      value={`${stats.profit.toFixed(0)} ${CUR}`} icon="💰" color={stats.profit>=0?CLR.success:CLR.danger} spark={weekData}/>

      </div>



      {/* رسوم بيانية متقدمة */}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>

        <AdvancedChart data={weekData} labels={['أحد', 'اثن', 'ثلاث', 'أربع', 'خميس', 'جمع', 'سبت']} title="📊 مبيعات الأسبوع" />

        <AdvancedChart data={monthData} labels={['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4']} title="📊 مبيعات الشهر" />

      </div>



      {/* بطاقة متوسط التقييمات */}

      {stats.avgRating>0&&(

        <div style={{...S.card,background:'linear-gradient(135deg,#FFF7ED,#FFFBEB)',

          border:'1px solid #FED7AA',marginBottom:14,display:'flex',gap:16,alignItems:'center'}}>

          <div style={{fontSize:40}}>⭐</div>

          <div>

            <div style={{fontWeight:900,fontSize:22,color:'#F97316'}}>{stats.avgRating}/5</div>

            <div style={{fontSize:13,color:'#92400E',fontWeight:600}}>متوسط تقييمات المنتجات ({stats.totalReviews} تقييم)</div>

          </div>

        </div>

      )}

      

      {/* ✅ تنبيه المخزون المنخفض */}

      {lowStock.length>0&&(

        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10,

          padding:'12px 16px', marginBottom:18, display:'flex', gap:12, alignItems:'flex-start' }}>

          <span style={{ fontSize:20 }}>⚠️</span>

          <div style={{ flex:1 }}>

            <strong style={{ color:'#C2410C', fontSize:13 }}>مخزون منخفض — {lowStock.length} منتج</strong>

            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>

              {lowStock.slice(0,10).map(p=>(

                <span key={p.id} style={{ background:'white', border:'1px solid #FED7AA', color:'#C2410C',

                  padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>

                  {p.name} ({p.stock||0} كرتون)

                </span>

              ))}

              {lowStock.length>10&&<span style={{fontSize:11,color:CLR.textSm}}>+{lowStock.length-10} أخرى</span>}

            </div>

          </div>

        </div>

      )}



      {/* آخر الطلبيات */}

      <div style={S.card}>

        <h3 style={{ fontWeight:800, marginBottom:14, fontSize:15 }}>📋 آخر الطلبيات</h3>

        {recent.length===0?<p style={{ textAlign:'center', color:CLR.textSm, padding:24 }}>لا توجد طلبيات</p>:

          <div style={{ overflowX:'auto' }}>

            <table style={{ width:'100%', borderCollapse:'collapse' }}>

              <thead><tr>

                <th style={S.th}>#</th><th style={S.th}>العميل</th>

                <th style={S.th}>الولاية</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th>

              </tr></thead>

              <tbody>{recent.map((o,i)=>(

                <tr key={o.id} style={{ background:i%2===0?'white':CLR.bg }}>

                  <td style={{ ...S.td, fontSize:11, color:CLR.textSm }}>#{String(o.id).slice(-5)}</td>

                  <td style={{ ...S.td, fontWeight:700 }}>{o.customer_name}</td>

                  <td style={{ ...S.td, color:CLR.textSm }}>{o.address?.split(',')[0]||o.customer_address?.split(',')[0]||'—'}</td>

                  <td style={{ ...S.td, color:CLR.accent, fontWeight:700 }}>{Number(o.total).toFixed(0)} {CUR}</td>

                  <td style={S.td}><span style={statusStyle(o.status)}>{statusLabel[o.status]||o.status||'انتظار'}</span></td>

                </tr>

              ))}</tbody>

            </table>

          </div>}

      </div>



      {/* ✅ المنتجات الموشكة على النفاد */}

      <div style={S.card}>

        <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15, color: '#dc2626' }}>

          ⚠️ المنتجات الموشكة على النفاد

        </h3>

        {lowStock.length === 0 ? (

          <p style={{ textAlign: 'center', color: CLR.textSm, padding: 20 }}>

            ✅ جميع المنتجات متوفرة بالمخزون الكافي

          </p>

        ) : (

          <div style={{ overflowX: 'auto' }}>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>

              <thead>

                <tr style={{ background: '#FEF2F2' }}>

                  <th style={S.th}>#</th>

                  <th style={S.th}>المنتج</th>

                  <th style={S.th}>المخزون الحالي</th>

                  <th style={S.th}>الحد الأدنى</th>

                  <th style={S.th}>الحالة</th>

                </tr>

              </thead>

              <tbody>

                {lowStock

                  .sort((a, b) => (a.stock || 0) - (b.stock || 0))

                  .map((p, i) => {

                    const stock = p.stock || 0

                    const minStock = p.min_stock || 5

                    const percentage = Math.min(100, (stock / minStock) * 100)

                    const status = stock === 0 ? 'نفذ' : stock < minStock / 2 ? 'حرج' : 'منخفض'

                    const statusColor = stock === 0 ? '#DC2626' : stock < minStock / 2 ? '#F59E0B' : '#F97316'

                    

                    return (

                      <tr key={p.id} style={{ background: i % 2 === 0 ? 'white' : '#FEF2F2' }}>

                        <td style={S.td}>{i + 1}</td>

                        <td style={{ ...S.td, fontWeight: 700 }}>{p.name}</td>

                        <td style={S.td}>

                          <span style={{

                            padding: '3px 10px',

                            borderRadius: 20,

                            fontSize: 12,

                            fontWeight: 700,

                            background: stock === 0 ? '#FEE2E2' : '#FEF3C7',

                            color: stock === 0 ? '#DC2626' : '#92400E'

                          }}>

                            {stock} كرتون

                          </span>

                        </td>

                        <td style={S.td}>{minStock} كرتون</td>

                        <td style={S.td}>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                            <div style={{

                              width: 60,

                              height: 6,

                              background: '#E5E7EB',

                              borderRadius: 10,

                              overflow: 'hidden'

                            }}>

                              <div style={{

                                width: `${percentage}%`,

                                height: '100%',

                                background: statusColor,

                                borderRadius: 10,

                                transition: 'width .5s ease'

                              }} />

                            </div>

                            <span style={{

                              fontSize: 11,

                              fontWeight: 700,

                              color: statusColor

                            }}>

                              {status}

                            </span>

                          </div>

                        </td>

                      </tr>

                    )

                  })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  )

}

/* ══════════════════════════════════════════

   📦 المنتجات (مع سلة المهملات)

══════════════════════════════════════════ */

