import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login/Login'
import Home from '@/pages/Home/Home'
import '@/styles/index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
