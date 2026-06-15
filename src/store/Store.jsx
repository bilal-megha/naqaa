/**
 * Store.jsx — نقاء v5 Final
 * ✅ طلب بالكرتون | ✅ قائمة جانبية | ✅ شارة عروض على المنتج
 * ✅ OTP تسجيل + تأكيد طلب | ✅ نقاط ولاء | ✅ تقييمات | ✅ تاريخ طلبيات
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase.js'

const hashPwd = p => { try { return CryptoJS.SHA256(p).toString() } catch { return p } }
const WA_NUM = '213696668065'
const POINTS_RATE = 10 // نقطة لكل 100 دج

function toast(msg, err=false) {
  document.querySelectorAll('.nq-t').forEach(t=>t.remove())
  const el=document.createElement('div'); el.className='nq-t'+(err?' e':'')
  el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),3000)
}

function useTimer(end) {
  const [tl,setTl]=useState({h:'00',m:'00',s:'00',alive:false})
  useEffect(()=>{
    const tick=()=>{
      const d=end-Date.now()
      if(d<=0){setTl({h:'00',m:'00',s:'00',alive:false});return}
      setTl({h:String(Math.floor(d/3600000)).padStart(2,'0'),m:String(Math.floor((d%3600000)/60000)).padStart(2,'0'),s:String(Math.floor((d%60000)/1000)).padStart(2,'0'),alive:true})
    }
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id)
  },[end])
  return tl
}

/* ═══ MODALS (outside main = no focus loss) ═══ */

function LoginModal({onClose,onLogin,onRegister}){
  const [e,setE]=useState(''); const [p,setP]=useState(''); const [ld,setLd]=useState(false)
  const sub=async()=>{
    if(!e||!p){toast('أدخل البيانات',true);return}; setLd(true)
    const {data}=await supabase.from('customers').select('*').or(`email.eq.${e},phone.eq.${e}`).eq('password',hashPwd(p)).maybeSingle()
    if(data) onLogin(data); else toast('البيانات غير صحيحة',true); setLd(false)
  }
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div style={{textAlign:'center',padding:'24px 18px 8px'}}><div style={{fontSize:40}}>🛍️</div><h2 style={{fontSize:20,fontWeight:900,margin:'8px 0 4px'}}>نقاء</h2></div>
      <div className="mb">
        <label className="fl">البريد أو الهاتف</label>
        <input className="fi" type="email" value={e} onChange={ev=>setE(ev.target.value)} onKeyDown={ev=>ev.key==='Enter'&&sub()} autoComplete="email" autoFocus/>
        <label className="fl">كلمة المرور</label>
        <input className="fi" type="password" value={p} onChange={ev=>setP(ev.target.value)} onKeyDown={ev=>ev.key==='Enter'&&sub()} autoComplete="current-password"/>
        <button className="ab" onClick={sub} disabled={ld}>{ld?'⏳ جاري الدخول...':'🔐 دخول'}</button>
        <button className="ab purple" onClick={onRegister}>📝 إنشاء حساب جديد</button>
        <div style={{textAlign:'center'}}><button onClick={onClose} style={{background:'none',border:'none',color:'#FF6B35',cursor:'pointer',fontSize:14,fontFamily:'inherit',fontWeight:600}}>متابعة كزائر</button></div>
      </div>
    </div>
  </div>)
}

function RegisterModal({onClose,onSuccess}){
  const [form,setForm]=useState({name:'',email:'',phone:'',address:'',pass:'',pass2:''})
  const [step,setStep]=useState(1); const [otp,setOtp]=useState(''); const [gen,setGen]=useState('')
  const [digs,setDigs]=useState(['','','','']); const [ld,setLd]=useState(false)
  const refs=[useRef(null),useRef(null),useRef(null),useRef(null)]
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const dig=(i,v)=>{const nd=[...digs];nd[i]=v.replace(/\D/,'');setDigs(nd);if(nd[i]&&i<3)refs[i+1].current?.focus();if(!nd[i]&&i>0)refs[i-1].current?.focus();setOtp(nd.join(''))}
  const sub=async()=>{
    const {name,email,phone,pass,pass2}=form
    if(!name||!email||!phone||!pass){toast('أكمل البيانات',true);return}
    if(pass!==pass2){toast('كلمتا المرور غير متطابقتان',true);return}
    setLd(true)
    const {data:ex}=await supabase.from('customers').select('id').eq('email',email).maybeSingle()
    if(ex){toast('البريد مسجّل مسبقاً',true);setLd(false);return}
    const code=String(Math.floor(1000+Math.random()*9000)); setGen(code); setStep(2)
    toast('كود التحقق: '+code); setLd(false)
  }
  const ver=async()=>{
    if(otp!==gen){toast('الكود غير صحيح',true);return}; setLd(true)
    const {error}=await supabase.from('customers').insert({id:Date.now(),name:form.name,email:form.email,phone:form.phone,address:form.address,password:hashPwd(form.pass),points:0,tier:'M1',created_at:new Date().toISOString()})
    if(error){toast('خطأ: '+error.message,true);setLd(false);return}
    toast('✅ تم التسجيل!'); onSuccess(); setLd(false)
  }
  if(step===2)return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div className="mh"><h3>📱 تأكيد الحساب</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb" style={{textAlign:'center'}}>
        <p style={{fontSize:14,color:'#7A6A5A',marginBottom:16}}>أدخل كود التحقق</p>
        <div className="otp-r">{digs.map((d,i)=><input key={i} ref={refs[i]} className="oi" value={d} inputMode="numeric" maxLength={1} onChange={e=>dig(i,e.target.value)} onKeyDown={e=>{if(e.key==='Backspace'&&!d&&i>0)refs[i-1].current?.focus()}}/>)}</div>
        <div style={{background:'#fef9c3',borderRadius:12,padding:12,marginBottom:16,fontSize:13}}>🔑 كودك: <strong style={{fontSize:20,color:'#dc2626'}}>{gen}</strong></div>
        <button className="ab" onClick={ver} disabled={ld||otp.length<4}>{ld?'⏳...':'✅ تأكيد التسجيل'}</button>
        <button style={{background:'none',border:'none',color:'#FF6B35',cursor:'pointer',fontSize:13,fontFamily:'inherit',display:'block',width:'100%',marginTop:6}} onClick={()=>{setStep(1);setDigs(['','','','']);setOtp('')}}>← تعديل</button>
      </div>
    </div>
  </div>)
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div className="mh"><h3>📝 حساب جديد</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        <label className="fl">الاسم *</label><input className="fi" value={form.name} onChange={F('name')} autoComplete="name"/>
        <label className="fl">البريد *</label><input className="fi" type="email" value={form.email} onChange={F('email')} autoComplete="email"/>
        <label className="fl">الهاتف *</label><input className="fi" type="tel" value={form.phone} onChange={F('phone')} inputMode="numeric" autoComplete="tel" onKeyPress={e=>{if(!/[0-9+]/.test(e.key))e.preventDefault()}}/>
        <label className="fl">العنوان</label><input className="fi" value={form.address} onChange={F('address')} autoComplete="street-address"/>
        <label className="fl">كلمة المرور *</label><input className="fi" type="password" value={form.pass} onChange={F('pass')} autoComplete="new-password"/>
        <label className="fl">تأكيد كلمة المرور *</label><input className="fi" type="password" value={form.pass2} onChange={F('pass2')} autoComplete="new-password"/>
        <button className="ab" onClick={sub} disabled={ld}>{ld?'⏳...':'📱 التالي — تأكيد الهاتف'}</button>
      </div>
    </div>
  </div>)
}

