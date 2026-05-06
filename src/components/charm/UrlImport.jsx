import { useState } from 'react'
import { fetchAndCleanImage } from '../../lib/removeCharmBg'

export default function UrlImport({ onAdd }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const cleanedSrc = await fetchAndCleanImage(url.trim())
      onAdd(cleanedSrc)
      setUrl('')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="border border-gray-200 rounded-2xl p-4 bg-white">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Add a charm from an image URL
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/product.jpg"
          disabled={busy}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:bg-gray-300"
        >
          {busy ? 'Working…' : 'Add'}
        </button>
      </div>
      {busy && (
        <p className="mt-2 text-xs text-gray-500">
          Fetching image and removing background — first run may take a minute (model download).
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  )
}
