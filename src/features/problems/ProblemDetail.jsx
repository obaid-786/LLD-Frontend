import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getLearnerId } from '../../api/client'
import DesignEditor from '../practice/DesignEditor'
import FeedbackView from '../feedback/FeedbackView'

export default function ProblemDetail() {
  const { id } = useParams()
  const learnerId = getLearnerId()

  const [problem, setProblem] = useState(null)
  const [attemptId, setAttemptId] = useState(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    api
      .getProblem(id)
      .then((p) => {
        if (!cancelled) setProblem(p)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })

    api
      .startAttempt(id, learnerId)
      .then((a) => {
        if (!cancelled) setAttemptId(a.id)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })

    return () => {
      cancelled = true
    }
  }, [id, learnerId])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const result = await api.submitAttempt(attemptId, content)
      setAttempt(result)
    } catch (e) {
      // Submit is usually sync; if it times out, try loading the attempt once.
      try {
        const fallback = await api.getAttempt(attemptId)
        if (fallback.evaluation) {
          setAttempt(fallback)
        } else {
          setError(e.message)
        }
      } catch {
        setError(e.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !problem) return <p className="error">{error}</p>
  if (!problem) return <p>Loading...</p>

  return (
    <div className="problem-detail">
      <h1>{problem.title}</h1>
      <span className="difficulty">{problem.difficulty}</span>
      <p className="description">{problem.description}</p>
      {problem.constraints && (
        <p className="constraints">
          <strong>Constraints:</strong> {problem.constraints}
        </p>
      )}

      {!attempt && (
        <DesignEditor
          content={content}
          onChange={setContent}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      )}

      {attempt && (
        <>
          <div style={{ padding: '16px', backgroundColor: '#f0f4f8', borderRadius: '8px', marginTop: '20px', marginBottom: '20px' }}>
            <h3>Your Submission</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>
              {attempt.submission_content}
            </pre>
          </div>
          <FeedbackView evaluation={attempt.evaluation} />
          <Link to="/history" className="history-link">
            View in History
          </Link>
        </>
      )}
    </div>
  )
}
