import { useState } from 'react'

export default function CartImport({ onLoad, busy, progress }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!url.trim() || busy) return
    setError(null)
    try {
      await onLoad(url.trim())
      setUrl('')
    } catch (err) {
      setError(err.message || 'Could not load that cart')
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-2">
      <form
        onSubmit={submit}
        className="w-full bg-white rounded-full shadow-[0_4px_18px_rgba(31,36,33,0.10)] border border-black/[0.04] flex items-center gap-1 pl-5 pr-1.5 py-1.5"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Ingresa tu carrito de Crocs.cl"
          disabled={busy}
          className="flex-1 min-w-0 bg-transparent text-sm font-medium placeholder:text-gray-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="shrink-0 px-4 py-2 rounded-full bg-[var(--color-coral)] text-white text-xs font-extrabold tracking-wide hover:brightness-95 active:scale-[0.98] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {busy ? 'Cargando…' : 'Cargar'}
        </button>
      </form>
      {busy && progress && (
        <p className="text-xs text-gray-500 text-center">{progress}</p>
      )}
      {error && (
        <p className="text-xs font-semibold text-[var(--color-coral)] text-center">
          {error}
        </p>
      )}
    </div>
  )
}
