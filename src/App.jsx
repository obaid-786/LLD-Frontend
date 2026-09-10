import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import Navbar from './layout/Navbar'
import ProblemList from './features/problems/ProblemList'
import ProblemDetail from './features/problems/ProblemDetail'
import AttemptHistory from './features/history/AttemptHistory'

function ProblemDetailPage() {
  const { id } = useParams()
  return <ProblemDetail key={id} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<ProblemList />} />
          <Route path="/problems/:id" element={<ProblemDetailPage />} />
          <Route path="/history" element={<AttemptHistory />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
