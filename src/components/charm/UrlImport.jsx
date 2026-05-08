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
    <form
      onSubmit={submit}
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(31,36,33,0.06)] border border-black/[0.04]"
    >
      <label className="block text-sm font-bold mb-3 text-center">
        Add a charm from any product image
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste an image URL"
          disabled={busy}
          className="flex-1 bg-[var(--color-canvas)] border border-black/[0.06] rounded-full px-5 py-3 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint-strong)] focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="px-6 py-3 rounded-full bg-[var(--color-ink)] text-white text-sm font-extrabold hover:bg-black active:scale-[0.98] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {busy ? 'Working…' : 'Add charm'}
        </button>
      </div>
      {busy && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          First time may take a minute — downloading the background remover.
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs font-semibold text-[var(--color-coral)] text-center">
          {error}
        </p>
      )}
    </form>
  )
}
