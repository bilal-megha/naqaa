/**
 * Terms.jsx — صفحة الشروط والأحكام
 */
export default function Terms({ onClose }) {
  return (
    <div className="moverlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msheet center" style={{ maxWidth: 550 }}>
        <div className="mhead">
          <h3>📜 الشروط والأحكام</h3>
          <button className="mclose" onClick={onClose}>×</button>
        </div>
        <div className="mbody" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#FFF0EB', borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 32 }}>⚖️</span>
            <p style={{ fontSize: 13, color: '#7A6A5A', marginTop: 4 }}>آخر تحديث: {new Date().toLocaleDateString('ar-DZ')}</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>1. قبول الشروط</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              باستخدامك لهذا المتجر الإلكتروني "نقاء"، فإنك توافق على جميع الشروط والأحكام المذكورة أدناه. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام المتجر.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>2. الحساب والتسجيل</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - يجب أن تكون جميع المعلومات المقدمة أثناء التسجيل صحيحة وكاملة.<br />
              - أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك.<br />
              - يحق لنا إلغاء حسابك في حالة مخالفة الشروط.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>3. الطلبات والدفع</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - جميع الطلبات تخضع للتأكيد من قبل إدارة المتجر قبل الشحن.<br />
              - الأسعار المعروضة شاملة جميع الضرائب وقد تتغير دون إشعار مسبق.<br />
              - الدفع عند الاستلام نقداً أو عبر التحويل البنكي.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>4. التوصيل</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - نقوم بالتوصيل إلى جميع ولايات الجزائر.<br />
              - مدة التوصيل تتراوح بين 2 إلى 5 أيام عمل حسب المنطقة.<br />
              - التوصيل مجاني للطلبات التي تتجاوز 500 دج.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>5. الخصوصية</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - بيانات العملاء محمية ولا يتم مشاركتها مع أي طرف ثالث.<br />
              - نستخدم بياناتك فقط لمعالجة الطلبات وتحسين الخدمة.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>6. حقوق الملكية الفكرية</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - جميع المحتويات المعروضة على الموقع (نصوص، صور، شعارات) هي ملك لمتجر نقاء.<br />
              - يمنع نسخ أو استخدام أي محتوى دون إذن مسبق.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>7. التعديلات على الشروط</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              - نحتفظ بالحق في تعديل هذه الشروط في أي وقت.<br />
              - سيتم إعلامك بأي تغييرات جوهرية عبر البريد الإلكتروني أو الإشعارات داخل الموقع.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#FF6B35' }}>8.联系我们</h4>
            <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>
              لأي استفسار بخصوص هذه الشروط، يمكنك التواصل معنا عبر:
              <br />📞 الهاتف: 0696668065
              <br />💬 واتساب: 213696668065
              <br />📧 البريد: meghamel2012@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}