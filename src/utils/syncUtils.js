function utf8ToBase64(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p) =>
      String.fromCharCode(parseInt(p, 16))
    )
  )
}

function base64ToUtf8(str) {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

export function buildSyncCode(state) {
  return utf8ToBase64(JSON.stringify(state))
}

export function parseSyncCode(code) {
  return JSON.parse(base64ToUtf8(String(code || '').trim()))
}

export function buildShareLink(syncCode) {
  return `${location.origin}${location.pathname}#sync=${syncCode}`
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    ok ? resolve() : reject(new Error('copy failed'))
  })
}
