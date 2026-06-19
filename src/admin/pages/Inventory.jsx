import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4, NumInput, PhoneInput } from '../styles/helpers.js'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Inventory() {

  const [showToast,ToastUI]=useToast()

  const [items,setItems]=useState([]); const [search,setSearch]=useState('')



  const sendWaAlert=(prod)=>{

    const wa=(localStorage.getItem('nq_wa_alert')||WA_DEFAULT).replace(/\D/g,'')

    if(!wa){showToast('أدخل رقم واتساب أولاً','error');return}

    const msg=`⚠️ تنبيه مخزون نقاء%0A%0Aالمنتج: ${encodeURIComponent(prod.name)}%0Aالمخزون الحالي: ${prod.stock||0} كرتون%0Aالحد الأدنى: ${prod.min_stock||5}%0A%0Aيرجى إعادة الطلب عاجلاً`

    window.open('https://wa.me/' + msg, '_blank')

    showToast('📱 تم فتح واتساب')

  }



  const load=async()=>{

    const {data}=await supabase.from('products').select('id,name,stock,price,cost_price,sku,units,min_stock').order('name')

    setItems(data||[])

  }

  useEffect(()=>{ load() },[])



  const filtered=items.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()))



  const exportCSV = () => {

    const header = 'ID,اسم المنتج,الباركود,المخزون,السعر,سعر الشراء,قطع/كرتون,الحد الأدنى'

    const rows = items.map(p => `${p.id},"${p.name}","${p.sku||''}",${p.stock||0},${p.price},${p.cost_price||0},${p.units||12},${p.min_stock||5}`)

    const csv = '\uFEFF' + header + '\n' + rows.join('\n')

    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })

    const url  = URL.createObjectURL(blob)

    const a    = document.createElement('a'); a.href=url; a.download='naqaa_inventory.csv'; a.click()

    URL.revokeObjectURL(url)

    showToast('✅ تم تصدير المخزون')

  }



  const importCSV = e => {

    const file = e.target.files[0]; if (!file) return

    const reader = new FileReader()

    reader.onload = async ev => {

      const lines = ev.target.result.split('\n').slice(1)

      let updated = 0

      for (const line of lines) {

        const cols = line.split(',')

        if (cols.length < 4) continue

        const id    = cols[0]?.trim()

        const stock = parseInt(cols[3]?.trim())

        const price = parseFloat(cols[4]?.trim())

        if (!id || isNaN(stock)) continue

        const row = { stock }

        if (!isNaN(price) && price > 0) row.price = price

        await supabase.from('products').update(row).eq('id', id)

        updated++

      }

      await logActivity('استيراد مخزون', `تم استيراد ${updated} منتج`)

      showToast(`✅ تم تحديث ${updated} منتج`)

      await load()

    }

    reader.readAsText(file, 'UTF-8')

    e.target.value = ''

  }



  const printInventory = () => {

    printA4(`

      <div class="header"><div><h1>🛍️ نقاء</h1></div><div><p>تقرير المخزون</p><p>${new Date().toLocaleDateString('ar-DZ')}</p></div></div>

      <table><thead><tr><th>المنتج</th><th>الباركود</th><th>المخزون</th><th>الحد الأدنى</th><th>الحالة</th><th>القيمة</th></tr></thead>

      <tbody>${filtered.map(p=>`<tr><td>${p.name}</td><td>${p.sku||'—'}</td><td>${p.stock||0}</td><td>${p.min_stock||5}</td><td>${(p.stock||0)<(p.min_stock||5)?'⚠️ منخفض':(p.stock||0)<20?'متوسط':'جيد'}</td><td>${((p.stock||0)*Number(p.price)).toFixed(0)} ${CUR}</td></tr>`).join('')}</tbody></table>

      <div class="footer">إجمالي قيمة المخزون: ${filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} ${CUR}</div>

    `)

  }



  return (

    <div>{ToastUI}

      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>📦 المخزون</h1>

      <div style={S.card}>

        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>

          <input style={{...S.input,flex:1,minWidth:180}} placeholder="🔍 بحث..." value={search} onChange={e=>setSearch(e.target.value)} />

          <button style={{...S.btnGray,background:CLR.success,color:'white'}} onClick={exportCSV}>📥 تصدير Excel</button>

          <label style={{...S.btnGray,background:'#3b82f6',color:'white',cursor:'pointer',padding:'10px 22px',borderRadius:30,fontWeight:700,fontSize:14}}>

            📤 استيراد Excel

            <input type="file" accept=".csv,.xlsx" style={{display:'none'}} onChange={importCSV}/>

          </label>

          <button style={{...S.btnGray,background:'#7c3aed',color:'white'}} onClick={printInventory}>🖨️ طباعة</button>

        </div>

        <div style={{background:'#f0f9ff',borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:'#1d4ed8'}}>

          💡 <strong>تعليمات الاستيراد:</strong> صدّر الملف أولاً، عدّل الكميات والأسعار في Excel، ثم استورده مجدداً. العمود الأول (ID) لا تغيّره.

        </div>

        <div style={{overflowX:'auto'}}>

          <table style={{width:'100%',borderCollapse:'collapse'}}>

            <thead><tr>

              <th style={S.th}>المنتج</th><th style={S.th}>الباركود</th>

              <th style={S.th}>المخزون</th><th style={S.th}>الحد الأدنى</th>

              <th style={S.th}>الحالة</th>

              <th style={S.th}>القيمة</th>

            </tr></thead>

            <tbody>{filtered.map(p=>(

              <tr key={p.id} className='nq-tr'>

                <td style={{...S.td,fontWeight:700}}>{p.name}</td>

                <td style={S.td}>{p.sku||'—'}</td>

                <td style={S.td}>

                  <span style={{padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700,

                    background:(p.stock||0)<(p.min_stock||5)?'#fee2e2':(p.stock||0)<20?'#fef9c3':'#d1fae5',

                    color:(p.stock||0)<(p.min_stock||5)?'#dc2626':(p.stock||0)<20?'#b45309':'#059669'}}>

                    {p.stock||0}

                  </span>

                </td>

                <td style={S.td}>{p.min_stock||5}</td>

                <td style={S.td}>{(p.stock||0)<(p.min_stock||5)?'⚠️ منخفض':(p.stock||0)<20?'⚡ متوسط':'✅ جيد'}</td>

                <td style={S.td}>{((p.stock||0)*Number(p.price)).toFixed(0)} {CUR}</td>

              </tr>

            ))}

            {filtered.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد منتجات</td></tr>}

            </tbody>

          </table>

        </div>

        <div style={{marginTop:12,fontWeight:700,color:'#3b82f6'}}>

          💰 إجمالي قيمة المخزون: ${filtered.reduce((s,p)=>s+(p.stock||0)*Number(p.price),0).toFixed(0)} {CUR}

        </div>

      </div>

    </div>

  )

}



/* ══════════════════════════════════════════

   📋 الطلبيات (مع الخريطة)

══════════════════════════════════════════ */

