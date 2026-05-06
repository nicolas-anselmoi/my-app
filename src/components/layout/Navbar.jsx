import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-200 px-6 py-4 flex gap-6">
      <Link to="/" className="font-semibold text-gray-900">Home</Link>
      <Link to="/about" className="text-gray-500 hover:text-gray-900">About</Link>
    </nav>
  )
}