import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, CUR, WA_DEFAULT } from '../styles/constants.js'
import { softDelete, logActivity, printThermal, printA4 } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'
import useToast from '../hooks/useToast.jsx'
import useConfirm from '../hooks/useConfirm.jsx'

export default function Purchases() {

  const [showToast,ToastUI]=useToast()

  const [suppliers,setSuppliers]=useState([]); const [products,setProducts]=useState([])

  const [purchases,setPurchases]=useState([]); const [items,setItems]=useState([])

  const [suppId,setSuppId]=useState(''); const [date,setDate]=useState(new Date().toISOString().split('T')[0])

  const [showModal,setShowModal]=useState(false)

  const [showNewProdModal,setShowNewProdModal]=useState(false)

  const [modal,setModal]=useState({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})

  const [newProd,setNewProd]=useState({name:'',price:'',units:12,brandId:''})

  const [brands,setBrands]=useState([])

  const [saving,setSaving]=useState(false)



  const autoCarton=(price,units)=>parseFloat(price||0)*parseInt(units||12)



  useEffect(()=>{

    const load=async()=>{

      const [{data:s},{data:p},{data:pur},{data:b}]=await Promise.all([

        supabase.from('suppliers').select('id,name').order('name'),

        supabase.from('products').select('id,name,units,cost_price,price').order('name'),

        supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20),

        supabase.from('brands').select('id,name').order('name'),

      ])

      setSuppliers(s||[]); setProducts(p||[]); setPurchases(pur||[]); setBrands(b||[])

    }

    load()

  },[])



  const total=items.reduce((s,i)=>s+i.totalPurchase,0)



  const addItem=()=>{

    const prod=products.find(p=>p.id==modal.productId)

    if(!prod||!modal.cartons||!modal.purchasePrice){showToast('اختر منتجاً وأدخل البيانات','error');return}

    const existing=items.find(i=>i.productId==prod.id)

    if(existing){

      const cartonPrice=autoCarton(modal.purchasePrice,modal.unitsPerCarton)

      const newCartons=existing.cartons+parseInt(modal.cartons)

      setItems(prev=>prev.map(i=>i.productId==prod.id?{

        ...i,cartons:newCartons,

        totalUnits:newCartons*parseInt(modal.unitsPerCarton),

        cartonPrice,totalPurchase:newCartons*cartonPrice

      }:i))

      showToast('✅ تمت إضافة الكمية للمنتج الموجود')

    } else {

      const totalUnits=parseInt(modal.cartons)*parseInt(modal.unitsPerCarton)

      const cartonPrice=autoCarton(modal.purchasePrice,modal.unitsPerCarton)

      setItems(prev=>[...prev,{

        id:Date.now(),productId:prod.id,productName:prod.name,

        cartons:parseInt(modal.cartons),unitsPerCarton:parseInt(modal.unitsPerCarton),

        totalUnits,purchasePrice:parseFloat(modal.purchasePrice),

        sellPrice:parseFloat(modal.sellPrice)||0,

        cartonPrice,totalPurchase:parseInt(modal.cartons)*cartonPrice

      }])

    }

    setShowModal(false); setModal({productId:'',cartons:1,unitsPerCarton:12,purchasePrice:0,sellPrice:0})

  }



  const saveNewProduct=async()=>{

    if(!newProd.name||!newProd.price){showToast('الاسم والسعر مطلوبان','error');return}

    try {

      const id=Date.now()

      await supabase.from('products').insert({

        id,name:newProd.name.trim(),price:parseFloat(newProd.price),

        units:parseInt(newProd.units)||12,

        brand_id:newProd.brandId?parseInt(newProd.brandId):null,

        stock:0,disabled:false,created_at:new Date().toISOString()

      })

      await logActivity('إضافة منتج', `تم إضافة المنتج: ${newProd.name}`)

      const {data:p}=await supabase.from('products').select('id,name,units,cost_price,price').order('name')

      setProducts(p||[])

      setModal(m=>({...m,productId:String(id),unitsPerCarton:parseInt(newProd.units)||12}))

      setNewProd({name:'',price:'',units:12,brandId:''})

      setShowNewProdModal(false); setShowModal(true)

      showToast('✅ تمت إضافة المنتج')

    } catch (err) {

      showToast('❌ خطأ: '+err.message, 'error')

    }

  }



  const save=async()=>{

    if(!suppId){showToast('اختر المورد','error');return}

    if(items.length===0){showToast('أضف منتجاً','error');return}

    setSaving(true)

    try {

      const supplier=suppliers.find(s=>s.id==suppId)

      const purchaseId=Date.now()

      await supabase.from('purchases').insert({id:purchaseId,supplier_id:parseInt(suppId),supplier_name:supplier?.name,date,items:JSON.stringify(items),total})

      

      for(const item of items){

        const {data:p}=await supabase.from('products').select('stock').eq('id',item.productId).maybeSingle()

        if(p) await supabase.from('products').update({

          stock:(p.stock||0)+item.cartons,

          cost_price:item.purchasePrice,

          carton_price:item.cartonPrice

        }).eq('id',item.productId)

      }

      

      await logActivity('إضافة شراء', `تم إضافة فاتورة شراء بقيمة ${total} دج`)

      

      printA4(`

        <div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div>

        <div style="text-align:left"><p><strong>رقم:</strong> ${purchaseId}</p><p><strong>التاريخ:</strong> ${date}</p><p><strong>المورد:</strong> ${supplier?.name||'—'}</p></div></div>

        <table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>إجمالي قطع</th><th>سعر الشراء/قطعة</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead>

        <tbody>${items.map(i=>`<tr>

          <td>${i.productName}</td><td style="text-align:center">${i.cartons}</td>

          <td style="text-align:center">${i.unitsPerCarton}</td><td style="text-align:center">${i.totalUnits}</td>

          <td style="text-align:center">${i.purchasePrice} ${CUR}</td>

          <td style="text-align:center;font-weight:700;color:#7c3aed">${i.cartonPrice.toFixed(0)} ${CUR}</td>

          <td style="text-align:center;font-weight:700;color:#dc2626">${i.totalPurchase.toFixed(0)} ${CUR}</td>

        </tr>`).join('')}

        <tr class="total-row"><td colspan="6">الإجمالي الكلي</td><td>${total.toFixed(0)} ${CUR}</td></tr>

        </tbody></table>

        <div class="footer">نقاء — ${new Date().toLocaleDateString('ar-DZ')}</div>

      `)

      showToast('✅ تم حفظ الفاتورة وطباعتها')

      setSuppId('');setItems([])

      const {data:pur}=await supabase.from('purchases').select('*').order('id',{ascending:false}).limit(20)

      setPurchases(pur||[])

    } catch (err) {

      showToast('❌ خطأ: '+err.message, 'error')

    } finally {

      setSaving(false)

    }

  }



  return (

    <div>{ToastUI}

      <h1 style={{fontSize:20,fontWeight:900,marginBottom:20,color:CLR.text}}>🛒 المشتريات</h1>

      <div style={S.card}>

        <h3 style={{fontWeight:800,marginBottom:14,color:'#dc2626'}}>➕ فاتورة شراء جديدة</h3>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>

          <div><label style={S.label}>المورد *</label>

            <select style={S.input} value={suppId} onChange={e=>setSuppId(e.target.value)}>

              <option value="">-- اختر مورداً --</option>

              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}

            </select></div>

          <div><label style={S.label}>التاريخ</label>

            <input style={S.input} type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>

        </div>



        {items.length>0&&(

          <div style={{overflowX:'auto',marginBottom:14}}>

            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>

              <thead>

                <tr style={{background:'linear-gradient(135deg,#1E293B,#0F172A)'}}>

                  {['المنتج','الكرتونات','قطع/كرتون','إجمالي قطع','سعر/قطعة','سعر الكرتون','الإجمالي',''].map((h,i)=>(

                    <th key={i} style={{...S.th,color:'white',background:'transparent',padding:'10px 8px'}}>{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {items.map((item,i)=>(

                  <tr key={item.id} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'white':'#fafafa'}}>

                    <td style={{...S.td,fontWeight:700}}>{item.productName}</td>

                    <td style={{...S.td,textAlign:'center',fontWeight:700}}>{item.cartons}</td>

                    <td style={{...S.td,textAlign:'center'}}>{item.unitsPerCarton}</td>

                    <td style={{...S.td,textAlign:'center',color:CLR.textSm}}>{item.totalUnits}</td>

                    <td style={{...S.td,textAlign:'center'}}>{item.purchasePrice} {CUR}</td>

                    <td style={{...S.td,textAlign:'center',fontWeight:700,color:'#7c3aed'}}>{item.cartonPrice.toFixed(0)} {CUR}</td>

                    <td style={{...S.td,textAlign:'center',fontWeight:900,color:'#dc2626'}}>{item.totalPurchase.toFixed(0)} {CUR}</td>

                    <td style={S.td}><button style={{...S.btnSm,background:'#fee2e2',color:'#dc2626'}} onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))}>🗑️</button></td>

                  </tr>

                ))}

                <tr style={{background:'#fff7ed',fontWeight:900}}>

                  <td colSpan={6} style={{...S.td,fontSize:15}}>💰 الإجمالي الكلي للفاتورة</td>

                  <td style={{...S.td,fontSize:18,color:'#dc2626',fontWeight:900}}>{total.toFixed(0)} {CUR}</td>

                  <td style={S.td}></td>

                </tr>

              </tbody>

            </table>

          </div>

        )}

        {items.length===0&&(

          <div style={{textAlign:'center',padding:'20px',color:CLR.textSm,border:'2px dashed #e2e8f0',borderRadius:12,marginBottom:14}}>

            📦 لا توجد منتجات — ابدأ بإضافة منتج

          </div>

        )}



        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center',flexWrap:'wrap'}}>

          <button onClick={()=>setShowModal(true)} style={{...S.btnGray,background:CLR.success,color:'white'}}>➕ إضافة منتج</button>

          <button style={S.btn} onClick={save} disabled={saving}>{saving?'⏳...':'💾 حفظ + طباعة'}</button>

          {items.length>0&&<span style={{fontWeight:900,color:'#dc2626',fontSize:18}}>💰 {total.toFixed(0)} {CUR}</span>}

        </div>

      </div>



      {showModal&&(

        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center'}}>

          <div style={{background:'white',borderRadius:20,padding:28,width:520,maxWidth:'95vw',direction:'rtl',maxHeight:'90vh',overflowY:'auto'}}>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>

              <h3 style={{fontWeight:800,fontSize:18}}>➕ إضافة منتج للفاتورة</h3>

              <button onClick={()=>setShowModal(false)} style={{background:'#f1f5f9',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:16}}>✕</button>

            </div>

            <div style={{display:'grid',gap:12}}>

              <div>

                <label style={S.label}>المنتج</label>

                <div style={{display:'flex',gap:8}}>

                  <select style={{...S.input,flex:1}} value={modal.productId} onChange={e=>{

                    const p=products.find(x=>x.id==e.target.value)

                    setModal(m=>({...m,productId:e.target.value,unitsPerCarton:p?.units||12,purchasePrice:p?.cost_price||0,sellPrice:p?.price||0}))

                  }}>

                    <option value="">-- اختر منتجاً --</option>

                    {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}

                  </select>

                  <button onClick={()=>{setShowModal(false);setShowNewProdModal(true)}}

                    style={{...S.btn,padding:'8px 14px',fontSize:12,whiteSpace:'nowrap'}}>

                    + جديد

                  </button>

                </div>

              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>

                <div><label style={S.label}>الكرتونات</label><NumInput value={modal.cartons} onChange={e=>setModal(m=>({...m,cartons:parseInt(e.target.value)||1}))}/></div>

                <div><label style={S.label}>قطع/كرتون</label><NumInput value={modal.unitsPerCarton} onChange={e=>setModal(m=>({...m,unitsPerCarton:parseInt(e.target.value)||12}))}/></div>

                <div><label style={S.label}>سعر شراء القطعة</label><NumInput value={modal.purchasePrice} onChange={e=>setModal(m=>({...m,purchasePrice:parseFloat(e.target.value)||0}))}/></div>

                <div><label style={S.label}>سعر بيع القطعة</label><NumInput value={modal.sellPrice} onChange={e=>setModal(m=>({...m,sellPrice:parseFloat(e.target.value)||0}))}/></div>

              </div>

              {modal.purchasePrice>0&&modal.unitsPerCarton>0&&(

                <div style={{background:'#f0fdf4',borderRadius:10,padding:12,fontSize:13}}>

                  <div>📦 <strong>{modal.cartons*modal.unitsPerCarton}</strong> قطعة إجمالاً</div>

                  <div style={{marginTop:4}}>💜 سعر الكرتون = {modal.purchasePrice} × {modal.unitsPerCarton} = <strong style={{color:'#7c3aed'}}>{autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} {CUR}</strong></div>

                  <div style={{marginTop:4}}>💰 الإجمالي = {modal.cartons} × {autoCarton(modal.purchasePrice,modal.unitsPerCarton).toFixed(0)} = <strong style={{color:'#dc2626',fontSize:16}}>{(modal.cartons*autoCarton(modal.purchasePrice,modal.unitsPerCarton)).toFixed(0)} {CUR}</strong></div>

                </div>

              )}

            </div>

            <div style={{display:'flex',gap:10,marginTop:16}}>

              <button style={S.btn} onClick={addItem}>✅ إضافة للفاتورة</button>

              <button style={S.btnGray} onClick={()=>setShowModal(false)}>إلغاء</button>

            </div>

          </div>

        </div>

      )}



      {showNewProdModal&&(

        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}>

          <div style={{background:'white',borderRadius:20,padding:28,width:440,maxWidth:'95vw',direction:'rtl'}}>

            <h3 style={{fontWeight:800,marginBottom:16,fontSize:18}}>🆕 إضافة منتج جديد</h3>

            <div style={{display:'grid',gap:12}}>

              <div><label style={S.label}>اسم المنتج *</label>

                <input style={S.input} value={newProd.name} onChange={e=>setNewProd(f=>({...f,name:e.target.value}))} /></div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>

                <div><label style={S.label}>سعر البيع *</label>

                  <NumInput value={newProd.price} onChange={e=>setNewProd(f=>({...f,price:e.target.value}))} /></div>

                <div><label style={S.label}>قطع/كرتون</label>

                  <NumInput value={newProd.units} onChange={e=>setNewProd(f=>({...f,units:e.target.value}))} /></div>

              </div>

              <div><label style={S.label}>العلامة التجارية</label>

                <select style={S.input} value={newProd.brandId} onChange={e=>setNewProd(f=>({...f,brandId:e.target.value}))}>

                  <option value="">-- بدون --</option>

                  {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}

                </select></div>

            </div>

            <div style={{display:'flex',gap:10,marginTop:18}}>

              <button style={S.btn} onClick={saveNewProduct}>💾 حفظ وإضافة للفاتورة</button>

              <button style={S.btnGray} onClick={()=>{setShowNewProdModal(false);setShowModal(true)}}>رجوع</button>

            </div>

          </div>

        </div>

      )}



      <div style={S.card}>

        <h3 style={{fontWeight:800,marginBottom:14}}>سجل الفواتير</h3>

        <div style={{overflowX:'auto'}}>

          <table style={{width:'100%',borderCollapse:'collapse'}}>

            <thead><tr><th style={S.th}>#</th><th style={S.th}>المورد</th><th style={S.th}>التاريخ</th><th style={S.th}>المنتجات</th><th style={S.th}>الإجمالي</th><th style={S.th}>طباعة</th></tr></thead>

            <tbody>{purchases.map(p=>{

              const its=typeof p.items==='string'?JSON.parse(p.items||'[]'):(p.items||[])

              return (

                <tr key={p.id} className='nq-tr'>

                  <td style={{...S.td,fontSize:11,color:CLR.textSm}}>{p.id}</td>

                  <td style={{...S.td,fontWeight:700}}>{p.supplier_name}</td>

                  <td style={S.td}>{p.date}</td>

                  <td style={S.td}>{its.length} منتج</td>

                  <td style={{...S.td,color:CLR.accent,fontWeight:700}}>{Number(p.total).toFixed(0)} {CUR}</td>

                  <td style={S.td}>

                    <div style={{display:'flex',gap:4}}>

                      <button style={{...S.btnSm,background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>{

                        printA4(`<div class="header"><div><h1>🛍️ نقاء</h1><p>فاتورة شراء</p></div>

                        <div><p>رقم: ${p.id}</p><p>${p.date}</p><p>المورد: ${p.supplier_name}</p></div></div>

                        <table><thead><tr><th>المنتج</th><th>الكرتونات</th><th>قطع/كرتون</th><th>سعر الكرتون</th><th>الإجمالي</th></tr></thead>

                        <tbody>${its.map(i=>`<tr><td>${i.productName}</td><td>${i.cartons||'—'}</td><td>${i.unitsPerCarton||'—'}</td><td>${(i.cartonPrice||0).toFixed(0)}</td><td>${i.totalPurchase.toFixed(0)}</td></tr>`).join('')}

                        <tr class="total-row"><td colspan="4">الإجمالي</td><td>${Number(p.total).toFixed(0)} ${CUR}</td></tr></tbody></table>`)

                      }}>A4</button>

                      <button style={{...S.btnSm,background:'#f0fdf4',color:'#059669'}} onClick={()=>{

                        const its2=typeof p.items==='string'?JSON.parse(p.items):p.items

                        printThermal(`<div class="center bold big">نقاء</div><div class="line"></div>

                        <div class="row"><span>المورد:</span><span>${p.supplier_name}</span></div>

                        <div class="row"><span>التاريخ:</span><span>${p.date}</span></div><div class="line"></div>

                        ${its2.map(i=>`<div class="row"><span>${i.productName}</span><span>${i.totalPurchase.toFixed(0)}</span></div>`).join('')}

                        <div class="line"></div><div class="row total"><span>الإجمالي:</span><span>${Number(p.total).toFixed(0)} ${CUR}</span></div>`)

                      }}>🖨️</button>

                    </div>

                  </td>

                </tr>

              )

            })}

            {purchases.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:24,color:CLR.textSm}}>لا توجد فواتير</td></tr>}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  )

}



/* ══════════════════════════════════════════

   📦 المخزون + Excel

══════════════════════════════════════════ */

