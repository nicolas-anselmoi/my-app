import { useState } from 'react'
import { CHARM_ZONES } from '../../lib/charmZones'

export default function ZoneTuner({ zones, setZones }) {
  const [copied, setCopied] = useState(false)

  const code =
    'export const CHARM_ZONES = [\n' +
    zones
      .map((z) => `  { id: '${z.id}', x: ${z.x.toFixed(1)}, y: ${z.y.toFixed(1)} },`)
      .join('\n') +
    '\n]'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  function handleReset() {
    if (confirm('Reset zones to the defaults from charmZones.js?')) {
      setZones(CHARM_ZONES.map((z) => ({ ...z })))
    }
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Zone tuner</h2>
        <p className="text-xs text-gray-500 mt-1">
          Drag the numbered circles on the shoe to position each hole. When done,
          copy the code below into <code className="font-mono">src/lib/charmZones.js</code>.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
        >
          {copied ? 'Copied!' : 'Copy code'}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-auto max-h-72 leading-tight">
        {code}
      </pre>
    </div>
  )
}
