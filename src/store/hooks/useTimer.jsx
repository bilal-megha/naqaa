import { useState, useEffect } from 'react'

export function useTimer(endTime) {
  const [tl, setTl] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, (endTime || Date.now() + 3600000) - Date.now())
      if (diff <= 0) { setTl({ h: '00', m: '00', s: '00' }); return }
      setTl({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime])
  return tl
}