function CartModal({cart,setCart,onClose,onCheckout,currency,promos}){
  const total=cart.reduce((s,i)=>s+i.cp*i.qty,0)
  const chg=(id,d)=>setCart(p=>p.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i))
  const rm=id=>setCart(p=>p.filter(i=>i.id!==id))
  // Buy X Get Y
  const bp=promos.find(p=>p.active&&p.type==='buy_x_get_y')
  const getBD=()=>{if(!bp)return 0;const pids=typeof bp.product_ids==='string'?JSON.parse(bp.product_ids||'[]'):(bp.product_ids||[]);const el=cart.filter(i=>pids.length===0||pids.includes(i.id));const tq=el.reduce((s,i)=>s+i.qty,0);if(tq<(bp.buy_qty||3)+(bp.get_qty||1))return 0;const ch=[...el].sort((a,b)=>a.cp-b.cp)[0];return(ch?.cp||0)*(bp.get_qty||1)}
  const bd=getBD()
  // Brand qty
  const brp=promos.find(p=>p.active&&p.type==='brand_qty')
  const getBrD=()=>{if(!brp)return 0;const bi=brp.brand_id?cart.filter(i=>i.brandId==brp.brand_id):cart;const tq=bi.reduce((s,i)=>s+i.qty*(i.units||12),0);if(tq<(brp.brand_qty||5))return 0;return bi.reduce((s,i)=>s+i.cp*i.qty,0)*(parseFloat(brp.discount_value)||0)/100}
  const brd=getBrD()
  // Vol discount
  const vt=[{min:500,d:5},{min:1000,d:10},{min:2000,d:15}]
  const ct=[...vt].reverse().find(t=>total>=t.min); const nt=vt.find(t=>total<t.min)
  const vd=ct?total*(ct.d/100):0
  const fin=Math.max(0,total-bd-brd-vd)
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms">
      <div className="mh2"></div>
      <div className="mh"><h3>🛒 السلة ({cart.reduce((s,i)=>s+i.qty,0)} كرتون)</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        {cart.length===0?<div style={{textAlign:'center',padding:40,color:'#7A6A5A'}}><div style={{fontSize:52,opacity:.3,marginBottom:12}}>🛒</div><p>السلة فارغة</p></div>:<>
          {cart.map(i=><div key={i.id} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid #F7F3EF',alignItems:'center'}}>
            {i.img?<img src={i.img} style={{width:58,height:58,borderRadius:12,objectFit:'cover',flexShrink:0}}/>:<div style={{width:58,height:58,borderRadius:12,background:'#F7F3EF',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🛍️</div>}
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{i.name}</div>
              <div style={{color:'#FF6B35',fontWeight:900,fontSize:13,marginTop:2}}>{i.cp} {currency}/كرتون × {i.qty} = {(i.cp*i.qty).toFixed(0)} {currency}</div>
              <div style={{fontSize:11,color:'#7A6A5A'}}>({i.units||12} قطعة/كرتون)</div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginTop:6}}>
                <button className="qb" onClick={()=>chg(i.id,-1)}>−</button>
                <span style={{fontWeight:800,fontSize:15,minWidth:22,textAlign:'center'}}>{i.qty}</span>
                <button className="qb" onClick={()=>chg(i.id,1)}>+</button>
              </div>
            </div>
            <button onClick={()=>rm(i.id)} style={{border:'none',background:'none',color:'#ef4444',cursor:'pointer',fontSize:18}}>🗑️</button>
          </div>)}
          {bd>0&&bp&&<div style={{background:'linear-gradient(135deg,#d1fae5,#a7f3d0)',borderRadius:14,padding:10,margin:'10px 0',textAlign:'center'}}><div style={{fontWeight:800,color:'#059669'}}>🎁 {bp.name}</div><div style={{fontSize:13,color:'#065f46',marginTop:2}}>خصم: <strong>{bd.toFixed(0)} {currency}</strong></div></div>}
          {brd>0&&brp&&<div style={{background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',borderRadius:14,padding:10,margin:'8px 0',textAlign:'center'}}><div style={{fontWeight:800,color:'#7c3aed'}}>⭐ {brp.name}</div><div style={{fontSize:13,color:'#5b21b6',marginTop:2}}>خصم: <strong>{brd.toFixed(0)} {currency}</strong></div></div>}
          <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 14px',margin:'10px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700}}>
              {ct?<span style={{color:'#10b981'}}>🎉 خصم {ct.d}% — وفّرت {vd.toFixed(0)} {currency}</span>:nt?<span>أضف {(nt.min-total).toFixed(0)} {currency} للحصول على {nt.d}% خصم</span>:<span>🏆 أقصى خصم!</span>}
              <span style={{color:'#FF6B35'}}>{Math.min(100,total/2000*100).toFixed(0)}%</span>
            </div>
            <div style={{background:'#E8DDD5',borderRadius:30,height:7,marginTop:8,overflow:'hidden'}}>
              <div style={{height:'100%',background:'linear-gradient(90deg,#FF6B35,#7C3AED)',borderRadius:30,width:`${Math.min(100,total/2000*100)}%`,transition:'width .5s'}}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#94a3b8',marginTop:4}}><span>500→5%</span><span>1000→10%</span><span>2000→15%</span></div>
          </div>
          {(bd+brd+vd)>0&&<div style={{fontSize:13,color:'#94a3b8',textDecoration:'line-through',textAlign:'left',marginBottom:4}}>{total.toFixed(0)} {currency}</div>}
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:18,marginBottom:16}}><span>الإجمالي</span><span style={{color:'#FF6B35'}}>{fin.toFixed(0)} {currency}</span></div>
          <button className="ab" onClick={()=>onCheckout(fin)}>🛒 إتمام الشراء</button>
        </>}
      </div>
    </div>
  </div>)
}

function CheckoutModal({cart,finalTotal,onClose,onSuccess,currency,waNum,storeName}){
  const [form,setForm]=useState({name:'',phone:'',address:''})
  const [step,setStep]=useState(1); const [otp,setOtp]=useState(''); const [gen,setGen]=useState('')
  const [digs,setDigs]=useState(['','','','']); const [ld,setLd]=useState(false)
  const refs=[useRef(null),useRef(null),useRef(null),useRef(null)]
  const F=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const dig=(i,v)=>{const nd=[...digs];nd[i]=v.replace(/\D/,'');setDigs(nd);if(nd[i]&&i<3)refs[i+1].current?.focus();if(!nd[i]&&i>0)refs[i-1].current?.focus();setOtp(nd.join(''))}
  const goOtp=()=>{if(!form.name||!form.phone){toast('الاسم والهاتف مطلوبان',true);return};const c=String(Math.floor(1000+Math.random()*9000));setGen(c);setStep(2);toast('كود تأكيد طلبيتك: '+c)}
  const confirm=async()=>{
    if(otp!==gen){toast('الكود غير صحيح',true);return}; setLd(true)
    const oid=Date.now()
    const {error}=await supabase.from('orders').insert({id:oid,customer_name:form.name,customer_phone:form.phone,customer_address:form.address,date:new Date().toLocaleString('ar-DZ'),items:JSON.stringify(cart.map(i=>({id:i.id,name:i.name,quantity:i.qty,cartons:i.qty,units:i.units||12,price:i.cp}))),total:finalTotal,status:'processing'})
    if(error){toast('خطأ: '+error.message,true);setLd(false);return}
    for(const item of cart){const {data:p}=await supabase.from('products').select('stock').eq('id',item.id).maybeSingle();if(p)await supabase.from('products').update({stock:Math.max(0,(p.stock||0)-item.qty*(item.units||12))}).eq('id',item.id)}
    if(waNum){const msg=`مرحباً ${form.name}، تم تأكيد طلبك رقم ${oid} ✅\nالإجمالي: ${finalTotal.toFixed(0)} ${currency}\n— ${storeName}`;window.open(`https://wa.me/${form.phone.replace(/^0/,'213')}?text=${encodeURIComponent(msg)}`,'_blank')}
    onSuccess(oid,form.name); setLd(false)
  }
  if(step===2)return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div className="mh"><h3>🔐 تأكيد الطلبية</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb" style={{textAlign:'center'}}>
        <p style={{fontSize:14,color:'#7A6A5A',marginBottom:8}}>أدخل كود التأكيد</p>
        <p style={{fontWeight:700,color:'#FF6B35',marginBottom:16}}>{form.phone}</p>
        <div className="otp-r">{digs.map((d,i)=><input key={i} ref={refs[i]} className="oi" value={d} inputMode="numeric" maxLength={1} onChange={e=>dig(i,e.target.value)} onKeyDown={e=>{if(e.key==='Backspace'&&!d&&i>0)refs[i-1].current?.focus()}}/>)}</div>
        <div style={{background:'#fef9c3',borderRadius:12,padding:12,marginBottom:14,fontSize:13}}>🔑 كود التأكيد: <strong style={{fontSize:20,color:'#dc2626'}}>{gen}</strong></div>
        <div style={{background:'#FFF0EB',borderRadius:14,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:700}}>إجمالي الطلب</span><span style={{fontWeight:900,color:'#FF6B35',fontSize:18}}>{finalTotal.toFixed(0)} {currency}</span></div>
        <button className="ab green" onClick={confirm} disabled={ld||otp.length<4}>{ld?'⏳...':'✅ تأكيد الطلبية'}</button>
      </div>
    </div>
  </div>)
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div className="mh"><h3>📋 بيانات التوصيل</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        <label className="fl">الاسم *</label><input className="fi" value={form.name} onChange={F('name')} autoComplete="name"/>
        <label className="fl">الهاتف *</label><input className="fi" type="tel" value={form.phone} onChange={F('phone')} inputMode="numeric" autoComplete="tel" onKeyPress={e=>{if(!/[0-9+]/.test(e.key))e.preventDefault()}}/>
        <label className="fl">العنوان</label><textarea className="fi" rows="2" value={form.address} onChange={F('address')} style={{resize:'none'}} autoComplete="street-address"></textarea>
        <div style={{background:'#FFF0EB',borderRadius:14,padding:'12px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:700}}>إجمالي الطلب</span><span style={{fontWeight:900,color:'#FF6B35',fontSize:18}}>{finalTotal.toFixed(0)} {currency}</span></div>
        <button className="ab" onClick={goOtp}>🔐 التالي — تأكيد بكود</button>
      </div>
    </div>
  </div>)
}

