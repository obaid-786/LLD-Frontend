export default function DesignEditor({ content, onChange, onSubmit, submitting, error }) {
  const tooShort = content.trim().length < 20
  const tooLong = content.length > 20000

  return (
    <div className="editor">
      <textarea
        data-testid="design-textarea"
        rows={16}
        placeholder="Describe your classes, responsibilities, requirements, and reasoning..."
        value={content}
        onChange={(e) => onChange(e.target.value)}
        disabled={submitting}
      />
      <p className="muted">{content.trim().length} / 20000 characters (min 20)</p>
      <button
        type="button"
        data-testid="submit-btn"
        onClick={onSubmit}
        disabled={submitting || tooShort || tooLong}
      >
        {submitting ? 'Evaluating...' : 'Submit'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
