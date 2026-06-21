import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { CLR, S, WA_DEFAULT } from '../styles/constants.js'
import { logActivity } from '../styles/helpers.js'
import { NumInput, PhoneInput } from '../styles/FormInputs.jsx'

// ألوان الثيمات الجاهزة
const THEMES = [
  { name: 'أزرق (الافتراضي)', primary: '#1565C0', accent: '#FF6D00' },
  { name: 'بني فاخر',         primary: '#6D4C41', accent: '#FF8F00' },
  { name: 'أخضر طبيعي',       primary: '#2E7D32', accent: '#FF6D00' },
  { name: 'بنفسجي',           primary: '#6A1B9A', accent: '#F06292' },
  { name: 'أحمر جريء',        primary: '#C62828', accent: '#FFA000' },
  { name: 'رمادي أنيق',       primary: '#37474F', accent: '#26C6DA' },
]

export default function Settings({ showToast }) {
  const [form, setForm] = useState({
    store_name: 'نقاء',
    store_currency: 'دج',
    whatsapp_number: WA_DEFAULT,
    admin_phone: WA_DEFAULT,
    contact_whatsapp: WA_DEFAULT,
    free_shipping_threshold: '5000',
    points_per_order: '100',   // كل xxx دج = نقطة واحدة
    points_to_dzd: '1',
    shipping_cost: '500',
    tier_m2_min: '5000',
    tier_m3_min: '20000',
    tier_m1_discount: '0',
    tier_m2_discount: '5',
    tier_m3_discount: '10',
    maintenance_mode: '0',
    maintenance_msg: 'المتجر في طور التحديث، سنعود قريباً 🔧',
    terms_text: '',
    announce_bar: '',
    contact_hours: 'من 8 صباحاً إلى 10 مساءً',
    contact_address: '',
    contact_email: '',
    primary_color: '#1565C0',
    accent_color: '#FF6D00',
  })

  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('*')
        if (data) {
          const map = {}
          data.forEach((r) => (map[r.key] = r.value))
          setForm((f) => ({ ...f, ...map }))
          try {
            const b = JSON.parse(map['branches'] || '[]')
            setBranches(
              b.length > 0
                ? b
                : [{ id: Date.now(), name: 'الفرع الرئيسي', address: 'الجزائر العاصمة', phone: '' }]
            )
          } catch {
            setBranches([{ id: Date.now(), name: 'الفرع الرئيسي', address: 'الجزائر العاصمة', phone: '' }])
          }
        }
      } catch (err) {
        console.error('❌ خطأ في تحميل الإعدادات:', err)
        showToast('❌ خطأ في تحميل الإعدادات', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const addBranch = () => setBranches([...branches, { id: Date.now(), name: '', address: '', phone: '' }])
  const updateBranch = (id, field, value) => setBranches(branches.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  const removeBranch = (id) => { if (!confirm('حذف هذا الفرع؟')) return; setBranches(branches.filter((b) => b.id !== id)) }

  const applyTheme = (theme) => {
    setForm((f) => ({ ...f, primary_color: theme.primary, accent_color: theme.accent }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(form).map(([key, value]) =>
          supabase.from('settings').upsert({ key, value: String(value) })
        )
      )
      await supabase.from('settings').upsert({ key: 'branches', value: JSON.stringify(branches) })
      await logActivity('تحديث الإعدادات', 'تم تحديث إعدادات المتجر')
      showToast('✅ تم حفظ جميع الإعدادات')
    } catch (err) {
      console.error('❌ خطأ في الحفظ:', err)
      showToast('❌ خطأ في حفظ الإعدادات', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>⏳ جاري تحميل الإعدادات...</div>

  // حساب مثال النقاط
  const perOrder = Number(form.points_per_order) || 100
  const toDzd    = Number(form.points_to_dzd)    || 1
  const exOrder  = 1000
  const exPoints = Math.floor(exOrder / perOrder)
  const exDisc   = exPoints * toDzd

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, color: CLR.text }}>
        ⚙️ إعدادات المتجر
      </h1>

      {/* ══ إعدادات عامة ══ */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: CLR.accent }}>🏪 إعدادات عامة</h3>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>اسم المتجر</label>
            <input style={S.input} value={form.store_name}
              onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))} placeholder="نقاء" />
          </div>
          <div>
            <label style={S.label}>العملة</label>
            <input style={S.input} value={form.store_currency}
              onChange={(e) => setForm((f) => ({ ...f, store_currency: e.target.value }))} placeholder="دج" />
          </div>
          <div>
            <label style={S.label}>📱 رقم واتساب المتجر</label>
            <PhoneInput value={form.whatsapp_number}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value, admin_phone: e.target.value, contact_whatsapp: e.target.value }))}
              placeholder="213xxxxxxxxx" />
          </div>
          <div>
            <label style={S.label}>📧 البريد الإلكتروني للتواصل</label>
            <input style={S.input} value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} placeholder="info@naqaa.dz" />
          </div>
          <div>
            <label style={S.label}>🚚 تكلفة التوصيل (دج)</label>
            <NumInput value={form.shipping_cost}
              onChange={(e) => setForm((f) => ({ ...f, shipping_cost: e.target.value }))} />
          </div>
          <div>
            <label style={S.label}>🚚 حد التوصيل المجاني (دج)</label>
            <NumInput value={form.free_shipping_threshold}
              onChange={(e) => setForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))} />
          </div>
          <div>
            <label style={S.label}>⏰ ساعات العمل</label>
            <input style={S.input} value={form.contact_hours}
              onChange={(e) => setForm((f) => ({ ...f, contact_hours: e.target.value }))} placeholder="من 8 صباحاً إلى 10 مساءً" />
          </div>
          <div>
            <label style={S.label}>📍 العنوان</label>
            <input style={S.input} value={form.contact_address}
              onChange={(e) => setForm((f) => ({ ...f, contact_address: e.target.value }))} placeholder="الجزائر العاصمة" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>📢 شريط الإعلانات</label>
          <input style={S.input} value={form.announce_bar}
            onChange={(e) => setForm((f) => ({ ...f, announce_bar: e.target.value }))}
            placeholder="🎉 توصيل مجاني على الطلبات فوق 5000 دج" />
        </div>
      </div>

      {/* ══ نظام النقاط ══ */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '2px solid #FDE68A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 28 }}>⭐</span>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 16, color: '#92400E', margin: 0 }}>نظام النقاط والمكافآت</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#B45309' }}>كافئ عملاءك بنقاط عند كل طلبية</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* حقل 1 */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #FDE68A' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 8 }}>
              🛒 كل كم دج يكسب العميل نقطة؟
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NumInput value={form.points_per_order}
                onChange={(e) => setForm((f) => ({ ...f, points_per_order: e.target.value }))} />
              <span style={{ fontWeight: 700, color: '#92400E', whiteSpace: 'nowrap' }}>دج = نقطة</span>
            </div>
          </div>

          {/* حقل 2 */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #FDE68A' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#92400E', marginBottom: 8 }}>
              💰 قيمة النقطة الواحدة عند الخصم
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#92400E', whiteSpace: 'nowrap' }}>نقطة =</span>
              <NumInput value={form.points_to_dzd}
                onChange={(e) => setForm((f) => ({ ...f, points_to_dzd: e.target.value }))} />
              <span style={{ fontWeight: 700, color: '#92400E', whiteSpace: 'nowrap' }}>دج خصم</span>
            </div>
          </div>
        </div>

        {/* مثال تلقائي */}
        <div style={{ background: 'white', borderRadius: 12, padding: '14px 18px', border: '2px dashed #FCD34D' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#78350F' }}>
            💡 <strong>مثال تلقائي:</strong> عميل يطلب بـ{' '}
            <span style={{ color: '#B45309' }}>{exOrder} دج</span> يكسب{' '}
            <span style={{ background: '#FDE68A', padding: '2px 8px', borderRadius: 20, fontWeight: 900, color: '#92400E' }}>
              {exPoints} نقطة
            </span>{' '}
            تساوي خصم{' '}
            <span style={{ background: '#D1FAE5', padding: '2px 8px', borderRadius: 20, fontWeight: 900, color: '#065F46' }}>
              {exDisc} دج
            </span>{' '}
            في طلبيته القادمة
          </p>
        </div>
      </div>

      {/* ══ الهوية البصرية ══ */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 6, color: CLR.text }}>🎨 الهوية البصرية للمتجر</h3>
        <p style={{ fontSize: 13, color: CLR.textSm, marginBottom: 16 }}>
          اختر ثيماً جاهزاً أو خصّص الألوان يدوياً — سيتطبق على واجهة المتجر فوراً بعد الحفظ
        </p>

        {/* ثيمات جاهزة */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {THEMES.map((t) => {
            const active = form.primary_color === t.primary && form.accent_color === t.accent
            return (
              <button key={t.name} onClick={() => applyTheme(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                  borderRadius: 30, border: active ? `2.5px solid ${t.primary}` : '1.5px solid #E2E8F0',
                  background: active ? t.primary + '15' : 'white', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: active ? 700 : 500, fontSize: 13,
                  color: active ? t.primary : CLR.text, transition: 'all .2s',
                }}>
                <span style={{ display: 'flex', gap: 3 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.primary, display: 'inline-block' }} />
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent, display: 'inline-block' }} />
                </span>
                {t.name}
                {active && <span style={{ fontSize: 11, marginRight: 2 }}>✓</span>}
              </button>
            )
          })}
        </div>

        {/* اختيار يدوي */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: CLR.bg, borderRadius: 12, padding: 14, border: '1px solid #E2E8F0' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: CLR.textSm, marginBottom: 8 }}>
              🎨 اللون الأساسي (header، أزرار رئيسية)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.primary_color}
                onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                style={{ width: 48, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }} />
              <input style={{ ...S.input, flex: 1, fontFamily: 'monospace' }}
                value={form.primary_color}
                onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                placeholder="#1565C0" />
            </div>
          </div>
          <div style={{ background: CLR.bg, borderRadius: 12, padding: 14, border: '1px solid #E2E8F0' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: CLR.textSm, marginBottom: 8 }}>
              ✨ لون التمييز (أزرار الإضافة للسلة)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.accent_color}
                onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                style={{ width: 48, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }} />
              <input style={{ ...S.input, flex: 1, fontFamily: 'monospace' }}
                value={form.accent_color}
                onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                placeholder="#FF6D00" />
            </div>
          </div>
        </div>

        {/* معاينة */}
        <div style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <div style={{ background: form.primary_color, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>نقاء</span>
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, flex: 1 }}>معاينة header المتجر</span>
            <span style={{ background: form.accent_color, color: 'white', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              أضف للسلة
            </span>
          </div>
          <div style={{ background: '#F8FAFC', padding: '10px 16px', fontSize: 12, color: CLR.textSm }}>
            ↑ هكذا سيبدو المتجر بعد الحفظ
          </div>
        </div>
      </div>

      {/* ══ الفروع ══ */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: '#dc2626' }}>🏢 إدارة الفروع</h3>
        {branches.map((branch) => (
          <div key={branch.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8, background: CLR.bg, padding: 10, borderRadius: 8 }}>
            <input style={S.input} value={branch.name} onChange={(e) => updateBranch(branch.id, 'name', e.target.value)} placeholder="اسم الفرع" />
            <input style={S.input} value={branch.address} onChange={(e) => updateBranch(branch.id, 'address', e.target.value)} placeholder="العنوان" />
            <PhoneInput value={branch.phone} onChange={(e) => updateBranch(branch.id, 'phone', e.target.value)} placeholder="الهاتف" />
            <button style={{ ...S.btnSm, background: '#FEE2E2', color: '#DC2626' }} onClick={() => removeBranch(branch.id)}>🗑️</button>
          </div>
        ))}
        <button style={{ ...S.btnSm, background: CLR.success, color: 'white' }} onClick={addBranch}>➕ إضافة فرع</button>
      </div>

      {/* ══ تصنيف العملاء ══ */}
      <div style={S.card}>
        <h3 style={{ fontWeight: 800, marginBottom: 14, color: '#dc2626' }}>🏅 إعدادات تصنيف العملاء</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
          <div><label style={S.label}>🥈 M2 — الحد الأدنى (دج)</label><NumInput value={form.tier_m2_min} onChange={(e) => setForm((f) => ({ ...f, tier_m2_min: e.target.value }))} /></div>
          <div><label style={S.label}>🥇 M3 — الحد الأدنى (دج)</label><NumInput value={form.tier_m3_min} onChange={(e) => setForm((f) => ({ ...f, tier_m3_min: e.target.value }))} /></div>
          <div><label style={S.label}>خصم M1 %</label><NumInput value={form.tier_m1_discount} onChange={(e) => setForm((f) => ({ ...f, tier_m1_discount: e.target.value }))} /></div>
          <div><label style={S.label}>خصم M2 %</label><NumInput value={form.tier_m2_discount} onChange={(e) => setForm((f) => ({ ...f, tier_m2_discount: e.target.value }))} /></div>
          <div><label style={S.label}>خصم M3 %</label><NumInput value={form.tier_m3_discount} onChange={(e) => setForm((f) => ({ ...f, tier_m3_discount: e.target.value }))} /></div>
        </div>
      </div>

      <button style={{ ...S.btn, marginTop: 16 }} onClick={save} disabled={saving}>
        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ جميع الإعدادات'}
      </button>
    </div>
  )
}
