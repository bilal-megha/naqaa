import { useState, useCallback } from 'react'
import { CLR, S } from '../styles/constants.js'

export default function useConfirm() {
  const [state, setState] = useState(null)

  const askConfirm = useCallback((msg) => new Promise(resolve => {
    setState({ msg, resolve })
  }), [])

  const handle = (v) => { state?.resolve(v); setState(null) }

  const ConfirmUI = state ? (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9998,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'white',borderRadius:20,padding:28,maxWidth:360,width:'100%',
        boxShadow:'0 20px 60px rgba(0,0,0,.2)',textAlign:'center' }}>
        <div style={{ fontSize:36,marginBottom:12 }}>⚠️</div>
        <p style={{ fontSize:14,color:CLR.text,fontWeight:600,marginBottom:20,lineHeight:1.6 }}>{state.msg}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
          <button style={{ ...S.btn,background:CLR.danger }} onClick={() => handle(true)}>تأكيد</button>
          <button style={{ ...S.btnGray }} onClick={() => handle(false)}>إلغاء</button>
        </div>
      </div>
    </div>
  ) : null

  return [askConfirm, ConfirmUI]
}
