/**
 * lib/imageUpload.js
 * رفع الصور إلى Supabase Storage بدل Base64
 *
 * الاستخدام:
 *   import { uploadImage, getImageUrl } from '../../lib/imageUpload.js'
 *
 *   const url = await uploadImage(file, 'products')
 *   // ثم احفظ url في قاعدة البيانات بدل base64
 */
import { supabase } from './supabase.js'

/**
 * رفع صورة إلى Supabase Storage
 * @param {File} file - ملف الصورة
 * @param {string} bucket - اسم الـ bucket ('products' | 'categories' | 'brands')
 * @param {string} [folder] - مجلد فرعي اختياري
 * @returns {Promise<string>} - الـ URL العام للصورة
 */
export async function uploadImage(file, bucket = 'products', folder = '') {
  if (!file) return null

  // ضغط الصورة قبل الرفع
  const compressed = await compressImage(file, 800, 0.8)

  const ext      = file.name.split('.').pop().toLowerCase()
  const filename = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, compressed, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error('فشل رفع الصورة: ' + error.message)

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

/**
 * حذف صورة من Storage
 */
export async function deleteImage(url, bucket = 'products') {
  if (!url || url.startsWith('data:')) return // تجاهل base64 القديمة
  try {
    const path = url.split(`/${bucket}/`)[1]
    if (path) await supabase.storage.from(bucket).remove([path])
  } catch(e) { console.warn('لم يتم حذف الصورة:', e) }
}

/**
 * ضغط الصورة في المتصفح قبل الرفع
 */
async function compressImage(file, maxSize = 800, quality = 0.8) {
  return new Promise((resolve) => {
    // إذا الصورة صغيرة أصلاً، لا تضغطها
    if (file.size < 200 * 1024) { resolve(file); return }

    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize }
          else { width = (width / height) * maxSize; height = maxSize }
        }

        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => resolve(blob || file), file.type, quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * تحويل base64 موجود إلى URL Storage (للهجرة التدريجية)
 */
export async function migrateBase64ToStorage(base64, bucket = 'products') {
  if (!base64 || !base64.startsWith('data:')) return base64
  try {
    const res  = await fetch(base64)
    const blob = await res.blob()
    const file = new File([blob], 'migrated.jpg', { type: blob.type })
    return await uploadImage(file, bucket)
  } catch(e) {
    console.warn('فشل نقل الصورة:', e)
    return base64
  }
}