function DetailModal({product,wishlist,onClose,onAddCart,onToggleWish,currency,products,promos,sevenAgo,onShow}){
  const [reviews,setReviews]=useState([]); const [myR,setMyR]=useState(0); const [myCmt,setMyCmt]=useState(''); const [svR,setSvR]=useState(false)
  if(!product)return null; const p=product
  const disc=Number(p.discount)||0; const fp=disc>0?(p.price*(1-disc/100)).toFixed(0):p.price
  const cp=p.carton_price?Number(p.carton_price):(Number(p.price)*(p.units||12))
  const promo=promos.find(pr=>{if(!pr.active)return false;const pids=typeof pr.product_ids==='string'?JSON.parse(pr.product_ids||'[]'):(pr.product_ids||[]);return pids.length===0||pids.includes(p.id)})
  const related=products.filter(r=>(r.category_id===p.category_id||r.brand_id===p.brand_id)&&r.id!==p.id&&!r.disabled).slice(0,6)
  useEffect(()=>{supabase.from('reviews').select('*').eq('product_id',p.id).order('id',{ascending:false}).then(({data})=>setReviews(data||[]))},[p.id])
  const avg=reviews.length?reviews.reduce((s,r)=>s+r.rating,0)/reviews.length:0
  const subR=async()=>{if(!myR){toast('اختر عدد النجوم',true);return};setSvR(true);await supabase.from('reviews').insert({id:Date.now(),product_id:p.id,rating:myR,comment:myCmt,date:new Date().toLocaleDateString('ar-DZ')});toast('شكراً لتقييمك!');const {data}=await supabase.from('reviews').select('*').eq('product_id',p.id).order('id',{ascending:false});setReviews(data||[]);setMyR(0);setMyCmt('');setSvR(false)}
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms">
      <div className="mh2"></div>
      <div style={{position:'relative'}}>
        {p.image?<img src={p.image} style={{width:'100%',height:260,objectFit:'cover',display:'block'}} alt={p.name}/>:<div style={{width:'100%',height:200,background:'#F8F4F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56}}>🛍️</div>}
        {promo&&<div style={{position:'absolute',top:12,right:12,background:'rgba(30,30,30,.85)',color:'white',padding:'6px 12px',borderRadius:20,fontSize:12,fontWeight:800}}>📢 {promo.name||'عرض خاص'}</div>}
      </div>
      <div className="mh"><h3 style={{flex:1,fontSize:15}}>{p.name}</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div>
            {disc>0&&<span style={{fontSize:13,color:'#94a3b8',textDecoration:'line-through',marginLeft:8}}>{p.price} {currency}/قطعة</span>}
            <span style={{fontSize:22,fontWeight:900,color:'#FF6B35'}}>{fp} {currency}/قطعة</span>
            {disc>0&&<span style={{background:'#dc2626',color:'white',fontSize:11,fontWeight:800,padding:'2px 6px',borderRadius:20,marginRight:6}}>-{disc}%</span>}
          </div>
          <button onClick={()=>onToggleWish(p.id)} style={{width:40,height:40,borderRadius:'50%',background:wishlist.includes(p.id)?'#FFF0EB':'#F7F3EF',border:'none',cursor:'pointer',fontSize:20}}><span style={{color:wishlist.includes(p.id)?'#FF6B35':'#CBD5E1'}}>♥</span></button>
        </div>
        <div style={{background:'#FFF0EB',borderRadius:12,padding:'10px 14px',marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700}}>📦 سعر الكرتون ({p.units||12} قطعة)</div>
          <div style={{fontSize:20,fontWeight:900,color:'#FF6B35',marginTop:4}}>{cp.toFixed(0)} {currency}</div>
        </div>
        {(p.stock||0)>0&&(p.stock||0)<(p.units||12)*3&&<p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:8}}>⚠️ متبقي {Math.floor((p.stock||0)/(p.units||12))} كرتون فقط!</p>}
        {(p.stock||0)===0&&<p style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:8}}>❌ نفذ من المخزون</p>}
        <div style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',borderRadius:12,padding:12,marginBottom:12,border:'1px solid #10b981'}}>
          <div style={{fontWeight:800,color:'#059669',marginBottom:8,fontSize:13}}>📦 كلما اشتريت أكثر وفّرت أكثر!</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,textAlign:'center'}}>
            {[{q:3,d:5},{q:6,d:10},{q:12,d:15}].map(({q,d})=><div key={q} style={{background:'white',borderRadius:10,padding:'7px 4px',border:'1px solid #10b981'}}><div style={{fontWeight:800,fontSize:13}}>{q}+ كرتون</div><div style={{color:'#10b981',fontWeight:700,fontSize:12}}>{d}% خصم</div><div style={{fontSize:11,color:'#065f46'}}>{(cp*(1-d/100)).toFixed(0)} {currency}</div></div>)}
          </div>
        </div>
        <button className="ab" onClick={()=>{onAddCart(p);onClose()}} disabled={(p.stock||0)===0}>🛒 {(p.stock||0)===0?'نفذ من المخزون':'أضف للسلة'}</button>
        <div style={{marginTop:16,borderTop:'1px solid #F7F3EF',paddingTop:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{fontWeight:800,fontSize:15}}>⭐ التقييمات</span>
            {reviews.length>0&&<span style={{color:'#f59e0b',fontWeight:700}}>{avg.toFixed(1)} ({reviews.length})</span>}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>أضف تقييمك</div>
            <div style={{display:'flex',gap:4,marginBottom:8}}>{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setMyR(s)} style={{fontSize:24,background:'none',border:'none',cursor:'pointer',color:s<=myR?'#f59e0b':'#d1d5db'}}>★</button>)}</div>
            <textarea className="fi" rows="2" value={myCmt} onChange={e=>setMyCmt(e.target.value)} placeholder="اكتب رأيك..." style={{resize:'none',marginBottom:8}}></textarea>
            <button className="ab" style={{marginBottom:0}} onClick={subR} disabled={svR||!myR}>{svR?'⏳...':'✅ إرسال التقييم'}</button>
          </div>
          {reviews.map(r=><div key={r.id} style={{background:'#F7F3EF',borderRadius:12,padding:10,marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#f59e0b',fontSize:14}}>{'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)}</span><span style={{fontSize:11,color:'#94a3b8'}}>{r.date}</span></div>{r.comment&&<p style={{fontSize:13,color:'#475569'}}>{r.comment}</p>}</div>)}
        </div>
        {related.length>0&&<div style={{marginTop:14}}><div style={{fontWeight:800,fontSize:15,marginBottom:10}}>🔄 قد يعجبك أيضاً</div><div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8}}>{related.map(r=><div key={r.id} onClick={()=>onShow(r)} style={{minWidth:90,cursor:'pointer',textAlign:'center',flexShrink:0}}>{r.image?<img src={r.image} style={{width:78,height:78,borderRadius:12,objectFit:'cover'}}/>:<div style={{width:78,height:78,borderRadius:12,background:'#F7F3EF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🛍️</div>}<div style={{fontSize:11,fontWeight:700,marginTop:4}}>{r.name}</div><div style={{fontSize:11,color:'#FF6B35',fontWeight:800}}>{r.price} {currency}</div></div>)}</div></div>}
      </div>
    </div>
  </div>)
}

function ProfileModal({customer,onClose,onLogout,currency}){
  const [orders,setOrders]=useState([]); const [tab,setTab]=useState('orders')
  useEffect(()=>{if(!customer)return;supabase.from('orders').select('*').or(`customer_phone.eq.${customer.phone},customer_name.eq.${customer.name}`).order('id',{ascending:false}).limit(10).then(({data})=>setOrders(data||[]))},[customer?.id])
  const tC={M1:'#e2e8f0',M2:'#dbeafe',M3:'#fef9c3'}[customer?.tier||'M1']||'#e2e8f0'
  const tT={M1:'#475569',M2:'#1d4ed8',M3:'#92400e'}[customer?.tier||'M1']||'#475569'
  const tL={M1:'🥉 M1',M2:'🥈 M2 مميز',M3:'🥇 M3 VIP'}[customer?.tier||'M1']||'M1'
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms">
      <div className="mh2"></div>
      <div className="mh"><h3>👤 حسابي</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        <div style={{background:'linear-gradient(135deg,#FF6B35,#7C3AED)',borderRadius:16,padding:16,color:'white',marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>👤</div>
          <div><div style={{fontWeight:900,fontSize:17}}>{customer?.name}</div><div style={{fontSize:12,opacity:.85}}>{customer?.phone}</div>
            <div style={{marginTop:6,display:'flex',gap:8}}><span style={{background:tC,color:tT,padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{tL}</span><span style={{background:'rgba(255,255,255,.25)',padding:'2px 10px',borderRadius:20,fontSize:12}}>⭐ {customer?.points||0} نقطة</span></div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>{[['orders','طلباتي 📋'],['points','نقاطي ⭐']].map(([v,l])=><button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:'10px',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13,background:tab===v?'#FF6B35':'#f1f5f9',color:tab===v?'white':'#475569'}}>{l}</button>)}</div>
        {tab==='orders'&&(orders.length===0?<div style={{textAlign:'center',padding:30,color:'#7A6A5A'}}><div style={{fontSize:40,marginBottom:8}}>📦</div><p>لا توجد طلبيات</p></div>:orders.map(o=>{const sc={pending:'#fef9c3',processing:'#dbeafe',shipped:'#e0e7ff',delivered:'#d1fae5'}[o.status]||'#f1f5f9';const sl={pending:'انتظار',processing:'تجهيز',shipped:'شُحن',delivered:'تسليم'}[o.status]||o.status;return(<div key={o.id} style={{background:'#F7F3EF',borderRadius:14,padding:12,marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><span style={{fontWeight:700,fontSize:13}}>طلب #{o.id}</span><span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700,background:sc}}>{sl}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#7A6A5A'}}><span>{o.date}</span><span style={{fontWeight:700,color:'#FF6B35'}}>{Number(o.total).toFixed(0)} {currency}</span></div></div>)}))}
        {tab==='points'&&<div style={{textAlign:'center',padding:20}}><div style={{fontSize:56,marginBottom:8}}>⭐</div><div style={{fontSize:32,fontWeight:900,color:'#f59e0b'}}>{customer?.points||0} نقطة</div><p style={{color:'#7A6A5A',fontSize:13,marginTop:8,lineHeight:1.6}}>تُضاف {POINTS_RATE} نقطة لكل 100 {currency} تشتريها.</p><div style={{background:'#fef9c3',borderRadius:12,padding:12,marginTop:12,fontSize:13}}><strong>رتبتك: {tL}</strong></div></div>}
        <button className="ab" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',marginTop:8}} onClick={onLogout}>🚪 تسجيل الخروج</button>
      </div>
    </div>
  </div>)
}

function TrackingModal({onClose,currency}){
  const [num,setNum]=useState(''); const [res,setRes]=useState(null)
  const steps=['pending','processing','shipped','delivered']
  const lbl={pending:'تم استلام الطلب',processing:'قيد التجهيز',shipped:'في الطريق',delivered:'تم التسليم'}
  const track=async()=>{if(!num)return;const {data}=await supabase.from('orders').select('*').eq('id',num).maybeSingle();setRes(data||false)}
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div className="mh"><h3>🔍 تتبع الطلب</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        <label className="fl">رقم الطلب</label>
        <input className="fi" value={num} onChange={e=>setNum(e.target.value)} inputMode="numeric" onKeyPress={e=>{if(!/[0-9]/.test(e.key))e.preventDefault()}}/>
        <button className="ab" onClick={track}>🔍 تتبع</button>
        {res===false&&<p style={{textAlign:'center',color:'#ef4444',marginTop:12}}>الرقم غير موجود</p>}
        {res&&res.id&&<div style={{marginTop:16}}>
          <div style={{background:'#FFF0EB',borderRadius:14,padding:14,marginBottom:16}}><div style={{fontWeight:800}}>طلب #{res.id}</div><div style={{color:'#7A6A5A',fontSize:13,marginTop:4}}>{res.customer_name}</div><div style={{color:'#FF6B35',fontWeight:900,fontSize:18,marginTop:4}}>{Number(res.total).toFixed(0)} {currency}</div></div>
          {steps.map((s,i)=>{const cur=steps.indexOf(res.status);return(<div key={s} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid #F7F3EF'}}><div style={{width:36,height:36,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,background:i<=cur?'linear-gradient(135deg,#FF6B35,#7C3AED)':'#F7F3EF',color:i<=cur?'white':'#AAA099'}}>{i<=cur?'✓':i+1}</div><div style={{paddingTop:8,fontWeight:700,fontSize:14,color:i<=cur?'#FF6B35':'#7A6A5A'}}>{lbl[s]}</div></div>)})}
        </div>}
      </div>
    </div>
  </div>)
}

function ContactModal({settings,onClose}){
  const WA=settings['contact_whatsapp']||settings['whatsapp_number']||WA_NUM
  return(<div className="mo" onClick={ev=>ev.target===ev.currentTarget&&onClose()}>
    <div className="ms ctr">
      <div className="mh"><h3>📞 اتصل بنا</h3><button className="mc" onClick={onClose}>×</button></div>
      <div className="mb">
        <div style={{textAlign:'center',marginBottom:20}}><div style={{fontSize:40,marginBottom:8}}>🛍️</div><div style={{fontWeight:900,fontSize:18}}>{settings['store_name']||'نقاء'}</div></div>
        {settings['contact_phone']&&<a href={`tel:${settings['contact_phone']}`} style={{display:'flex',alignItems:'center',gap:12,background:'#FFF0EB',borderRadius:14,padding:14,marginBottom:10,textDecoration:'none'}}><span style={{fontSize:28}}>📱</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>الهاتف</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_phone']}</div></div></a>}
        {WA&&<a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:12,background:'#f0fdf4',borderRadius:14,padding:14,marginBottom:10,textDecoration:'none'}}><span style={{fontSize:28}}>💬</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>واتساب</div><div style={{fontSize:13,color:'#7A6A5A'}}>{WA}</div></div></a>}
        {settings['contact_address']&&<div style={{display:'flex',alignItems:'center',gap:12,background:'#f1f5f9',borderRadius:14,padding:14,marginBottom:10}}><span style={{fontSize:28}}>📍</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>العنوان</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_address']}</div></div></div>}
        {settings['contact_hours']&&<div style={{display:'flex',alignItems:'center',gap:12,background:'#fef9c3',borderRadius:14,padding:14}}><span style={{fontSize:28}}>🕒</span><div><div style={{fontWeight:800,color:'#1A0A00'}}>ساعات العمل</div><div style={{fontSize:13,color:'#7A6A5A'}}>{settings['contact_hours']}</div></div></div>}
      </div>
    </div>
  </div>)
}

function ThankyouModal({orderId,customerName,points,storeName,onClose}){
  return(<div className="mo"><div className="ms ctr"><div className="mb" style={{textAlign:'center',padding:'32px 24px'}}>
    <div style={{fontSize:64,marginBottom:12}}>🎉</div>
    <h2 style={{fontSize:22,fontWeight:900,marginBottom:8}}>تمت طلبيتك بنجاح!</h2>
    <p style={{color:'#7A6A5A',marginBottom:6}}>شكراً {customerName}!</p>
    <p style={{color:'#FF6B35',fontWeight:800,fontSize:18,marginBottom:6}}>رقم الطلب: {orderId}</p>
    {points>0&&<div style={{background:'#fef9c3',borderRadius:12,padding:'8px 16px',marginBottom:12,display:'inline-block',fontWeight:700,color:'#92400e'}}>⭐ ربحت {points} نقطة ولاء!</div>}
    <p style={{fontSize:13,color:'#64748b',marginBottom:24}}>ستصلك رسالة واتساب بتفاصيل التوصيل</p>
    <button className="ab" onClick={onClose}>🏠 العودة للمتجر</button>
  </div></div></div>)
}

function SideMenu({onClose,onNav,onModal,customer,cart,wishlist,settings}){
  const cc=cart.reduce((s,i)=>s+i.qty,0)
  const items=[
    {icon:'🏠',l:'الرئيسية',a:()=>{onNav('home');onClose()}},
    {icon:'⚡',l:'العروض',a:()=>{onNav('promos');onClose()}},
    {icon:'📂',l:'الفئات والماركات',a:()=>{onNav('cats');onClose()}},
    {icon:'🔍',l:'بحث',a:()=>{onNav('search');onClose()}},
    {icon:'🛒',l:`السلة (${cc})`,a:()=>{onModal('cart');onClose()}},
    {icon:'❤️',l:`المفضلة (${wishlist.length})`,a:()=>{onNav('wish');onClose()}},
    {icon:'📦',l:'طلباتي',a:()=>{onModal(customer?'profile':'login');onClose()}},
    {icon:'🔍',l:'تتبع طلب',a:()=>{onModal('tracking');onClose()}},
    {icon:'📞',l:'اتصل بنا',a:()=>{onModal('contact');onClose()}},
    {icon:'🏢',l:'من نحن',a:()=>{onNav('about');onClose()}},
    {icon:customer?'👤':'🔐',l:customer?customer.name:'دخول',a:()=>{onModal(customer?'profile':'login');onClose()}},
  ]
  return(<div style={{position:'fixed',inset:0,zIndex:2000,display:'flex'}}>
    <div style={{flex:1,background:'rgba(0,0,0,.5)'}} onClick={onClose}></div>
    <div style={{width:280,background:'white',height:'100%',overflowY:'auto',animation:'sIR .3s ease',direction:'rtl'}}>
      <div style={{background:'linear-gradient(135deg,#FF6B35,#7C3AED)',padding:'24px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontWeight:900,fontSize:20,color:'white'}}>{settings['store_name']||'نقاء'}</div>{customer&&<div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:2}}>مرحباً، {customer.name}</div>}</div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:18}}>×</button>
        </div>
      </div>
      <div style={{padding:'8px 0'}}>
        {items.map((item,i)=><button key={i} onClick={item.a} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 20px',width:'100%',border:'none',background:'none',cursor:'pointer',fontFamily:'inherit',fontSize:15,fontWeight:600,color:'#1A0A00',borderBottom:'1px solid #F7F3EF',textAlign:'right'}} onMouseEnter={e=>e.currentTarget.style.background='#FFF0EB'} onMouseLeave={e=>e.currentTarget.style.background='none'}><span style={{fontSize:22,minWidth:30,textAlign:'center'}}>{item.icon}</span>{item.l}</button>)}
        <button onClick={()=>{document.body.classList.toggle('dark');localStorage.setItem('nqDark',document.body.classList.contains('dark')?'1':'0');onClose()}} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 20px',width:'100%',border:'none',background:'none',cursor:'pointer',fontFamily:'inherit',fontSize:15,fontWeight:600,color:'#1A0A00',textAlign:'right'}}><span style={{fontSize:22,minWidth:30,textAlign:'center'}}>🌙</span>وضع ليلي</button>
      </div>
    </div>
  </div>)
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'Tajawal',sans-serif;background:#F7F3EF;direction:rtl}
body.dark{background:#100800;color:#F0E8E0}
@keyframes sIR{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes sUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes zIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes wap{0%,100%{box-shadow:0 4px 20px rgba(37,211,102,.5)}50%{box-shadow:0 4px 32px rgba(37,211,102,.8),0 0 0 8px rgba(37,211,102,.15)}}
.nq-t{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1A0A00;color:white;padding:10px 22px;border-radius:30px;z-index:9999;font-size:13px;font-weight:700;animation:tin .3s ease;white-space:nowrap;max-width:85vw;text-align:center}
.nq-t.e{background:#ef4444}
.sh{background:linear-gradient(160deg,#FF6B35,#E8430E 65%,#C02E00);padding:12px 16px 14px;position:sticky;top:0;z-index:300;box-shadow:0 4px 24px rgba(255,107,53,.4)}
.sh-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;gap:8px}
.sh-ic{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;background:rgba(255,255,255,.2);color:white;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sh-lg{font-size:21px;font-weight:900;color:white;flex:1;text-align:center}
.sh-bs{display:flex;gap:6px;align-items:center;flex-shrink:0}
.sh-ct{background:white;color:#FF6B35;border:none;padding:6px 12px;border-radius:30px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit}
.sh-ln{background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.4);padding:6px 11px;border-radius:30px;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit}
.sh-sr{background:white;border-radius:30px;display:flex;align-items:center;gap:8px;padding:9px 16px;box-shadow:0 2px 12px rgba(0,0,0,.12)}
body.dark .sh-sr{background:#2a1400}
.sh-sr input{border:none;outline:none;flex:1;font-family:inherit;font-size:14px;background:transparent;color:#333}
body.dark .sh-sr input{color:#f0e8e0}
.ann{background:#FF6B35;color:white;text-align:center;padding:7px 16px;font-size:12px;font-weight:700}
.bw{margin:14px 14px 0;border-radius:20px;overflow:hidden;position:relative;box-shadow:0 8px 28px rgba(255,107,53,.22)}
.bt{display:flex;transition:transform .45s cubic-bezier(.4,0,.2,1)}
.bs{min-width:100%;height:175px;object-fit:cover;display:block}
.bf{min-width:100%;height:175px;background:linear-gradient(135deg,#FF6B35,#7C3AED);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.bds{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.bdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);border:none;cursor:pointer;transition:.3s;padding:0}
.bdot.on{background:white;width:18px;border-radius:10px}
.fb2{background:linear-gradient(135deg,#dc2626,#7c3aed);margin:14px 14px 0;border-radius:16px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
.tw{display:flex;gap:5px;align-items:center}
.tb{background:rgba(0,0,0,.3);color:white;padding:4px 8px;border-radius:8px;font-size:16px;font-weight:900;font-family:monospace;min-width:32px;text-align:center}
.sec{padding:0 14px;margin-bottom:18px}
.sh2{display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-bottom:13px}
.st{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .st{color:#F0E8E0}
.sm{color:#FF6B35;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;font-family:inherit}
.ag{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ac{position:relative;border-radius:16px;overflow:hidden;cursor:pointer;aspect-ratio:1;box-shadow:0 4px 14px rgba(0,0,0,.1);transition:.3s;background:white;display:flex;align-items:center;justify-content:center;border:2.5px solid transparent}
body.dark .ac{background:#1e1208}.ac:active{transform:scale(.95)}.ac.sel{border-color:#FF6B35}
.ac img{width:100%;height:100%;object-fit:cover;transition:.4s}.ac:hover img{transform:scale(1.08)}
.ac .ov{position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;padding:8px;opacity:0;transition:.3s}.ac:hover .ov{opacity:1}
.ac .ov span{color:white;font-weight:700;font-size:11px}
.ac .ni{font-weight:900;font-size:13px;color:#1A0A00;text-align:center;padding:8px}
body.dark .ac .ni{color:#F0E8E0}
.aa{border-radius:16px;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:linear-gradient(135deg,#FF6B35,#7C3AED)}
.aa span{font-size:12px;font-weight:800;color:white}
.cs{display:flex;gap:10px;overflow-x:auto;padding:2px 0 8px}.cs::-webkit-scrollbar{display:none}
.ci{flex-shrink:0;width:80px;text-align:center;cursor:pointer;transition:.2s}.ci:active{transform:scale(.93)}
.cim{width:72px;height:72px;border-radius:16px;overflow:hidden;margin:0 auto 6px;background:#F8F4F0;display:flex;align-items:center;justify-content:center;font-size:28px;border:2.5px solid transparent;transition:.2s}
.cim img{width:100%;height:100%;object-fit:cover}.ci.sel .cim{border-color:#FF6B35}
.cl{font-size:11px;font-weight:700;color:#1A0A00}
body.dark .cl{color:#F0E8E0}
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0}.chips::-webkit-scrollbar{display:none}
.chip{background:white;border:1.5px solid #E8DDD5;border-radius:30px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;color:#7A6A5A;flex-shrink:0}
body.dark .chip{background:#1e1208;border-color:#3d2a1a;color:#C0A898}
.chip.sel{background:#FF6B35;color:white;border-color:#FF6B35}
.pc{background:white;border-radius:18px;padding:11px;transition:.2s;box-shadow:0 2px 14px rgba(0,0,0,.07);cursor:pointer;border:1.5px solid rgba(0,0,0,.04);width:158px;flex-shrink:0;position:relative}
body.dark .pc{background:#1e1208}.pc:active{transform:scale(.97)}
.pci{position:relative;border-radius:13px;overflow:hidden;margin-bottom:9px;background:#F8F4F0;aspect-ratio:1}
.pci img{width:100%;height:100%;object-fit:cover}
.pni{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:34px}
.pbg{position:absolute;top:0;right:0;background:rgba(30,30,30,.82);color:white;padding:5px 9px;border-radius:0 13px 0 10px;font-size:10px;font-weight:800}
.badge{position:absolute;top:6px;right:6px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:800;color:white}
.bn2{background:#10b981}.bp2{background:#FF6B35}.bfl{background:#dc2626}
.fvb{position:absolute;top:6px;left:6px;width:28px;height:28px;border-radius:50%;background:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
.pn{font-size:12px;font-weight:700;color:#1A0A00;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
body.dark .pn{color:#F0E8E0}
.pp{font-size:13px;font-weight:900;color:#FF6B35}
.po2{font-size:10px;color:#94a3b8;text-decoration:line-through;margin-left:3px}
.pd2{background:#dc2626;color:white;font-size:9px;font-weight:800;padding:1px 5px;border-radius:20px}
.pc3{font-size:11px;color:#7A6A5A;margin-top:2px;font-weight:700}
.ps2{font-size:10px;color:#ef4444;margin-top:2px}
.ab2{width:100%;margin-top:8px;padding:7px;border-radius:30px;background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:800}
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.prod-grid .pc{width:100%}
.hs{display:flex;gap:11px;overflow-x:auto;padding:2px 0 10px}.hs::-webkit-scrollbar{display:none}
.cbar{background:linear-gradient(135deg,#FF6B35,#7C3AED);margin:14px;border-radius:16px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
.bnav{position:fixed;bottom:0;left:0;right:0;background:white;display:flex;justify-content:space-around;align-items:center;padding:10px 0 16px;z-index:300;box-shadow:0 -4px 20px rgba(0,0,0,.08);border-radius:20px 20px 0 0}
body.dark .bnav{background:#1e1208}
.nb{display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;cursor:pointer;font-family:inherit;color:#AAA099;font-size:10px;font-weight:700;padding:0 10px;position:relative;min-width:48px}
.nb.on{color:#FF6B35}.nbi{font-size:22px;line-height:1}
.nbg{position:absolute;top:-1px;right:6px;background:#FF6B35;color:white;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:800;border:2px solid white}
body.dark .nbg{border-color:#1e1208}
.waw{position:fixed;bottom:90px;left:14px;z-index:400;text-align:center}
.wab{width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.5);cursor:pointer;border:none;animation:wap 2s ease-in-out infinite}
.wal{background:#25D366;color:white;font-size:10px;font-weight:700;border-radius:20px;padding:3px 8px;margin-top:4px;white-space:nowrap;font-family:'Tajawal',sans-serif}
.sct{position:fixed;bottom:90px;right:14px;width:44px;height:44px;background:#FF6B35;color:white;border-radius:50%;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(255,107,53,.4);z-index:280}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);z-index:1000;display:flex;align-items:flex-end;justify-content:center}
.ms{background:white;border-radius:24px 24px 0 0;width:100%;max-height:92vh;overflow-y:auto;padding-bottom:30px;animation:sUp .3s cubic-bezier(.4,0,.2,1)}
body.dark .ms{background:#1e1208}
.ms.ctr{border-radius:24px;max-width:460px;margin:20px auto;animation:zIn .25s ease}
.mh2{width:38px;height:4px;background:#E8DDD5;border-radius:10px;margin:12px auto 2px}
body.dark .mh2{background:#3d2a1a}
.mh{padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #F7F3EF;position:sticky;top:0;background:white;z-index:2}
body.dark .mh{background:#1e1208;border-color:#2d1a0a}
.mh h3{font-size:17px;font-weight:900;color:#1A0A00}
body.dark .mh h3{color:#F0E8E0}
.mc{width:32px;height:32px;border-radius:50%;background:#F7F3EF;border:none;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
body.dark .mc{background:#2d1a0a;color:#F0E8E0}
.mb{padding:16px 18px}
.fi{background:#F7F3EF;border:1.5px solid #E8DDD5;border-radius:14px;padding:12px 16px;width:100%;font-family:inherit;font-size:14px;color:#1A0A00;outline:none;margin-bottom:12px}
body.dark .fi{background:#2d1a0a;border-color:#3d2a1a;color:#F0E8E0}
.fi:focus{border-color:#FF6B35;box-shadow:0 0 0 3px rgba(255,107,53,.1)}
.fl{font-size:13px;font-weight:700;color:#7A6A5A;margin-bottom:6px;display:block}
.ab{width:100%;padding:15px;border-radius:30px;background:linear-gradient(135deg,#FF6B35,#E8430E);color:white;border:none;cursor:pointer;font-family:inherit;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
.ab:disabled{opacity:.6}
.ab.purple{background:linear-gradient(135deg,#7C3AED,#5B21B6)}
.ab.green{background:linear-gradient(135deg,#10b981,#059669)}
.otp-r{display:flex;gap:10px;justify-content:center;margin:16px 0}
.oi{width:52px;height:58px;border:2px solid #E8DDD5;border-radius:12px;text-align:center;font-size:22px;font-weight:900;font-family:inherit;outline:none;background:#F7F3EF}
.oi:focus{border-color:#FF6B35}
body.dark .oi{background:#2d1a0a;border-color:#3d2a1a;color:#F0E8E0}
.qb{width:28px;height:28px;border-radius:50%;border:2px solid #FF6B35;color:#FF6B35;background:none;cursor:pointer;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center}
.page{padding-bottom:80px}
`

export default function Store() {
  const [customer,  setCustomer]  = useState(()=>{try{return JSON.parse(localStorage.getItem('nq_customer')||'null')}catch{return null}})
  const [cart,      setCart]      = useState(()=>{try{return JSON.parse(localStorage.getItem('nq_cart')||'[]')}catch{return []}})
  const [wishlist,  setWishlist]  = useState(()=>{try{return JSON.parse(localStorage.getItem('nq_wish')||'[]')}catch{return []}})
  const [products,  setProducts]  = useState([])
  const [brands,    setBrands]    = useState([])
  const [categories,setCategories]= useState([])
  const [settings,  setSettings]  = useState({})
  const [promos,    setPromos]    = useState([])
  const [banners,   setBanners]   = useState([])
  const [modal,     setModal]     = useState(null)
  const [detailProd,setDetailProd]= useState(null)
  const [thankData, setThankData] = useState(null)
  const [checkoutTotal,setCheckoutTotal] = useState(0)
  const [tab,       setTab]       = useState('home')
  const [search,    setSearch]    = useState('')
  const [brandSel,  setBrandSel]  = useState('all')
  const [catSel,    setCatSel]    = useState('all')
  const [sortSel,   setSortSel]   = useState('newest')
  const [page,      setPage]      = useState(1)
  const [showScr,   setShowScr]   = useState(false)
  const [bannerIdx, setBannerIdx] = useState(0)
  const [showMenu,  setShowMenu]  = useState(false)

  const flashEnd = useRef(Date.now()+24*3600*1000)
  const timer = useTimer(flashEnd.current)

  const SNAME    = settings['store_name']      || 'نقاء'
  const CUR      = settings['store_currency']  || 'دج'
  const WA       = settings['contact_whatsapp']|| settings['whatsapp_number'] || WA_NUM
  const ANNOUNCE = settings['announce_bar']    || ''
  const PROMO_T  = settings['promo_text']      || ''
  const cartCount= cart.reduce((s,i)=>s+i.qty,0)
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate()-7)

  useEffect(()=>{
    const load=async()=>{
      const [{data:p},{data:b},{data:c},{data:s},{data:pr}]=await Promise.all([
        supabase.from('products').select('*').eq('disabled',false).order('created_at',{ascending:false}),
        supabase.from('brands').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('settings').select('*'),
        supabase.from('promotions').select('*').eq('active',true).catch(()=>({data:[]})),
      ])
      setProducts(p||[]); setBrands(b||[]); setCategories(c||[])
      const map={}; (s||[]).forEach(r=>(map[r.key]=r.value)); setSettings(map)
      try{setBanners(JSON.parse(map['store_banners']||'[]'))}catch{}
      setPromos((pr||[]).filter(p=>!p.end_date||new Date(p.end_date)>new Date()))
    }
    load()
  },[])

  useEffect(()=>{
    if(!document.getElementById('nq-css')){const st=document.createElement('style');st.id='nq-css';st.textContent=CSS;document.head.appendChild(st)}
    if(localStorage.getItem('nqDark')==='1')document.body.classList.add('dark')
    const fn=()=>setShowScr(window.scrollY>300)
    window.addEventListener('scroll',fn); return()=>window.removeEventListener('scroll',fn)
  },[])

  useEffect(()=>{
    if(banners.length<2)return
    const t=setInterval(()=>setBannerIdx(i=>(i+1)%banners.length),3800)
    return()=>clearInterval(t)
  },[banners.length])

  useEffect(()=>{localStorage.setItem('nq_cart',JSON.stringify(cart))},[cart])
  useEffect(()=>{localStorage.setItem('nq_wish',JSON.stringify(wishlist))},[wishlist])

  const addToCart=useCallback((p)=>{
    const cp=p.carton_price?Number(p.carton_price):(Number(p.price)*(p.units||12))
    if(!p||(p.stock||0)===0){toast('المنتج غير متوفر',true);return}
    setCart(prev=>{
      if(prev.find(i=>i.id===p.id)){toast('موجود في السلة بالفعل',true);return prev}
      toast('تمت الإضافة للسلة ✅')
      return [...prev,{id:p.id,name:p.name,price:Number(p.price),cp,units:p.units||12,qty:1,img:p.image,brandId:p.brand_id}]
    })
  },[])

  const toggleWish=useCallback(id=>{
    setWishlist(prev=>{
      if(prev.includes(id)){toast('تم الإزالة من المفضلة');return prev.filter(x=>x!==id)}
      toast('تمت الإضافة للمفضلة ❤️');return [...prev,id]
    })
  },[])

  const handleLogin=data=>{setCustomer(data);localStorage.setItem('nq_customer',JSON.stringify(data));setModal(null);toast('مرحباً '+data.name+' 👋')}
  const handleLogout=()=>{setCustomer(null);localStorage.removeItem('nq_customer');setCart([]);setModal(null);toast('تم الخروج')}

  const handleOrderSuccess=async(orderId,customerName)=>{
    const pts=Math.floor(checkoutTotal/100*POINTS_RATE)
    if(customer&&pts>0){
      const np=(customer.points||0)+pts
      await supabase.from('customers').update({points:np}).eq('id',customer.id)
      const upd={...customer,points:np};setCustomer(upd);localStorage.setItem('nq_customer',JSON.stringify(upd))
    }
    setCart([]);setThankData({id:orderId,name:customerName,points:customer?pts:0});setModal('thankyou')
  }

  const allP=products.filter(p=>!p.disabled)
  const newP=allP.filter(p=>new Date(p.created_at)>=sevenAgo)
  const flashP=allP.filter(p=>Number(p.discount)>0).slice(0,10)
  const dayDeal=allP.find(p=>Number(p.discount)>=20)||null
  const getPromo=p=>promos.find(pr=>{if(!pr.active)return false;const pids=typeof pr.product_ids==='string'?JSON.parse(pr.product_ids||'[]'):(pr.product_ids||[]);return pids.length===0||pids.includes(p.id)})

  const filtered=(()=>{
    let f=[...allP]
    if(search)f=f.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
    if(brandSel!=='all')f=f.filter(p=>p.brand_id==brandSel)
    if(catSel!=='all')f=f.filter(p=>p.category_id==catSel)
    if(sortSel==='price_asc')f=[...f].sort((a,b)=>a.price-b.price)
    else if(sortSel==='price_desc')f=[...f].sort((a,b)=>b.price-a.price)
    return f
  })()
  const PER=12;const PAGES=Math.ceil(filtered.length/PER);const paged=filtered.slice((page-1)*PER,page*PER)

  /* Product Card */
  const PC=({p})=>{
    const isW=wishlist.includes(p.id);const isN=new Date(p.created_at)>=sevenAgo
    const disc=Number(p.discount)||0;const fp=disc>0?(p.price*(1-disc/100)).toFixed(0):p.price
    const cp=p.carton_price?Number(p.carton_price):(Number(p.price)*(p.units||12))
    const promo=getPromo(p)
    return(
      <div className="pc" onClick={()=>{setDetailProd(p);setModal('detail')}}>
        <div className="pci">
          {p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<div className="pni">🛍️</div>}
          {promo&&<div className="pbg">📢 {promo.name||'عرض خاص'}</div>}
          {!promo&&disc>0&&<span className="badge bfl">-{disc}%</span>}
          {!promo&&isN&&!disc&&<span className="badge bn2">جديد</span>}
          <button className="fvb" onClick={e=>{e.stopPropagation();toggleWish(p.id)}}><span style={{color:isW?'#FF6B35':'#CBD5E1'}}>♥</span></button>
        </div>
        <div className="pn">{p.name}</div>
        {disc>0&&<div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}><span className="po2">{p.price}</span><span className="pp">{fp} {CUR}</span><span className="pd2">-{disc}%</span></div>}
        <div className="pc3">📦 {cp.toFixed(0)} {CUR}/كرتون ({p.units||12} قطعة)</div>
        {(p.stock||0)<(p.units||12)*3&&(p.stock||0)>0&&<div className="ps2">⚠️ {Math.floor((p.stock||0)/(p.units||12))} كرتون فقط</div>}
        {(p.stock||0)===0&&<div className="ps2">❌ نفذ</div>}
        <button className="ab2" disabled={(p.stock||0)===0} onClick={e=>{e.stopPropagation();addToCart(p)}}>🛒 {(p.stock||0)===0?'نفذ':'أضف للسلة'}</button>
      </div>
    )
  }

  /* Promo Timer */
  const PromoTimer=({endTime})=>{const t=useTimer(endTime);if(!t.alive)return null;return(
    <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',borderRadius:12,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
      <div style={{color:'rgba(255,255,255,.7)',fontSize:12,fontWeight:700}}>⏳ ينتهي خلال:</div>
      <div style={{display:'flex',gap:6}}>{[{v:t.h,l:'ساعة'},{v:t.m,l:'دقيقة'},{v:t.s,l:'ثانية'}].map(({v,l})=><div key={l} style={{textAlign:'center'}}><div style={{background:'rgba(255,107,53,.8)',color:'white',padding:'4px 8px',borderRadius:8,fontSize:16,fontWeight:900,minWidth:32,fontFamily:'monospace'}}>{v}</div><div style={{fontSize:9,color:'rgba(255,255,255,.6)',marginTop:2}}>{l}</div></div>)}</div>
    </div>
  )}

  /* Tabs */
  const PromosPage=()=>{
    const ap=promos.filter(p=>p.active)
    return(<div className="sec" style={{marginTop:14}}>
      <h2 style={{fontSize:20,fontWeight:900,marginBottom:16,color:'#dc2626'}}>⚡ العروض الحالية</h2>
      {ap.length===0?<div style={{textAlign:'center',padding:40,color:'#7A6A5A'}}><div style={{fontSize:52,opacity:.3,marginBottom:12}}>🎁</div><p>لا توجد عروض حالياً</p></div>
      :ap.map(promo=>{
        const pids=typeof promo.product_ids==='string'?JSON.parse(promo.product_ids||'[]'):(promo.product_ids||[])
        const pp=pids.length>0?products.filter(p=>pids.includes(p.id)):allP.slice(0,6)
        const et=promo.end_date?new Date(promo.end_date).getTime():flashEnd.current
        return(<div key={promo.id} style={{background:'white',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.08)',marginBottom:14}}>
          {promo.image?<img src={promo.image} style={{width:'100%',height:140,objectFit:'cover',display:'block'}}/>:<div style={{background:'linear-gradient(135deg,#FF6B35,#7C3AED)',height:100,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:6}}><span style={{fontSize:28}}>🎯</span><span style={{color:'white',fontWeight:900,fontSize:16}}>{promo.name}</span></div>}
          <div style={{padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h3 style={{fontWeight:900,fontSize:16}}>{promo.name}</h3>
              {promo.discount_value>0&&<span style={{background:'#dc2626',color:'white',padding:'4px 12px',borderRadius:20,fontSize:13,fontWeight:900}}>{promo.type==='percent'?`-${promo.discount_value}%`:`-${promo.discount_value} ${CUR}`}</span>}
            </div>
            {promo.description&&<p style={{fontSize:13,color:'#7A6A5A',marginBottom:10}}>{promo.description}</p>}
            {promo.end_date&&<PromoTimer endTime={et}/>}
            {pp.length>0&&<><div style={{fontWeight:700,fontSize:13,marginBottom:8}}>المنتجات المشمولة:</div><div className="hs">{pp.slice(0,8).map(p=><PC key={p.id} p={p}/>)}</div></>}
          </div>
        </div>)
      })}
    </div>)
  }

  const AboutPage=()=><div className="sec" style={{marginTop:14}}><h2 style={{fontSize:20,fontWeight:900,marginBottom:14}}>🏢 من نحن</h2><div style={{background:'white',borderRadius:20,padding:20,boxShadow:'0 2px 14px rgba(0,0,0,.07)'}}><div style={{whiteSpace:'pre-wrap',lineHeight:1.8,color:'#475569',fontSize:14}}>{settings['about_us']||SNAME+' — متجر إلكتروني جزائري متخصص.'}</div></div></div>

  const Home=()=>(
    <>
      {ANNOUNCE&&<div className="ann">{ANNOUNCE}</div>}
      <div className="bw">
        <div className="bt" style={{transform:`translateX(${bannerIdx*100}%)`}}>
          {banners.length>0?banners.map((b,i)=>(b.image?<img key={i} src={b.image} className="bs" alt=""/>:<div key={i} className="bf"><span style={{fontSize:36}}>🛍️</span><span style={{color:'white',fontWeight:900,fontSize:22}}>{b.title||SNAME}</span>{b.subtitle&&<span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>{b.subtitle}</span>}</div>))
          :<div className="bf"><span style={{fontSize:40}}>🛍️</span><span style={{color:'white',fontWeight:900,fontSize:24}}>{SNAME}</span><span style={{color:'rgba(255,255,255,.8)',fontSize:14}}>أفضل المنتجات بأفضل الأسعار</span></div>}
        </div>
        {banners.length>1&&<div className="bds">{banners.map((_,i)=><button key={i} className={`bdot${bannerIdx===i?' on':''}`} onClick={()=>setBannerIdx(i)}/>)}</div>}
      </div>
      {PROMO_T&&<div style={{background:'linear-gradient(135deg,#FFF0EB,#FFE4D6)',margin:'10px 14px 0',borderRadius:14,padding:'10px 16px',textAlign:'center',fontSize:13,fontWeight:800,color:'#FF6B35',border:'1px solid #FFD5C0'}}>{PROMO_T}</div>}
      {promos.filter(p=>p.active&&p.end_date).slice(0,1).map(promo=>(
        <div key={promo.id} className="fb2" onClick={()=>setTab('promos')}>
          <div><div style={{color:'white',fontWeight:900,fontSize:15}}>⚡ {promo.name}</div><div style={{color:'rgba(255,255,255,.75)',fontSize:11}}>{promo.description||'لفترة محدودة'}</div></div>
          <div className="tw"><div className="tb">{timer.h}</div><span style={{color:'white',fontWeight:900}}>:</span><div className="tb">{timer.m}</div><span style={{color:'white',fontWeight:900}}>:</span><div className="tb">{timer.s}</div></div>
        </div>
      ))}
      {brands.length>0&&<div className="sec"><div className="sh2"><span className="st">⭐ أفضل الماركات</span><button className="sm" onClick={()=>setTab('cats')}>عرض الكل</button></div><div className="ag"><div className="aa" onClick={()=>{setBrandSel('all');setTab('search')}}><span style={{fontSize:24,color:'white'}}>⊞</span><span>عرض الكل</span></div>{brands.slice(0,5).map(b=><div key={b.id} className={`ac${brandSel==b.id?' sel':''}`} onClick={()=>{setBrandSel(b.id);setTab('search')}}>{b.image?<><img src={b.image} alt={b.name}/><div className="ov"><span>{b.name}</span></div></>:<div className="ni">{b.name}</div>}</div>)}</div></div>}
      {categories.length>0&&<div className="sec"><div className="sh2"><span className="st">📂 الفئات</span><button className="sm" onClick={()=>setTab('cats')}>عرض الكل</button></div><div className="cs">{categories.map(c=><div key={c.id} className={`ci${catSel==c.id?' sel':''}`} onClick={()=>{setCatSel(c.id);setTab('search')}}><div className="cim">{c.image?<img src={c.image} alt={c.name}/>:<span>📁</span>}</div><div className="cl">{c.name}</div></div>)}</div></div>}
      <div style={{margin:'14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={{background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:16,padding:14,textAlign:'center',cursor:'pointer'}} onClick={()=>setTab('promos')}><div style={{fontSize:24,marginBottom:4}}>🎁</div><div style={{color:'white',fontWeight:800,fontSize:13}}>{promos.find(p=>p.type==='buy_x_get_y')?.name||'اشتري X خذ Y'}</div><div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>عروض خاصة</div></div>
        <div style={{background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:16,padding:14,textAlign:'center',cursor:'pointer'}} onClick={()=>{setSortSel('price_asc');setTab('search')}}><div style={{fontSize:24,marginBottom:4}}>📦</div><div style={{color:'white',fontWeight:800,fontSize:13}}>خصم الكميات</div><div style={{color:'rgba(255,255,255,.8)',fontSize:11}}>كلما زاد وفّرت</div></div>
      </div>
      {dayDeal&&<div style={{background:'white',margin:'14px',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 20px rgba(255,107,53,.15)',border:'2px solid #FF6B35'}}><div style={{background:'linear-gradient(135deg,#FF6B35,#E8430E)',padding:'10px 16px',display:'flex',justifyContent:'space-between'}}><span style={{color:'white',fontWeight:900,fontSize:15}}>🌟 عرض اليوم</span><span style={{color:'white',fontSize:13}}>خصم {dayDeal.discount}%</span></div><div style={{display:'flex',gap:14,padding:14,cursor:'pointer'}} onClick={()=>{setDetailProd(dayDeal);setModal('detail')}}>{dayDeal.image?<img src={dayDeal.image} style={{width:86,height:86,borderRadius:12,objectFit:'cover'}}/>:<div style={{width:86,height:86,borderRadius:12,background:'#F8F4F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>🛍️</div>}<div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{dayDeal.name}</div><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:12,color:'#94a3b8',textDecoration:'line-through'}}>{(dayDeal.carton_price||dayDeal.price*(dayDeal.units||12)).toFixed(0)}</span><span style={{fontSize:18,fontWeight:900,color:'#FF6B35'}}>{((dayDeal.carton_price||dayDeal.price*(dayDeal.units||12))*(1-dayDeal.discount/100)).toFixed(0)} {CUR}</span></div><button className="ab2" style={{marginTop:8}} onClick={e=>{e.stopPropagation();addToCart(dayDeal)}}>أضف للسلة</button></div></div></div>}
      {newP.length>0&&<div className="sec"><div className="sh2"><span className="st">🎁 وصل حديثاً</span></div><div className="hs">{newP.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div></div>}
      {flashP.length>0&&<div className="sec"><div className="sh2"><span className="st">⚡ عروض مخفضة</span></div><div className="hs">{flashP.map(p=><PC key={p.id} p={p}/>)}</div></div>}
      {allP.length>0&&<div className="sec"><div className="sh2"><span className="st">📦 جميع المنتجات</span><button className="sm" onClick={()=>setTab('search')}>عرض الكل</button></div><div className="hs">{allP.slice(0,10).map(p=><PC key={p.id} p={p}/>)}</div></div>}
      {cartCount>0&&<div className="cbar" onClick={()=>setModal('cart')}><span style={{color:'white',fontWeight:700,fontSize:14}}>🛒 {cartCount} كرتون في السلة</span><span style={{color:'white',fontWeight:900,fontSize:16}}>{cart.reduce((s,i)=>s+i.cp*i.qty,0).toFixed(0)} {CUR}</span></div>}
      <div style={{textAlign:'center',color:'#94a3b8',fontSize:13,padding:'32px 0 8px',borderTop:'1px solid #e2e8f0',margin:'20px 14px 0'}}>© 2025 {SNAME}</div>
    </>
  )

  const SearchTab=()=>(
    <div className="sec" style={{marginTop:14}}>
      <div className="chips" style={{marginBottom:10}}><button className={`chip${catSel==='all'?' sel':''}`} onClick={()=>{setCatSel('all');setPage(1)}}>الكل</button>{categories.map(c=><button key={c.id} className={`chip${catSel==c.id?' sel':''}`} onClick={()=>{setCatSel(c.id);setPage(1)}}>{c.name}</button>)}</div>
      <div className="chips" style={{marginBottom:14}}>{[['newest','الأحدث'],['price_asc','السعر ↑'],['price_desc','السعر ↓']].map(([v,l])=><button key={v} className={`chip${sortSel===v?' sel':''}`} onClick={()=>{setSortSel(v);setPage(1)}}>{l}</button>)}</div>
      {paged.length===0?<div style={{textAlign:'center',padding:40,color:'#7A6A5A'}}><div style={{fontSize:48,opacity:.3,marginBottom:12}}>🔍</div><p>لا توجد نتائج</p></div>:<div className="prod-grid">{paged.map(p=><PC key={p.id} p={p}/>)}</div>}
      {PAGES>1&&<div style={{display:'flex',justifyContent:'center',gap:8,marginTop:18,flexWrap:'wrap'}}>{page>1&&<button className="chip" onClick={()=>setPage(p=>p-1)}>‹ السابق</button>}{Array.from({length:Math.min(PAGES,5)},(_,i)=>i+1).map(n=><button key={n} className={`chip${page===n?' sel':''}`} onClick={()=>setPage(n)}>{n}</button>)}{page<PAGES&&<button className="chip" onClick={()=>setPage(p=>p+1)}>التالي ›</button>}</div>}
    </div>
  )

  const CatsTab=()=>(
    <div className="sec" style={{marginTop:14}}>
      <div className="sh2" style={{paddingTop:0}}><span className="st">🏷️ الماركات</span></div>
      <div className="ag"><div className="aa" onClick={()=>{setBrandSel('all');setCatSel('all');setTab('search')}}><span style={{fontSize:24,color:'white'}}>⊞</span><span>كل المنتجات</span></div>{brands.map(b=><div key={b.id} className="ac" onClick={()=>{setBrandSel(b.id);setTab('search')}}>{b.image?<><img src={b.image} alt={b.name}/><div className="ov"><span>{b.name}</span></div></>:<div className="ni">{b.name}</div>}</div>)}</div>
      {categories.length>0&&<div style={{marginTop:20}}><div className="sh2" style={{paddingTop:0}}><span className="st">📂 الفئات</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>{categories.map(c=><div key={c.id} onClick={()=>{setCatSel(c.id);setTab('search')}} style={{background:'white',borderRadius:16,padding:12,display:'flex',alignItems:'center',gap:12,cursor:'pointer',boxShadow:'0 2px 10px rgba(0,0,0,.07)'}}>{c.image?<img src={c.image} style={{width:50,height:38,borderRadius:10,objectFit:'cover',flexShrink:0}}/>:<div style={{width:50,height:38,borderRadius:10,background:'#FFF0EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>📦</div>}<span style={{fontWeight:700,fontSize:14,color:'#1A0A00'}}>{c.name}</span></div>)}</div></div>}
    </div>
  )

  const WishTab=()=>{const wp=products.filter(p=>wishlist.includes(p.id));return(<div className="sec" style={{marginTop:14}}>{wp.length===0?<div style={{textAlign:'center',padding:40,color:'#7A6A5A'}}><div style={{fontSize:48,opacity:.3,marginBottom:12}}>❤️</div><p>قائمة المفضلة فارغة</p></div>:<div className="prod-grid">{wp.map(p=><PC key={p.id} p={p}/>)}</div>}</div>)}

  const tabs={home:<Home/>,search:<SearchTab/>,cats:<CatsTab/>,wish:<WishTab/>,promos:<PromosPage/>,about:<AboutPage/>}

  return(
    <div dir="rtl">
      {showMenu&&<SideMenu onClose={()=>setShowMenu(false)} onNav={t=>setTab(t)} onModal={m=>setModal(m)} customer={customer} cart={cart} wishlist={wishlist} settings={settings}/>}
      <div className="sh">
        <div className="sh-top">
          <button className="sh-ic" onClick={()=>setShowMenu(true)}>☰</button>
          <span className="sh-lg">{SNAME}</span>
          <div className="sh-bs">
            {customer?<button className="sh-ln" onClick={()=>setModal('profile')}>👤 {customer.name.split(' ')[0]}</button>:<button className="sh-ln" onClick={()=>setModal('login')}>🔐 دخول</button>}
            <button className="sh-ct" onClick={()=>setModal('contact')}>إتصل بنا</button>
          </div>
        </div>
        <div className="sh-sr">
          <span style={{color:'#aaa',fontSize:16}}>🔍</span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setTab('search');setPage(1)}} placeholder="بحث عن المنتجات..."/>
          {search&&<button onClick={()=>{setSearch('');setTab('home')}} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:16}}>×</button>}
        </div>
      </div>
      <div className="page">{tabs[tab]||<Home/>}</div>
      <div className="bnav">
        {[{id:'wish',ic:'❤️',l:'المفضلة',b:wishlist.length},{id:'cart-m',ic:'🛒',l:'السلة',b:cartCount,a:()=>setModal('cart')},{id:'menu',ic:'☰',l:'القائمة',a:()=>setShowMenu(true)},{id:'search',ic:'🔍',l:'بحث'},{id:'home',ic:'🏠',l:'الرئيسية'}].map(n=>(
          <button key={n.id} className={`nb${tab===n.id&&!n.a?' on':''}`} onClick={()=>n.a?n.a():setTab(n.id)}>
            <span className="nbi">{n.ic}</span>
            {n.b>0&&<span className="nbg">{n.b}</span>}
            <span>{n.l}</span>
          </button>
        ))}
      </div>
      <div className="waw">
        <button className="wab" onClick={()=>window.open(`https://wa.me/${WA}`,'_blank')}><span style={{fontSize:28,color:'white'}}>💬</span></button>
        <div className="wal">تواصل معنا</div>
      </div>
      {showScr&&<button className="sct" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>↑</button>}
      {modal==='login'&&<LoginModal onClose={()=>setModal(null)} onLogin={handleLogin} onRegister={()=>setModal('register')}/>}
      {modal==='register'&&<RegisterModal onClose={()=>setModal(null)} onSuccess={()=>{setModal('login');toast('سجّل الآن للدخول')}}/>}
      {modal==='cart'&&<CartModal cart={cart} setCart={setCart} onClose={()=>setModal(null)} onCheckout={total=>{setCheckoutTotal(total);setModal('checkout')}} currency={CUR} promos={promos}/>}
      {modal==='checkout'&&<CheckoutModal cart={cart} finalTotal={checkoutTotal} onClose={()=>setModal('cart')} onSuccess={handleOrderSuccess} currency={CUR} waNum={WA} storeName={SNAME}/>}
      {modal==='detail'&&<DetailModal product={detailProd} wishlist={wishlist} onClose={()=>setModal(null)} onAddCart={addToCart} onToggleWish={toggleWish} currency={CUR} products={products} promos={promos} sevenAgo={sevenAgo} onShow={p=>setDetailProd(p)}/>}
      {modal==='tracking'&&<TrackingModal onClose={()=>setModal(null)} currency={CUR}/>}
      {modal==='contact'&&<ContactModal settings={settings} onClose={()=>setModal(null)}/>}
      {modal==='profile'&&<ProfileModal customer={customer} onClose={()=>setModal(null)} onLogout={handleLogout} currency={CUR}/>}
      {modal==='thankyou'&&thankData&&<ThankyouModal orderId={thankData.id} customerName={thankData.name} points={thankData.points} storeName={SNAME} onClose={()=>{setModal(null);setTab('home')}}/>}
    </div>
  )
}
