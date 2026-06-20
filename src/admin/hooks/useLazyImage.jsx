/**
 * @file useLazyImage.js
 * @description Hook وMكوّن لتحميل الصور بشكل كسول (Lazy Loading)
 * يستخدم IntersectionObserver لتحميل الصورة فقط عند ظهورها في الشاشة
 */
import { useState, useEffect, useRef } from 'react'

/**
 * Hook: يُعيد ref + هل الصورة دخلت نطاق الرؤية
 * @param {{ threshold?: number, rootMargin?: string }} [options]
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export function useInView(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect() // بعد التحميل لا نحتاج المراقبة
      }
    }, {
      threshold:  options.threshold  ?? 0.1,
      rootMargin: options.rootMargin ?? '100px',
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

/**
 * مكوّن صورة كسولة التحميل مع placeholder وfallback
 *
 * @param {{
 *   src: string,
 *   alt?: string,
 *   width?: number|string,
 *   height?: number|string,
 *   style?: object,
 *   fallback?: string,
 *   radius?: number,
 * }} props
 *
 * @example
 * <LazyImage src={product.image} width={56} height={56} radius={8} />
 */
export function LazyImage({ src, alt = '', width = 56, height = 56, style = {}, fallback = '📦', radius = 8 }) {
  const { ref, isVisible } = useInView()
  const [loaded,  setLoaded]  = useState(false)
  const [errored, setErrored] = useState(false)

  const base = {
    width, height, borderRadius: radius,
    objectFit: 'cover', display: 'block', flexShrink: 0,
    ...style,
  }

  // placeholder أثناء الانتظار أو عند الخطأ
  if (!src || errored) {
    return (
      <div ref={ref} style={{ ...base, background: '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.max(16, Number(width) * 0.4), color: '#94A3B8' }}>
        {fallback}
      </div>
    )
  }

  return (
    <div ref={ref} style={{ ...base, position: 'relative', background: '#F1F5F9', overflow: 'hidden' }}>
      {/* shimmer أثناء التحميل */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      )}
      {isVisible && (
        <img
          src={src} alt={alt} loading="lazy"
          width={width} height={height}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{ ...base, opacity: loaded ? 1 : 0, transition: 'opacity .3s' }}
        />
      )}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}
