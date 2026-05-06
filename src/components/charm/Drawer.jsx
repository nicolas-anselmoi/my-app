import Charm from './Charm'

export default function Drawer({ charms, placement }) {
  const inDrawer = charms.filter((c) => !placement[c.id])

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Charms</h2>
      {inDrawer.length === 0 ? (
        <p className="text-sm text-gray-400">
          Paste a product image URL to add charms.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {inDrawer.map((c) => (
            <div key={c.id} className="relative">
              <Charm id={c.id} src={c.src} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
