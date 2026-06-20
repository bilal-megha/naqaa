export function showToast(msg, isErr = false) {
  document.querySelectorAll('.toast').forEach(t => t.remove())
  const t = document.createElement('div')
  t.className = 'toast' + (isErr ? ' err' : '')
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2800)
}
