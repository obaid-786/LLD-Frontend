export default function FeedbackView({ evaluation }) {
  if (!evaluation) return null

  const statusClass = evaluation.status?.toLowerCase() || ''

  return (
    <div className="feedback-view" data-testid="feedback-view">
      <h3>Feedback</h3>
      <p className={`status status-${statusClass}`}>{evaluation.status}</p>
      {evaluation.overall_summary && (
        <p className="summary">{evaluation.overall_summary}</p>
      )}
      <div className="rubric-scores">
        {(evaluation.scores || []).map((s, i) => (
          <div key={i} className="rubric-card" data-testid="rubric-card">
            <div className="rubric-header">
              <strong>{s.criterion}</strong>
              <span className="score">{s.score}/10</span>
            </div>
            {s.evidence && (
              <p>
                <em>Evidence:</em> {s.evidence}
              </p>
            )}
            {s.concern && (
              <p>
                <em>Concern:</em> {s.concern}
              </p>
            )}
            {s.suggestion && (
              <p>
                <em>Suggestion:</em> {s.suggestion}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
