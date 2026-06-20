import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Orders() {

  const [showToast,ToastUI]=useToast()

  const [items,setItems]=useState([]); const [search,setSearch]=useState('')

  const [searchType,setSearchType]=useState('all'); const [statusFilter,setStatusFilter]=useState('all')

  const [viewMode,setViewMode]=useState('list'); const [selectedOrders,setSelectedOrders]=useState([])

  const [showMap,setShowMap]=useState(false)



  const load=useCallback(async()=>{

    const {data}=await supabase.from('orders').select('*').order('id',{ascending:false})

    setItems(data||[])

  },[])

  useEffect(()=>{ load() },[load])



  const updateStatus=async(id,status)=>{

    try {

      await supabase.from('orders').update({status}).eq('id',id)

      await logActivity('تحديث حالة طلب', `تم تحديث حالة الطلب #${id} إلى ${status}`)

      

      if(status==='shipped'||status==='delivered'){

        const {data:ord}=await supabase.from('orders').select('*').eq('id',id).maybeSingle()

        if(ord?.phone){

          const msgs={

            shipped:`🚚 طلبيتك رقم #${String(id).slice(-5)} في الطريق إليك! سنتواصل معك قريباً للتسليم.`,

            delivered:`✅ تم تسليم طلبيتك رقم #${String(id).slice(-5)} بنجاح! شكراً لثقتك بنا 🌟`

          }

          const wa=(ord.phone||'').replace(/\D/g,'')

          if(wa.length>=9) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msgs[status])}`,'_blank')

        }

      }

      showToast('✅ تم تحديث الحالة'); await load()

    } catch (err) {

      showToast('❌ خطأ: '+err.message, 'error')

    }

  }

  

  const updateMulti=async(status)=>{

    if(selectedOrders.length===0){showToast('اختر طلبيات أولاً','error');return}

    try {

      await Promise.all(selectedOrders.map(id=>supabase.from('orders').update({status}).eq('id',id)))

      await logActivity('تحديث حالات طلبيات', `تم تحديث ${selectedOrders.length} طلبية إلى ${status}`)

      showToast(`✅ تم تحديث ${selectedOrders.length} طلبية`)

      setSelectedOrders([])

      await load()

    } catch (err) {

      showToast('❌ خطأ: '+err.message, 'error')

    }

  }



  const filtered=items.filter(o=>{

    if(statusFilter!=='all'&&o.status!==statusFilter) return false

    if(!search) return true

    const q=search.toLowerCase()

    switch(searchType){

      case 'id':      return String(o.id).includes(q)

      case 'name':    return o.customer_name?.toLowerCase().includes(q)

      case 'phone':   return o.customer_phone?.includes(q)

      case 'address': return o.customer_address?.toLowerCase().includes(q)

      default: return String(o.id).includes(q)||o.customer_name?.toLowerCase().includes(q)||o.customer_phone?.includes(q)||o.customer_address?.toLowerCase().includes(q)

    }

  })



  const grouped=filtered.reduce((acc,o)=>{

    const zone=o.customer_address?.split(',')[0]?.trim()||'غير محدد'

    if(!acc[zone]) acc[zone]=[]

    acc[zone].push(o); return acc

  },{})



  const MapView = () => (

    <div style={{background:'white',borderRadius:12,padding:16,border:'1px solid #E2E8F0',marginBottom:12}}>

      <h4 style={{fontWeight:800,marginBottom:8}}>📍 توزيع الطلبيات على الخريطة</h4>

      <div style={{background:'#E2E8F0',borderRadius:8,padding:40,textAlign:'center',color:CLR.textSm}}>

        🗺️ خريطة تفاعلية (تظهر مواقع العملاء)

        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:12}}>

          {Object.entries(grouped).slice(0,8).map(([zone,orders]) => (

            <span key={zone} style={{background:CLR.accent,color:'white',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700}}>

              {zone} ({orders.length})

            </span>

          ))}

        </div>

      </div>

    </div>

  )



  const printDelivery=()=>{

    const content=Object.entries(grouped).map(([zone,orders])=>`

      <div style="margin-bottom:24px;page-break-inside:avoid">

        <h2 style="color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:8px;margin-bottom:12px">📍 ${zone} (${orders.length} طلبية)</h2>

        <table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>العنوان</th><th>الإجمالي</th></tr></thead>

        <tbody>${orders.map(o=>`<tr><td>${o.id}</td><td>${o.customer_name}</td><td>${o.customer_phone||'—'}</td><td>${o.customer_address||'—'}</td><td>${Number(o.total).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody></table>

        <p style="font-weight:bold;text-align:right;margin-top:8px">إجمالي المنطقة: ${orders.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} ${CUR}</p>

      </div>`).join('')

    printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>قائمة التوصيل</p></div><div>${new Date().toLocaleDateString('ar-DZ')}<br>${filtered.length} طلبية</div></div>${content}<div class="footer">نقاء</div>`)

  }



  const printReceipt=o=>{

    const its=typeof o.items==='string'?JSON.parse(o.items):(o.items||[])

    printThermal(`<div class="center bold big">نقاء</div><div class="center">إيصال طلبية</div><div class="line"></div>

    <div class="row"><span>رقم الطلب:</span><span class="bold">${o.id}</span></div>

    <div class="row"><span>العميل:</span><span>${o.customer_name}</span></div>

    <div class="row"><span>الهاتف:</span><span>${o.customer_phone||'—'}</span></div>

    <div class="row"><span>العنوان:</span><span>${o.customer_address||'—'}</span></div>

    <div class="row"><span>التاريخ:</span><span>${o.date}</span></div><div class="line"></div>

    ${its.map(i=>`<div class="row"><span>${i.name} ×${i.quantity}</span><span>${(i.price*i.quantity).toFixed(0)}</span></div>`).join('')}

    <div class="line"></div><div class="row total"><span>الإجمالي:</span><span>${Number(o.total).toFixed(0)} ${CUR}</span></div>

    <div class="line"></div><div class="center" style="font-size:10px">شكراً لتسوقكم معنا — نقاء</div>`)

  }



  const sLabel=s=>({pending:'قيد الانتظار',processing:'تجهيز',shipped:'شُحن',delivered:'تسليم'}[s]||s)

  const sColor=s=>({pending:'#fef9c3',processing:'#dbeafe',shipped:'#e0e7ff',delivered:'#d1fae5'}[s]||'#f1f5f9')



  return (

    <div>{ToastUI}

      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📋 الطلبيات</h1>

      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>

        <button

          onClick={() => setShowMap(!showMap)}

          style={{...S.btnSm,background:showMap?'#dc2626':'#e2e8f0',color:showMap?'white':'#475569',padding:'6px 14px'}}

        >

          🗺️ {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}

        </button>

      </div>



      {showMap && <MapView />}



      <div style={{...S.card,background:'#F0FDF4',border:'1px solid #A7F3D0',marginBottom:14}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>

          <div>

            <strong style={{color:'#059669',fontSize:14}}>📦 أرشفة الطلبيات القديمة</strong>

            <p style={{fontSize:12,color:'#047857',marginTop:3}}>نقل الطلبيات المسلّمة الأقدم من 6 أشهر إلى الأرشيف لتحسين الأداء</p>

          </div>

          <button onClick={async()=>{

            try {

              const cutoff=new Date(); cutoff.setMonth(cutoff.getMonth()-6)

              const {data:old}=await supabase.from('orders').select('*')

                .eq('status','delivered').lt('created_at',cutoff.toISOString())

              if(!old||old.length===0){showToast('لا توجد طلبيات قديمة للأرشفة');return}

              for(const o of old){

                await supabase.from('orders_archive').upsert(o).catch(()=>{})

                await supabase.from('orders').delete().eq('id',o.id)

              }

              await logActivity('أرشفة طلبيات', `تمت أرشفة ${old.length} طلبية`)

              showToast(`✅ تمت أرشفة ${old.length} طلبية`); await load()

            } catch (err) {

              showToast('❌ خطأ: '+err.message, 'error')

            }

          }} style={{...S.btn,background:'#059669',fontSize:13}}>

            📦 أرشفة الآن

          </button>

        </div>

      </div>

      <div style={S.card}>

        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>

          <select style={{...S.input,width:150}} value={searchType} onChange={e=>setSearchType(e.target.value)}>

            <option value="all">🔍 كل الحقول</option>

            <option value="id">🔢 رقم الطلب</option>

            <option value="name">👤 اسم العميل</option>

            <option value="phone">📱 الهاتف</option>

            <option value="address">📍 العنوان</option>

          </select>

          <input style={{...S.input,flex:1,minWidth:160}} value={search} onChange={e=>setSearch(e.target.value)}

            placeholder={`بحث بـ ${{all:'كل الحقول',id:'الرقم',name:'الاسم',phone:'الهاتف',address:'العنوان'}[searchType]}...`} />

          <select style={{...S.input,width:150}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>

            <option value="all">كل الحالات</option>

            <option value="pending">قيد الانتظار</option>

            <option value="processing">تجهيز</option>

            <option value="shipped">شُحن</option>

            <option value="delivered">تسليم</option>

          </select>

        </div>

        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>

          <button style={{...S.btnSm,background:viewMode==='list'?'#dc2626':'#e2e8f0',color:viewMode==='list'?'white':'#475569'}} onClick={()=>setViewMode('list')}>📋 قائمة</button>

          <button style={{...S.btnSm,background:viewMode==='grouped'?'#dc2626':'#e2e8f0',color:viewMode==='grouped'?'white':'#475569'}} onClick={()=>setViewMode('grouped')}>📍 تجميع بالعنوان</button>

          {selectedOrders.length>0&&<>

            <span style={{fontSize:13,color:CLR.textSm}}>✓ {selectedOrders.length} محدد</span>

            <button style={{...S.btnSm,background:CLR.success,color:'white'}} onClick={()=>updateMulti('processing')}>تجهيز الكل</button>

            <button style={{...S.btnSm,background:'#3b82f6',color:'white'}} onClick={()=>updateMulti('shipped')}>شحن الكل</button>

            <button style={{...S.btnSm,background:'#7c3aed',color:'white'}} onClick={()=>updateMulti('delivered')}>تسليم الكل</button>

          </>}

          <button style={{...S.btnGray,background:'#f59e0b',color:'white',marginRight:'auto'}} onClick={printDelivery}>

            🖨️ طباعة قائمة الكاميو ({filtered.length})

          </button>

        </div>

        <div style={{marginTop:10,fontSize:13,color:CLR.textSm}}>

          {filtered.length} طلبية — إجمالي: {filtered.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} {CUR}

        </div>

      </div>



      {viewMode==='grouped' ? (

        Object.entries(grouped).map(([zone,zOrders])=>(

          <div key={zone} style={S.card}>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>

              <h3 style={{fontWeight:800,color:'#dc2626'}}>📍 {zone} ({zOrders.length} طلبية)</h3>

              <span style={{fontWeight:700,color:'#10b981'}}>{zOrders.reduce((s,o)=>s+Number(o.total),0).toFixed(0)} {CUR}</span>

            </div>

            {zOrders.map(o=>(

              <div key={o.id} style={{background:'#f8fafc',borderRadius:12,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>

                <div style={{fontSize:13}}>

                  <strong>#{o.id}</strong> — {o.customer_name} — {o.customer_phone||'—'}

                  <div style={{color:CLR.textSm,fontSize:12}}>{o.customer_address}</div>

                </div>

                <div style={{display:'flex',gap:6,alignItems:'center'}}>

                  <span style={{fontWeight:700,color:'#dc2626'}}>{Number(o.total).toFixed(0)} {CUR}</span>

                  <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,background:sColor(o.status)}}>{sLabel(o.status)}</span>

                  <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>printReceipt(o)}>🖨️</button>

                  {o.customer_phone&&<a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} جاهز للتوصيل`} target="_blank"

                    style={{...S.btnSm,background:'#dcfce7',color:'#059669',textDecoration:'none',padding:'5px 10px'}}>💬</a>}

                </div>

              </div>

            ))}

          </div>

        ))

      ) : (

        <div style={S.card}>

          <div style={{overflowX:'auto'}}>

            <table style={{width:'100%',borderCollapse:'collapse'}}>

              <thead><tr>

                <th style={S.th}><input type="checkbox" onChange={e=>setSelectedOrders(e.target.checked?filtered.map(o=>o.id):[])}/></th>

                <th style={S.th}>#</th><th style={S.th}>العميل</th><th style={S.th}>الهاتف</th>

                <th style={S.th}>العنوان</th><th style={S.th}>الإجمالي</th><th style={S.th}>الحالة</th><th style={S.th}>إجراءات</th>

              </tr></thead>

              <tbody>{filtered.map(o=>(

                <tr key={o.id} className='nq-tr'>

                  <td style={S.td}><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={()=>setSelectedOrders(p=>p.includes(o.id)?p.filter(x=>x!==o.id):[...p,o.id])}/></td>

                  <td style={{...S.td,fontSize:11,color:CLR.textSm}}>{o.id}</td>

                  <td style={{...S.td,fontWeight:700}}>{o.customer_name}</td>

                  <td style={S.td}>{o.customer_phone||'—'}</td>

                  <td style={{...S.td,fontSize:12}}>{o.customer_address||'—'}</td>

                  <td style={{...S.td,color:CLR.accent,fontWeight:700}}>{Number(o.total).toFixed(0)} {CUR}</td>

                  <td style={S.td}><span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:sColor(o.status)}}>{sLabel(o.status)}</span></td>

                  <td style={S.td}>

                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>

                      {['processing','shipped','delivered'].map(s=>(

                        <button key={s} style={{...S.btnSm,background:'#f1f5f9',color:CLR.textSm,fontSize:11}} onClick={()=>updateStatus(o.id,s)}>

                          {{processing:'تجهيز',shipped:'شحن',delivered:'تسليم'}[s]}

                        </button>

                      ))}

                      <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>printReceipt(o)}>🖨️</button>

                      {o.customer_phone&&<a href={`https://wa.me/${o.customer_phone.replace(/^0/,'213')}?text=مرحباً ${o.customer_name}، طلبكم رقم ${o.id} في الطريق`} target="_blank"

                        style={{...S.btnSm,background:'#dcfce7',color:'#059669',textDecoration:'none',padding:'5px 10px'}}>💬</a>}

                    </div>

                  </td>

                </tr>

              ))}

              {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:30,color:CLR.textSm}}>لا توجد طلبيات</td></tr>}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>

  )

}

/* ══════════════════════════════════════════

   🎯 إدارة العروض (مع سلة المهملات)

══════════════════════════════════════════ */

