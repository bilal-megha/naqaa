/**
 * FAQ.jsx — صفحة الأسئلة الشائعة
 */
import { useState } from 'react'

export default function FAQ({ onClose }) {
  const [open, setOpen] = useState(null)

  const faqs = [
    {
      q: 'ما هو الحد الأدنى للطلب؟',
      a: 'الحد الأدنى للطلب هو كرتون واحد (12 قطعة) من أي منتج. يمكنك طلب كميات أقل من الكرتون من خلال التواصل مع خدمة العملاء.'
    },
    {
      q: 'كم تكلفة التوصيل؟',
      a: 'التوصيل مجاني للطلبات التي تتجاوز 500 دج. للطلبات الأقل، تختلف تكلفة التوصيل حسب المنطقة (تتراوح بين 100 إلى 300 دج).'
    },
    {
      q: 'كيف أتتبع طلبي؟',
      a: 'يمكنك تتبع طلبك من خلال قسم "تتبع الطلب" في القائمة الجانبية باستخدام رقم الطلب الذي استلمته بعد تأكيد الطلب.'
    },
    {
      q: 'ماذا لو وصلني منتج تالف أو خاطئ؟',
      a: 'في حالة استلام منتج تالف أو غير مطابق للطلب، يرجى التواصل مع خدمة العملاء عبر الواتساب خلال 24 ساعة من استلام الطلب لاستبداله.'
    },
    {
      q: 'كم تستغرق عملية التوصيل؟',
      a: 'تستغرق عملية التوصيل من 2 إلى 5 أيام حسب المنطقة. سيتم إعلامك برقم التتبع عند شحن الطلب.'
    },
    {
      q: 'كيف أحصل على خصم الكميات؟',
      a: 'الخصم يحسب تلقائياً عند إضافة المنتجات إلى السلة:\n• 5% عند شراء 6 قطع\n• 10% عند شراء 12 قطعة\n• 15% عند شراء 24 قطعة'
    },
    {
      q: 'ما هي طرق الدفع المتاحة؟',
      a: 'الدفع يكون عند الاستلام نقداً (C O D) أو عبر تحويل بنكي. سيتم إضافة الدفع الإلكتروني قريباً.'
    },
    {
      q: 'هل يمكنني إلغاء طلبي بعد التأكيد؟',
      a: 'نعم، يمكنك إلغاء الطلب خلال ساعة من تأكيده. للطلب بعد ذلك، يرجى التواصل مع خدمة العملاء.'
    },
    {
      q: 'كيف تعمل نقاط الولاء؟',
      a: 'كل 100 دج = نقطة واحدة، وكل 10 نقاط = خصم 50 دج على طلبك القادم. تظهر نقاطك بجانب اسمك بعد تسجيل الدخول.'
    },
    {
      q: 'هل يمكنني الحصول على فاتورة ضريبية؟',
      a: 'نعم، يمكنك طلب فاتورة ضريبية عند إتمام الطلب. سيتم إرسالها مع الطلب أو عبر البريد الإلكتروني.'
    }
  ]

  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth: 550 }}>
        <div className="mhead">
          <h3>❓ الأسئلة الشائعة</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#FFF0EB', borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 32 }}>📖</span>
            <p style={{ fontSize: 13, color: '#7A6A5A', marginTop: 4 }}>أجوبة على أكثر الأسئلة شيوعاً حول المتجر والمنتجات والتوصيل</p>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item" style={{ marginBottom: 12, border: '1px solid #E8DDD5', borderRadius: 12, overflow: 'hidden' }}>
              <div
                className="faq-question"
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  background: open === i ? '#FFF0EB' : '#F8F4F0',
                  padding: '14px 16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{faq.q}</span>
                <span style={{ fontSize: 14, color: '#FF6B35' }}>{open === i ? '▲' : '▼'}</span>
              </div>
              {open === i && (
                <div className="faq-answer" style={{ padding: '14px 16px', color: '#7A6A5A', borderTop: '1px solid #E8DDD5', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 16, padding: 12, background: '#F8F4F0', borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: '#7A6A5A' }}>لم تجد إجابة لسؤالك؟</p>
            <a
              href={`https://wa.me/213696668065`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-block', marginTop: 8, color: '#25D366', fontWeight: 700, textDecoration: 'none' }}
            >
              💬 تواصل معنا على واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}