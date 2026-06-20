/**
 * @file usePagination.js
 * @description Hook مركزي للترقيم — يُستخدم في Products, Orders, Customers
 *
 * @template T
 * @param {T[]} data - البيانات الكاملة
 * @param {number} [perPage=15] - عدد العناصر في الصفحة
 * @returns {{ page, totalPages, paged, goTo, next, prev, PagerUI }}
 */
import { useState, useEffect } from 'react'
import { CLR } from '../styles/constants.js'

export default function usePagination(data, perPage = 15) {
  const [page, setPage] = useState(1)

  // إعادة الضبط لأول صفحة عند تغيّر البيانات (فلتر جديد)
  useEffect(() => { setPage(1) }, [data.length])

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))
  const safePage   = Math.min(page, totalPages)
  const paged      = data.slice((safePage - 1) * perPage, safePage * perPage)

  const goTo = p  => setPage(Math.max(1, Math.min(p, totalPages)))
  const next  = () => goTo(safePage + 1)
  const prev  = () => goTo(safePage - 1)

  /** مكوّن شريط الترقيم */
  const PagerUI = data.length <= perPage ? null : (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 0', marginTop:4, borderTop:`1px solid ${CLR.border}` }}>

      {/* معلومات */}
      <span style={{ fontSize:13, color:CLR.textSm, fontWeight:600 }}>
        {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, data.length)} من {data.length}
      </span>

      {/* أزرار */}
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {/* رجوع للأول */}
        <PagerBtn label="«" onClick={() => goTo(1)}     disabled={safePage === 1} />
        <PagerBtn label="‹" onClick={prev}              disabled={safePage === 1} />

        {/* أرقام الصفحات */}
        {getPageRange(safePage, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`dot-${i}`} style={{ padding:'0 4px', color:CLR.textSm }}>…</span>
          ) : (
            <PagerBtn key={p} label={p} onClick={() => goTo(p)}
              active={p === safePage} />
          )
        )}

        <PagerBtn label="›" onClick={next}              disabled={safePage === totalPages} />
        <PagerBtn label="»" onClick={() => goTo(totalPages)} disabled={safePage === totalPages} />
      </div>

      {/* اذهب إلى صفحة */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:CLR.textSm }}>انتقل:</span>
        <input type="number" min={1} max={totalPages} defaultValue={safePage}
          onKeyDown={e => { if (e.key === 'Enter') goTo(Number(e.target.value)) }}
          style={{ width:48, padding:'4px 6px', border:`1px solid ${CLR.border}`,
            borderRadius:6, fontSize:12, textAlign:'center',
            fontFamily:'inherit', outline:'none' }} />
      </div>
    </div>
  )

  return { page: safePage, totalPages, paged, goTo, next, prev, PagerUI }
}

/** زر صفحة واحد */
function PagerBtn({ label, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        minWidth: 32, height: 32, borderRadius: 6, border: `1px solid ${CLR.border}`,
        background: active ? CLR.accent : disabled ? CLR.bg : 'white',
        color: active ? 'white' : disabled ? '#CBD5E1' : CLR.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: active ? 700 : 500,
        fontFamily: 'inherit', transition: '.15s', padding: '0 6px',
      }}>
      {label}
    </button>
  )
}

/** توليد نطاق الصفحات مع … للصفحات الكثيرة */
function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push('…')
    result.push(p)
    prev = p
  }
  return result
}
