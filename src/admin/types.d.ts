/**
 * @file types.d.ts
 * @description تعريفات أنواع TypeScript تدريجية (Gradual TypeScript)
 *
 * 🔷 المهمة 5.2: إضافة TypeScript تدريجياً
 * ------------------------------------------------------------
 * بما أن المشروع بالكامل مكتوب بـ JSX (لا .tsx)، التحويل الكامل
 * لـ TypeScript يعني إعادة كتابة كل صفحة — وهو عمل ضخم وخطر على
 * مشروع قيد التشغيل. البديل العملي والمعتمد في صناعة الويب هو:
 *
 *  1) الاحتفاظ بكل الملفات كـ .jsx (لا تغيير في الامتدادات)
 *  2) توثيق كل دالة بـ JSDoc (نوع المدخلات/المخرجات) — تم تطبيق
 *     هذا فعلاً على كل ملفات constants.js, utils.js, hooks/*.jsx
 *  3) تفعيل "// @ts-check" + jsconfig.json حتى يفحص VSCode/الإيدي
 *     الأنواع المُستنتجة من JSDoc دون أي عملية بناء (build step)
 *     إضافية ودون تغيير امتداد و لا سطر كود واحد
 *  4) تعريف الأنواع المشتركة (Product, Order, Customer...) هنا
 *     مرة واحدة، يستخدمها أي ملف عبر JSDoc: @param {Product} p
 *
 * هذا يعطي معظم فوائد TypeScript (إكمال تلقائي، اكتشاف أخطاء قبل
 * التشغيل) بأقل تكلفة وأقل خطر على الكود الحالي. حين يستقر الفريق
 * على القرار، يمكن نقل ملف واحد فعلياً إلى .ts/.tsx كخطوة تالية —
 * مثلاً utils.js → utils.ts هو أنسب نقطة بداية لأنه لا يحتوي JSX.
 * ------------------------------------------------------------
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} name
 * @property {number} price
 * @property {number} [cost_price]
 * @property {number} [carton_price]
 * @property {number} units
 * @property {number} stock
 * @property {number} [min_stock]
 * @property {string} [sku]
 * @property {number} [brand_id]
 * @property {string} [image] - صورة Base64
 * @property {boolean} [is_promo]
 * @property {number} [discount]
 * @property {string} [description]
 * @property {boolean} [disabled]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {string} customer_name
 * @property {string} [customer_phone]
 * @property {string} [customer_address]
 * @property {string} [phone]
 * @property {string} [address]
 * @property {number} total
 * @property {'pending'|'processing'|'shipped'|'delivered'|'confirmed'|'shipping'|'cancelled'} status
 * @property {string|Array<{name:string,price:number,quantity:number,qty?:number}>} items
 * @property {string} [date]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} Customer
 * @property {number} id
 * @property {string} name
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [address]
 * @property {string} [password] - SHA256 hash، لا يُعرض أبداً كنص صريح
 * @property {'M1'|'M2'|'M3'} [tier]
 * @property {string} [group]
 * @property {number} [points]
 * @property {number} [total_purchases]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} Employee
 * @property {number} id
 * @property {string} name
 * @property {string} username
 * @property {string} [password] - SHA256/bcrypt hash فقط
 * @property {string} [email]
 * @property {string} [phone]
 * @property {'admin'|'staff'} role
 * @property {Object.<string, string[]>} permissions - مثل { products: ['view','edit'] }
 */

/**
 * @typedef {Object} Promotion
 * @property {number} id
 * @property {string} name
 * @property {'percent'|'fixed'|'buy_x_get_y'|'tier_buy'} type
 * @property {boolean} active
 * @property {number} [buy_qty]
 * @property {number} [get_qty]
 * @property {number} [discount_value]
 * @property {number[]|string} [product_ids]
 * @property {number} [min_amount]
 * @property {string} [description]
 * @property {string} [end_date]
 * @property {string} [region]
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} name
 * @property {string} email
 * @property {'admin'|'staff'} role
 * @property {Object.<string, string[]>} permissions
 * @property {number} [id]
 */

export {}
