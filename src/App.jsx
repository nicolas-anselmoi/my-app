import { Routes, Route, Navigate } from 'react-router-dom'
import CharmDesigner from './pages/CharmDesigner'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CharmDesigner />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}