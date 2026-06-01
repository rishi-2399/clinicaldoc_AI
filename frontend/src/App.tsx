import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import WorkspacePage from './components/WorkspacePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<WorkspacePage />} />
    </Routes>
  )
}
