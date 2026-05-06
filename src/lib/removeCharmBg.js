import { removeBackground } from '@imgly/background-removal'

export async function fetchAndCleanImage(url) {
  const proxied = `/api/fetch-image?url=${encodeURIComponent(url)}`
  const res = await fetch(proxied)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Failed to fetch image (${res.status})`)
  }
  const inputBlob = await res.blob()
  const cleaned = await removeBackground(inputBlob)
  return URL.createObjectURL(cleaned)
}
