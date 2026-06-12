/**
 * ReturnPolicy.jsx — صفحة سياسة الاسترجاع والاستبدال
 */
export default function ReturnPolicy({ onClose }) {
  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth: 550 }}>
        <div className="mhead">
          <h3>🔄 سياسة الاسترجاع والاستبدال</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#FFF0EB', borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 32 }}>📦</span>
            <p style={{ fontSize: 13, color: '#7A6A5A', marginTop: 4 }}>آخر تحديث: {new Date().toLocaleDateString('ar-DZ')}</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>📅 مدة الاسترجاع</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              يمكن للعميل استرجاع المنتج خلال <strong>14 يوماً</strong> من تاريخ استلام الطلب، بشرط أن يكون المنتج بحالته الأصلية.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>✅ شروط الاسترجاع والاستبدال</h4>
            <ul style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6, paddingRight: 20 }}>
              <li>المنتج غير مستخدم وفي حالته الأصلية (مع العبوة والملصقات).</li>
              <li>وجود الفاتورة الأصلية أو إثبات الشراء.</li>
              <li>المنتج غير قابل للاسترجاع إذا كان من المواد الغذائية بعد فتح العبوة الأصلية.</li>
              <li>المنتجات المخفضة بعروض خاصة لا تقبل الاسترجاع إلا في حالة وجود عيب مصنعي.</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>🔄 إجراءات الاسترجاع</h4>
            <ol style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6, paddingRight: 20 }}>
              <li>تواصل مع خدمة العملاء عبر الواتساب خلال 24 ساعة من اكتشاف المشكلة.</li>
              <li>قدم رقم الطلب وصور للمنتج (إذا كان به عيب).</li>
              <li>سيتم تأكيد طلب الاسترجاع خلال 48 ساعة.</li>
              <li>قم بتغليف المنتج بشكل آمن وإعادته إلى عنوان المتجر.</li>
              <li>بعد استلام المنتج والتأكد من حالته، سيتم استرداد المبلغ خلال 7 أيام.</li>
            </ol>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>💰 رسوم الاسترجاع</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - إذا كان الاسترجاع بسبب عيب مصنعي أو خطأ من المتجر، يتحمل المتجر جميع رسوم الشحن.<br />
              - إذا كان الاسترجاع لأسباب شخصية (عدم رغبة، تغيير الرأي)، يتحمل العميل رسوم الشحن (100-300 دج حسب المنطقة).
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>🚫 المنتجات غير القابلة للاسترجاع</h4>
            <ul style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6, paddingRight: 20 }}>
              <li>المنتجات الغذائية القابلة للتلف بعد فتحها.</li>
              <li>منتجات العناية الشخصية بعد فتح العبوة (لأسباب صحية).</li>
              <li>المنتجات التي تم استخدامها أو تلفها بسبب سوء الاستخدام.</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>⏱️ مدة استرداد المبلغ</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              يتم استرداد المبلغ خلال <strong>7 أيام عمل</strong> من تاريخ استلام المنتج المرتجع. سيتم إعلامك عبر البريد الإلكتروني أو الواتساب عند اكتمال العملية.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>📞 للتواصل</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              لأي استفسار بخصوص الاسترجاع، يمكنك التواصل معنا عبر:
              <br />💬 <strong>واتساب:</strong> <a href="https://wa.me/213696668065" target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>213696668065</a>
              <br />📧 <strong>البريد الإلكتروني:</strong> meghamel2012@gmail.com
              <br />📍 <strong>العنوان:</strong> الجزائر - سيتم إرسال عنوان الإرجاع عند تأكيد الطلب
            </p>
          </div>

          <div style={{ padding: 12, background: '#FFF0EB', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#7A6A5A' }}>
              * هذه السياسة قابلة للتعديل وفقاً للتشريعات الجزائرية. آخر تحديث: {new Date().toLocaleDateString('ar-DZ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}