import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S }   from '../styles/constants.js'
import CryptoJS     from 'crypto-js'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL    || ''
const ADMIN_PASS  = import.meta.env.VITE_ADMIN_PASS_HASH || import.meta.env.VITE_ADMIN_PASS_RAW || ''
const TWO_FA_CODE = import.meta.env.VITE_TWO_FA_CODE    || '6789'
const sha256 = p  => CryptoJS.SHA256(p || '').toString()

function checkPwd(plain, stored) {
  if (!plain || !stored) return false
  if (plain === stored) return true
  if (sha256(plain) === stored) return true
  if (sha256(plain) === sha256(stored)) return true
  return false
}

export default function LoginScreen({ onLogin }) {
  const [step, setStep]     = useState(1)
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [code, setCode]     = useState('')
  const [user, setUser]     = useState(null)
  const [err, setErr]       = useState('')
  const [loading, setLoad]  = useState(false)

  const step1 = async () => {
    setErr(''); setLoad(true)
    try {
      // ── مدير رئيسي ──
      if (ADMIN_EMAIL && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (checkPwd(pass, ADMIN_PASS)) {
          setUser({ name:'المدير', email:ADMIN_EMAIL, role:'admin', permissions:{} })
          setStep(2); setLoad(false); return
        }
      }
      // ── موظف ──
      const { data } = await supabase
        .from('employees')
        .select('id,name,email,role,permissions,password,password_hash')
        .eq('username', email.trim())
        .maybeSingle()
      if (data && checkPwd(pass, data.password_hash || data.password || '')) {
        let perms = {}
        try { perms = typeof data.permissions === 'string' ? JSON.parse(data.permissions||'{}') : (data.permissions||{}) } catch {}
        setUser({ name:data.name, email:data.email, role:data.role, permissions:perms, id:data.id })
        setStep(2); setLoad(false); return
      }
      setErr('البريد أو كلمة المرور غير صحيحة')
    } catch { setErr('خطأ في الاتصال، حاول مجدداً') }
    setLoad(false)
  }

  const step2 = () => {
    if (code !== TWO_FA_CODE) { setErr('كود التحقق خاطئ'); return }
    onLogin(user)
  }

  if (step === 2) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1E293B,#0F172A)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:'rtl'}}>
      <div style={{background:'white',borderRadius:24,padding:36,width:'100%',maxWidth:400,boxShadow:'0 24px 64px rgba(0,0,0,.3)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:40}}>🔐</div>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1e293b',marginTop:8}}>التحقق الثنائي</h2>
          <p style={{color:CLR.textSm,fontSize:14,marginTop:4}}>كود التحقق المكوّن من 4 أرقام</p>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:20}}>
          {[0,1,2,3].map(i=>(
            <input key={i} id={`otp-${i}`} maxLength={1} inputMode="numeric"
              value={code[i]||''}
              onChange={e=>{
                const v=e.target.value.replace(/\D/,'')
                const a=(code+'    ').split(''); a[i]=v; setCode(a.join('').trim())
                if(v&&i<3) document.getElementById(`otp-${i+1}`)?.focus()
              }}
              onKeyDown={e=>{
                if(e.key==='Backspace'&&!code[i]&&i>0) document.getElementById(`otp-${i-1}`)?.focus()
                if(e.key==='Enter') step2()
              }}
              style={{width:56,height:60,border:'2px solid #e2e8f0',borderRadius:12,textAlign:'center',fontSize:24,fontWeight:900,outline:'none',background:'#f8fafc',fontFamily:'inherit'}}
            />
          ))}
        </div>
        {err&&<p style={{color:'#ef4444',fontSize:13,marginBottom:14,background:'#fef2f2',padding:10,borderRadius:10,textAlign:'center'}}>{err}</p>}
        <button style={{...S.btn,width:'100%',padding:14,fontSize:16,justifyContent:'center'}} onClick={step2}>✅ تأكيد الدخول</button>
        <button onClick={()=>{setStep(1);setCode('');setErr('')}} style={{...S.btnGray,width:'100%',marginTop:10,padding:12,textAlign:'center'}}>← رجوع</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1E293B,#0F172A)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:'rtl'}}>
      <div style={{background:'white',borderRadius:24,padding:36,width:'100%',maxWidth:400,boxShadow:'0 24px 64px rgba(0,0,0,.3)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:64,height:64,borderRadius:16,background:'#FFF7ED',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 12px'}}>🛍️</div>
          <h1 style={{fontSize:26,fontWeight:900,color:'#1e293b'}}>نقاء</h1>
          <p style={{color:CLR.textSm,fontSize:14}}>لوحة الإدارة</p>
        </div>
        <div style={{marginBottom:14}}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input style={S.input} type="email" value={email} autoComplete="email"
            onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step1()}
            placeholder="أدخل بريدك الإلكتروني" />
        </div>
        <div style={{marginBottom:20}}>
          <label style={S.label}>كلمة المرور</label>
          <input style={S.input} type="password" value={pass} autoComplete="current-password"
            onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&step1()} />
        </div>
        {err&&<p style={{color:'#ef4444',fontSize:13,marginBottom:14,background:'#fef2f2',padding:'10px 14px',borderRadius:10}}>{err}</p>}
        <button style={{...S.btn,width:'100%',padding:14,fontSize:16,justifyContent:'center',opacity:loading?.7:1}}
          onClick={step1} disabled={loading}>
          {loading?'⏳ جاري التحقق...':'🔐 دخول'}
        </button>
        <p style={{textAlign:'center',marginTop:16,fontSize:11,color:CLR.textSm}}>🔒 الاتصال مشفّر · 2FA</p>
      </div>
    </div>
  )
}
