import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'

export default function ProblemList() {
  const [problems, setProblems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .listProblems()
      .then(setProblems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading problems...</p>
  if (error) return <p className="error">Could not load problems: {error}</p>

  return (
    <div>
      <h1>Problems</h1>
      <p className="muted">Pick a problem, write a text design, and get rubric feedback.</p>
      <div className="card-list">
        {problems.map((p) => (
          <button
            type="button"
            key={p.id}
            className="problem-card"
            data-testid="problem-card"
            onClick={() => navigate(`/problems/${p.id}`)}
          >
            <h3>{p.title}</h3>
            <span className="difficulty">{p.difficulty}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
