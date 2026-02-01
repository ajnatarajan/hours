import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { RoomProvider } from '@/contexts/RoomContext'
import { Home } from '@/pages/Home'
import { Room } from '@/pages/Room'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <RoomProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
          </Routes>
        </RoomProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
