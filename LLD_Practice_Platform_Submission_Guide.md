# LLD Practice Platform — Complete 2-Day Submission Guide
### CipherSchools Hiring Assignment (SEP'2026)

This guide turns the assignment requirements into a step-by-step, hour-by-hour build plan. It assumes **zero prior experience** — every milestone tells you exactly what to build and why, in an order that keeps something demoable at all times.

---

## 0. Read This First — The Rules That Decide Your Score

Before writing a single line of code, internalize the scoring weights. They tell you where your *time* should go, not just your code:

| Area | Weight | What it really means |
|---|---|---|
| LLD / domain design | 25% | Your classes, interfaces, responsibilities — the heart of this assignment |
| Problem understanding & research | 15% | You must show you thought about the *learner problem*, not just code |
| Product thinking / creativity | 15% | A focused MVP, not a feature dump |
| Evaluation & feedback approach | 15% | How you turn a submission into useful, evidence-based feedback |
| Extensibility & engineering judgement | 10% | Can you add a new evaluator or submission type without a rewrite? |
| Implementation quality | 10% | Clean, working code — not "production-grade" |
| Testing & reliability | 5% | A few solid tests beat zero tests |
| AI usage | 5% | Thoughtful, documented AI usage |

**Key takeaway:** 55% of your grade (Research + Product + LLD + Evaluation) is about *thinking and design*, not raw code volume. A fresher's biggest trap is writing lots of UI and skipping the domain design — avoid that.

---

## 1. Tech Stack — Chosen for Your Skill Order

Your skills ranked highest → lowest: **Python, MySQL, JavaScript, React, Node**.

Recommended stack:

| Layer | Choice | Why |
|---|---|---|
| Backend | **Python + FastAPI** | Your strongest skill. FastAPI gives you request validation, auto docs (`/docs`), and clean structure fast — ideal for a 2-day build. |
| Database | **MySQL** | Your 2nd strongest skill, and required data (Problems, Attempts, Submissions, Evaluations) is naturally relational. |
| Frontend | **React** (plain, minimal) | You're stronger in raw JavaScript than React, so keep the UI intentionally simple: few components, no heavy state library, no Redux. Use built-in `useState`/`fetch`. |
| Skip | **Node.js** | Your weakest skill and not needed — Python replaces it as the backend. Don't try to use two backend languages; that wastes time you don't have. |
| AI | **One LLM API call** (OpenAI/Claude/Gemini — whichever you have a key for) | A single structured-prompt call for the "judgment" part of evaluation. No agent framework, no LangChain needed. |

This combination lets you spend your time on **domain design and evaluation logic** (where the marks are) instead of fighting an unfamiliar stack.

---

## 2. The MVP You Are Building (Keep This Fixed — Do Not Expand It)

**Practice loop:** Choose problem → Design/write solution → Submit → Get feedback → Review → Try again.

Fixed scope for 2 days:
- **3 LLD problems** stored in the DB (e.g., Parking Lot, Vending Machine, Elevator System) — write these yourself as fixtures, don't build an admin panel to create them.
- **One submission format: Text design** (requirements assumptions + class list + responsibilities + reasoning, as plain structured text/markdown). This is the smallest format that still proves design quality — you are explicitly allowed to justify "text only" instead of building a diagram tool.
- **One evaluator**: rubric-driven, partly deterministic (structure checks) + one LLM call (judgment checks).
- **Attempt history**: a learner can see all past attempts and their statuses/feedback.

**Explicitly do NOT build:** login/auth system beyond a simple mock user, diagram editor, code execution sandbox, multiple evaluators, admin CMS, microservices, or a polished design system. If you have spare time on Day 2 evening, THEN consider a stretch item (see §9).

---

## 3. Domain Design — The Core of Your Grade (25%)

Design these classes/entities. Write this out in your **Design Note** with a short reasoning per class ("what responsibility does it own, what does it depend on, what's likely to change").

```
Problem
 - id, title, description, constraints, difficulty
 - responsibility: hold problem context/requirements, immutable once published

Attempt
 - id, problemId, learnerId, status (InProgress, Submitted, Evaluating, Completed, Failed)
 - startedAt, submittedAt
 - responsibility: represents one learner's practice session lifecycle for a problem

Submission
 - id, attemptId, content (text design), format ("text"), createdAt
 - responsibility: the actual artifact the learner produced; decoupled from Attempt
   so a future format (diagram/code) only adds a new Submission subtype/format field,
   not a new Attempt model — this answers "Change Test A" in the doc.

Evaluator (interface)
 - evaluate(submission) -> Evaluation
 - responsibility: abstraction so you can plug in DeterministicEvaluator,
   LLMEvaluator, or later RuleBasedEvaluator/HumanEvaluator without touching
   the practice flow — this answers "Change Test B".

DeterministicEvaluator implements Evaluator
 - checks: required sections present (classes, responsibilities, requirements),
   min length, no empty fields

LLMEvaluator implements Evaluator
 - sends a fixed rubric prompt, parses structured JSON response

Evaluation
 - id, submissionId, criterionScores[], overallSummary, status, createdAt
 - responsibility: stores the *result* of one or more evaluators against a submission

RubricCriterion (value object)
 - name (e.g. "Class Responsibilities", "Coupling/Cohesion", "Extensibility")
 - score, evidence, concern, suggestion
 - responsibility: one dimension of feedback — this is what makes feedback
   "useful" instead of a bare numeric score
```

**Why this shape matters:** `Evaluator` as an interface with two implementations is your strongest LLD statement — it directly answers the assignment's "which parts should be deterministic vs LLM" question in code, not just prose, and it's a small, honest use of a design pattern (Strategy) rather than pattern-for-pattern's-sake.

---

## 4. MySQL Schema (Minimal, Matches the Domain Above)

```sql
CREATE TABLE problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  constraints TEXT,
  difficulty VARCHAR(20)
);

CREATE TABLE attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  learner_id VARCHAR(100) NOT NULL,       -- mock user id, no full auth needed
  status VARCHAR(20) NOT NULL DEFAULT 'InProgress',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  format VARCHAR(20) DEFAULT 'text',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id)
);

CREATE TABLE evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending/Evaluating/Completed/Failed
  overall_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE TABLE rubric_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluation_id INT NOT NULL,
  criterion VARCHAR(100) NOT NULL,
  score INT NOT NULL,
  evidence TEXT,
  concern TEXT,
  suggestion TEXT,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
);
```

Seed `problems` with 3 rows (Parking Lot, Vending Machine, Elevator System — write 3–5 sentence requirement text for each) as part of Day 1 setup.

---

## 5. API Endpoints (FastAPI)

```
GET    /problems                     -> list the 3 problems
GET    /problems/{id}                -> problem detail

POST   /attempts                     -> start attempt {problemId, learnerId} -> status InProgress
GET    /attempts?learnerId=          -> learner's attempt history
GET    /attempts/{id}                -> attempt detail incl. submission + evaluation if present

POST   /attempts/{id}/submit         -> body: {content}; creates Submission,
                                         sets attempt status = Submitted,
                                         creates Evaluation (status=Pending),
                                         triggers evaluation (see §7 for async handling)

GET    /evaluations/{id}             -> evaluation result + rubric scores
```

Keep it REST-simple. No GraphQL, no versioning — not worth the time.

---

## 6. Hour-by-Hour Milestone Plan (48 Hours)

### DAY 1 — Research, Design, Backend Core

**Hours 0–2: Research (do this before any code)**
- Search "LLD interview practice tool", "system design practice platform", 2–3 GitHub repos or blog posts on design review/code review tooling.
- Note: how do existing tools let learners submit? What does feedback look like (score/comments/rubric)? What's missing?
- Write rough notes — you'll turn these into the **Research Note** deliverable in Hour 20-ish (don't polish yet).

**Hours 2–4: Define MVP + Design Note skeleton**
- Lock the MVP from §2 above. Do not deviate later.
- Draft the domain model from §3 as a simple diagram (boxes + arrows is enough — hand-drawn/exported from draw.io or even ASCII, doesn't need to be fancy) and put it in `DESIGN.md`.
- Write the two "change tests" answers explicitly (§3 already answers them — copy that reasoning into your Design Note in your own words).

**Hours 4–6: Project scaffolding**
- `backend/` (FastAPI) + `frontend/` (React, via `create-react-app` or Vite) + MySQL running locally (or Docker Compose with a `mysql` service — simplest: local MySQL install).
- Get a "hello world" endpoint returning JSON, confirm React can fetch it. This derisks integration early.

**Hours 6–10: Backend domain models + DB**
- Create the SQL schema from §4, seed 3 problems.
- Implement `Problem`, `Attempt`, `Submission`, `Evaluation`, `RubricCriterion` as Python classes/Pydantic models — mirror §3 exactly.
- Implement `GET /problems`, `GET /problems/{id}`, `POST /attempts`, `GET /attempts`, `GET /attempts/{id}`.
- Test each endpoint manually via FastAPI's auto `/docs` page (Swagger UI) — this alone is a fast way to verify without building frontend yet.

**Hours 10–13: Evaluator interface + Deterministic evaluator**
- Implement the `Evaluator` interface (an abstract base class in Python: `class Evaluator(ABC): def evaluate(self, submission) -> Evaluation`).
- Implement `DeterministicEvaluator`: checks the submission text contains sections like "Classes", "Responsibilities", "Requirements/Assumptions" (simple keyword/structure check), flags missing sections as a rubric criterion with score 0 and a suggestion.
- Wire `POST /attempts/{id}/submit` to: save Submission → create Evaluation(Pending) → run DeterministicEvaluator synchronously (fast, no need for async yet) → update Evaluation status.

**Hours 13–15: LLM Evaluator**
- Design ONE fixed prompt implementing the rubric shape from the doc: `criterion → score → evidence → concern → suggestion → confidence`.
- Use criteria: Requirement Understanding, Class Responsibilities, Coupling/Cohesion, Encapsulation/Interfaces, Extensibility, Edge Cases/Testability, Quality of Explanation. (Pick 4–5 if time is tight — quality over quantity.)
- Force structured JSON output (ask the model to return ONLY valid JSON matching a schema you specify in the prompt). Parse it into `RubricCriterion` rows.
- Wrap the LLM call in try/except: on failure, set Evaluation status = `Failed` with a summary saying "AI evaluation unavailable, deterministic checks only" — this directly answers the doc's "what happens if evaluation fails" question.

**Hours 15–16: Wrap up Day 1**
- Commit code, write a short progress note to yourself of what's left.
- Sanity check: can you `POST /attempts`, `POST /attempts/{id}/submit`, and `GET /evaluations/{id}` end-to-end via Swagger UI right now? If not, this is your top priority first thing Day 2 — don't start the frontend until the backend loop works.

*(Remaining Day 1 hours are buffer/sleep — a fresher should not code 16 hours straight; budget realistically, e.g., 8–10 working hours across "Day 1".)*

---

### DAY 2 — Frontend, History, Testing, Docs, Polish

**Hours 0–1: Plan the 4 screens (don't add a 5th)**
1. Problem list
2. Problem detail + "Start Attempt" + text editor (a `<textarea>` is fine) + Submit button
3. Feedback view (after submit — poll or just fetch once evaluation completes; see §7 for the "don't block" pattern)
4. Attempt history list (per learner, mock learnerId is fine — e.g., a fixed string or simple name input at the top)

**Hours 1–5: Build the 4 screens in React**
- Keep components minimal: `ProblemList`, `ProblemDetail`, `AttemptEditor`, `FeedbackView`, `AttemptHistory`.
- Use plain `fetch` + `useState`/`useEffect`. No Redux, no React Query — not worth the setup time for an MVP.
- Style with plain CSS or a minimal utility approach — a clean, uncluttered UI beats a half-finished fancy one. Simplicity here is a feature, not a shortcut, given your weighting.

**Hours 5–6: Wire submit → feedback flow**
- On submit, show a simple "Evaluating..." state (this demonstrates you thought about the async/slow-AI concern from the doc) with a poll every 2 seconds against `GET /attempts/{id}` until status is `Completed`/`Failed`, then render the rubric feedback (criterion, score, evidence, concern, suggestion) as cards or a table.

**Hours 6–7: Attempt history**
- List past attempts with problem title, status, and a link to view feedback again — this satisfies the "History" requirement of showing improvement over time, not just one-off solving.

**Hours 7–9: Tests**
- Backend (pytest): 
  - Test `DeterministicEvaluator` flags a submission missing required sections.
  - Test full flow: create attempt → submit → evaluation created with status transitions correctly.
  - Test edge case: empty submission content is rejected (validation).
  - Test edge case: LLM evaluator failure path sets status `Failed` gracefully (mock the LLM call to throw).
- These 4–5 tests are enough — the doc explicitly says "a few failure/edge cases", not full coverage.

**Hours 9–10: Idempotency + state-transition guard**
- Add a check: if `Attempt.status` is already `Submitted`/`Evaluating`/`Completed`, reject a duplicate `POST /submit` with a clear error — this directly answers the doc's "avoid duplicate processing" point and costs you ~15 minutes.

**Hours 10–12: Documentation — the deliverables that are easy to lose marks on**
- `README.md`: how to run backend (`pip install -r requirements.txt`, `uvicorn main:app`), how to run frontend (`npm install`, `npm start`), how to set up MySQL (schema file + seed script), env vars needed (LLM API key), known limitations (single evaluator format, no auth, text-only submissions, no queue for evaluation — call these out honestly, it reads as engineering judgement, not weakness).
- `RESEARCH.md` (1–2 pages): learner problem, 2–3 tools/approaches you looked at, key gaps, your product direction — expand your Hour 0–2 notes into full prose.
- `DESIGN.md`: MVP description, user flow diagram, class list with responsibilities (from §3), evaluation approach (deterministic vs LLM split + why), trade-offs (e.g., "text-only submission to save implementation time; synchronous evaluation instead of a queue since latency is acceptable for MVP scale").
- `AI_USAGE.md`: **do this honestly and specifically** — list 3–5 real moments: e.g., "Asked AI to draft the FastAPI boilerplate — accepted structure, rejected its suggestion to add JWT auth since out of scope for MVP", "Asked AI to help design the rubric prompt — accepted the JSON-schema-forcing approach, rewrote the criteria list myself to match the assignment's actual dimensions". Specific > generic.

**Hours 12–13: Final pass**
- Walk through the entire practice loop yourself once, end to end, on a fresh browser tab: choose problem → write a deliberately weak submission → submit → see feedback → check it appears in history → try a second attempt on the same problem.
- Fix anything broken. Do not add new features at this point.

**Hours 13–14: Submit**
- Push to GitHub (public or accessible repo), double-check the README instructions work on a clean clone if possible.
- Fill and submit the Google Form from the assignment.

---

## 6.1 LLM Integration in Detail — Which Free Model, and How to Wire It In

This expands Hours 13–15 above. You need roughly **10–20 total LLM calls** to build and test this (one per submission you try, plus a handful during development) — every option below covers that with enormous headroom, so pick based on ease of setup, not "which has the biggest quota."

### Which free model to use

| Option | Why pick it | Setup friction |
|---|---|---|
| **Groq (recommended)** — e.g. `openai/gpt-oss-120b` or `llama-3.3-70b-versatile`-class model on their current free lineup | No credit card required, very fast responses (seconds, sometimes sub-second), generous free daily request quota, and its Python SDK is OpenAI-compatible so the code below is easy to read/adapt. Fast responses matter for your "don't block the UI too long" requirement in §7. | Lowest — sign up, copy key, done. |
| **Google Gemini API (AI Studio)** — a current Flash-tier model | No card required, huge context window if your prompts ever grow, good structured-JSON support. Solid alternative if Groq's specific model lineup changes. | Low — sign up via AI Studio, copy key. |
| **OpenRouter (`:free` models)** | One account, many free models behind a single OpenAI-compatible endpoint — useful if you want a fallback model without juggling multiple SDKs. Lower daily request ceiling on the free tier than Groq. | Low, but the free-model catalog rotates, so pin a specific model id when you start and don't assume it stays free forever. |

**Recommendation for this assignment:** use **Groq** as your primary — fastest to set up, fastest to respond (keeps your "Evaluating..." spinner from §6 Day 2 short), and no billing surprises. Structure your code so the provider is a config value, not hardcoded (see below) — that alone is a small, free extensibility point you can mention in `DESIGN.md`.

> Free-tier quotas and exact model names on all three change fairly often — when you actually start building, spend 5 minutes on the provider's current pricing/docs page to confirm today's free model name and daily limit before you hardcode it.

### How it plugs into your system

It lives in exactly one place: `backend/evaluators/llm.py`, behind the `Evaluator` interface from §3. Nothing else in your system should know which provider you used — that's the point of the abstraction.

**1. Environment setup (`backend/.env`, never committed):**
```
LLM_API_KEY=your_groq_key_here
LLM_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=groq
```
`backend/.env.example` should have the same keys with placeholder values, so the recruiter knows exactly what to fill in.

**2. Install the client:**
```bash
pip install groq          # or: pip install google-generativeai   (for Gemini)
```

**3. The fixed rubric prompt** — build this once as a template, not per-request string concatenation:

```python
# backend/evaluators/rubric_prompt.py

RUBRIC_CRITERIA = [
    "Requirement Understanding",
    "Class Responsibilities",
    "Coupling and Cohesion",
    "Encapsulation and Interfaces",
    "Extensibility",
    "Edge Cases and Testability",
]

PROMPT_TEMPLATE = """You are evaluating a Low-Level Design (LLD) submission for the problem below.
Score it strictly against the fixed rubric. Do not invent extra criteria.

PROBLEM REQUIREMENTS:
{problem_description}

CANDIDATE SUBMISSION:
{submission_content}

For each of these criteria, respond with a score, evidence from the submission, a concern, and a suggestion:
{criteria_list}

Respond with ONLY valid JSON, no markdown fences, no extra text, matching exactly this shape:
{{
  "criteria": [
    {{
      "criterion": "string, must be one of the listed criteria",
      "score": "integer 0-5",
      "evidence": "short quote or paraphrase from the submission",
      "concern": "one sentence, or empty string if none",
      "suggestion": "one sentence, actionable",
      "confidence": "float 0-1"
    }}
  ],
  "overall_summary": "2-3 sentences summarizing the design quality"
}}
"""

def build_prompt(problem_description: str, submission_content: str) -> str:
    return PROMPT_TEMPLATE.format(
        problem_description=problem_description,
        submission_content=submission_content,
        criteria_list="\n".join(f"- {c}" for c in RUBRIC_CRITERIA),
    )
```

**4. The evaluator implementation:**

```python
# backend/evaluators/llm.py
import json, os
from groq import Groq
from .base import Evaluator
from .rubric_prompt import build_prompt, RUBRIC_CRITERIA

class LLMEvaluator(Evaluator):
    def __init__(self):
        self.client = Groq(api_key=os.environ["LLM_API_KEY"])
        self.model = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")

    def evaluate(self, problem_description: str, submission_content: str) -> dict:
        prompt = build_prompt(problem_description, submission_content)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,              # low temperature = more consistent scoring
            response_format={"type": "json_object"},  # forces valid JSON where supported
            timeout=15,                   # keep the request from hanging the endpoint
        )

        raw = response.choices[0].message.content
        return self._parse_and_validate(raw)

    def _parse_and_validate(self, raw: str) -> dict:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            raise ValueError("LLM did not return valid JSON")

        valid_names = set(RUBRIC_CRITERIA)
        for item in data.get("criteria", []):
            if item.get("criterion") not in valid_names:
                raise ValueError(f"Unexpected criterion: {item.get('criterion')}")
            if not (0 <= int(item.get("score", -1)) <= 5):
                raise ValueError("Score out of range")

        return data
```

**5. Wiring it into the submit flow** (in `routes/attempts.py`, matching §7's failure handling):

```python
@router.post("/attempts/{attempt_id}/submit")
def submit_attempt(attempt_id: int, body: SubmitRequest):
    submission = save_submission(attempt_id, body)          # persisted first, per §7 step 1
    evaluation = create_evaluation(submission.id, status="Pending")

    deterministic_result = DeterministicEvaluator().evaluate(submission)
    save_rubric_scores(evaluation.id, deterministic_result)

    try:
        set_status(evaluation, "Evaluating")
        llm_result = LLMEvaluator().evaluate(
            problem_description=get_problem(attempt_id).description,
            submission_content=submission.content,
        )
        save_rubric_scores(evaluation.id, llm_result["criteria"])
        save_summary(evaluation.id, llm_result["overall_summary"])
        set_status(evaluation, "Completed")
    except Exception as e:
        set_status(evaluation, "Failed")
        save_summary(evaluation.id, "AI evaluation unavailable — showing automated structural checks only.")
        log.warning(f"LLM evaluation failed for evaluation {evaluation.id}: {e}")

    return get_attempt(attempt_id)
```

Notice the `DeterministicEvaluator` result is saved **before** the LLM call runs and is never lost even if the LLM call fails — this is what makes the "what if evaluation fails" answer from §7 real rather than theoretical.

### Practical tips that save you debugging time

- **Always set `temperature` low (0.1–0.3)** — you want consistent, comparable scores across attempts, not creative variation.
- **Ask for JSON and use the provider's JSON mode if available** (`response_format={"type": "json_object"}` on Groq/OpenAI-compatible APIs); still wrap parsing in try/except, because free-tier models occasionally add stray text even when asked not to.
- **Set an explicit request timeout** (10–20s) so a slow/hanging API call can't hang your `/submit` endpoint — pair this with the try/except failure path from §7.
- **Cap `submission_content` length** you send in the prompt (e.g., first ~3000 characters) — protects you from a learner pasting something huge and blowing your token budget or hitting model context limits.
- **Log the raw LLM response** (not to the user, just server-side) whenever parsing fails — this is invaluable for debugging in your remaining hours, and you can mention "structured logging of evaluation failures" as a small reliability touch in `DESIGN.md`.
- **Never hardcode the API key** — only ever read it from `os.environ`, keep `.env` in `.gitignore` (already covered in §10), and double check it's absent before you zip (§12) or push publicly.

---

## 6.2 Backend Implementation in Detail

**Database access choice:** use `mysql-connector-python` with plain parameterized SQL — not a full ORM (SQLAlchemy/Tortoise). For a 5-table schema over 2 days, an ORM's setup/migration overhead costs more time than it saves, and hand-written SQL is easier for a fresher to reason about and debug. Mention this trade-off explicitly in `DESIGN.md` ("chose raw parameterized SQL over an ORM to keep the 5-table schema simple and debuggable within the time box").

**`requirements.txt`:**
```
fastapi
uvicorn[standard]
mysql-connector-python
pydantic
groq
python-dotenv
pytest
httpx
```

**`backend/db/connection.py`** — one shared connection pool, used everywhere:
```python
import os, mysql.connector.pooling
from dotenv import load_dotenv

load_dotenv()

pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="lld_pool",
    pool_size=5,
    host=os.environ["DB_HOST"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    database=os.environ["DB_NAME"],
)

def get_conn():
    return pool.get_connection()
```

**`backend/models/schemas.py`** — Pydantic models for request/response validation (kept separate from raw DB rows so your API contract is explicit):
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProblemOut(BaseModel):
    id: int
    title: str
    description: str
    constraints: Optional[str] = None
    difficulty: Optional[str] = None

class SubmitRequest(BaseModel):
    content: str = Field(..., min_length=20, max_length=20000)
    format: str = Field(default="text")       # "text" or "code" once §9.1 is added
    language: Optional[str] = None

class RubricScoreOut(BaseModel):
    criterion: str
    score: int
    evidence: str
    concern: str
    suggestion: str

class EvaluationOut(BaseModel):
    id: int
    status: str
    overall_summary: Optional[str] = None
    scores: List[RubricScoreOut] = []

class AttemptOut(BaseModel):
    id: int
    problem_id: int
    status: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
    submission_content: Optional[str] = None
    evaluation: Optional[EvaluationOut] = None
```

**`backend/evaluators/base.py`** — the interface everything else depends on:
```python
from abc import ABC, abstractmethod

class Evaluator(ABC):
    @abstractmethod
    def evaluate(self, problem_description: str, submission_content: str) -> dict:
        """Returns {"criteria": [...], "overall_summary": str}"""
        raise NotImplementedError
```

**`backend/evaluators/deterministic.py`** — the structural checker (runs first, always succeeds, never touches the network):
```python
from .base import Evaluator

REQUIRED_SECTIONS = ["class", "responsibilit", "requirement"]  # substring match, case-insensitive

class DeterministicEvaluator(Evaluator):
    def evaluate(self, problem_description: str, submission_content: str) -> dict:
        text_lower = submission_content.lower()
        criteria = []

        for section in REQUIRED_SECTIONS:
            present = section in text_lower
            criteria.append({
                "criterion": f"Structure: mentions '{section}'",
                "score": 5 if present else 0,
                "evidence": "Found in submission" if present else "Not found",
                "concern": "" if present else f"Submission does not appear to address {section}s.",
                "suggestion": "" if present else f"Explicitly describe the {section}s in your design.",
                "confidence": 1.0,
            })

        word_count = len(submission_content.split())
        criteria.append({
            "criterion": "Sufficient detail",
            "score": 5 if word_count >= 80 else max(0, word_count // 16),
            "evidence": f"{word_count} words",
            "concern": "" if word_count >= 80 else "Submission seems too short to convey a full design.",
            "suggestion": "" if word_count >= 80 else "Expand on responsibilities and reasoning.",
            "confidence": 1.0,
        })

        return {"criteria": criteria, "overall_summary": "Automated structural check complete."}
```

**`backend/routes/problems.py`:**
```python
from fastapi import APIRouter, HTTPException
from db.connection import get_conn
from models.schemas import ProblemOut

router = APIRouter()

@router.get("/problems", response_model=list[ProblemOut])
def list_problems():
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, title, description, constraints, difficulty FROM problems")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@router.get("/problems/{problem_id}", response_model=ProblemOut)
def get_problem(problem_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, title, description, constraints, difficulty FROM problems WHERE id=%s", (problem_id,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Problem not found")
    return row
```

**`backend/routes/attempts.py`** — the core flow, including the idempotency guard from §6 Hours 9–10:
```python
from fastapi import APIRouter, HTTPException
from db.connection import get_conn
from models.schemas import SubmitRequest, AttemptOut
from evaluators.deterministic import DeterministicEvaluator
from evaluators.llm import LLMEvaluator
import logging

router = APIRouter()
log = logging.getLogger("attempts")

@router.post("/attempts")
def start_attempt(problem_id: int, learner_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO attempts (problem_id, learner_id, status) VALUES (%s, %s, 'InProgress')",
        (problem_id, learner_id),
    )
    conn.commit()
    attempt_id = cur.lastrowid
    cur.close(); conn.close()
    return {"id": attempt_id, "status": "InProgress"}

@router.get("/attempts", response_model=list[AttemptOut])
def list_attempts(learner_id: str):
    # fetch attempts + latest submission + evaluation summary for this learner_id
    ...  # same pattern as get_attempt below, applied per row

@router.get("/attempts/{attempt_id}", response_model=AttemptOut)
def get_attempt(attempt_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM attempts WHERE id=%s", (attempt_id,))
    attempt = cur.fetchone()
    if not attempt:
        cur.close(); conn.close()
        raise HTTPException(status_code=404, detail="Attempt not found")

    cur.execute("SELECT * FROM submissions WHERE attempt_id=%s ORDER BY id DESC LIMIT 1", (attempt_id,))
    submission = cur.fetchone()

    evaluation_out = None
    if submission:
        cur.execute("SELECT * FROM evaluations WHERE submission_id=%s ORDER BY id DESC LIMIT 1", (submission["id"],))
        evaluation = cur.fetchone()
        if evaluation:
            cur.execute("SELECT criterion, score, evidence, concern, suggestion FROM rubric_scores WHERE evaluation_id=%s", (evaluation["id"],))
            scores = cur.fetchall()
            evaluation_out = {**evaluation, "scores": scores}

    cur.close(); conn.close()
    return {**attempt, "submission_content": submission["content"] if submission else None, "evaluation": evaluation_out}

@router.post("/attempts/{attempt_id}/submit")
def submit_attempt(attempt_id: int, body: SubmitRequest):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT status, problem_id FROM attempts WHERE id=%s", (attempt_id,))
    attempt = cur.fetchone()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt["status"] in ("Submitted", "Evaluating", "Completed"):
        raise HTTPException(status_code=409, detail="This attempt was already submitted.")  # idempotency guard

    cur.execute(
        "INSERT INTO submissions (attempt_id, format, content) VALUES (%s, %s, %s)",
        (attempt_id, body.format, body.content),
    )
    conn.commit()
    submission_id = cur.lastrowid

    cur.execute("UPDATE attempts SET status='Submitted', submitted_at=NOW() WHERE id=%s", (attempt_id,))
    cur.execute("INSERT INTO evaluations (submission_id, status) VALUES (%s, 'Pending')", (submission_id,))
    conn.commit()
    evaluation_id = cur.lastrowid

    cur.execute("SELECT description FROM problems WHERE id=%s", (attempt["problem_id"],))
    problem_description = cur.fetchone()["description"]

    det_result = DeterministicEvaluator().evaluate(problem_description, body.content)
    _save_scores(cur, evaluation_id, det_result["criteria"])
    conn.commit()

    try:
        cur.execute("UPDATE evaluations SET status='Evaluating' WHERE id=%s", (evaluation_id,))
        conn.commit()
        llm_result = LLMEvaluator().evaluate(problem_description, body.content)
        _save_scores(cur, evaluation_id, llm_result["criteria"])
        cur.execute(
            "UPDATE evaluations SET status='Completed', overall_summary=%s, completed_at=NOW() WHERE id=%s",
            (llm_result["overall_summary"], evaluation_id),
        )
    except Exception as e:
        log.warning(f"LLM evaluation failed for evaluation {evaluation_id}: {e}")
        cur.execute(
            "UPDATE evaluations SET status='Failed', overall_summary=%s WHERE id=%s",
            ("AI evaluation unavailable — showing automated checks only.", evaluation_id),
        )
    cur.execute("UPDATE attempts SET status='Completed' WHERE id=%s", (attempt_id,))
    conn.commit()
    cur.close(); conn.close()
    return get_attempt(attempt_id)

def _save_scores(cur, evaluation_id, criteria):
    for c in criteria:
        cur.execute(
            "INSERT INTO rubric_scores (evaluation_id, criterion, score, evidence, concern, suggestion) VALUES (%s,%s,%s,%s,%s,%s)",
            (evaluation_id, c["criterion"], c["score"], c["evidence"], c.get("concern", ""), c.get("suggestion", "")),
        )
```

**`backend/main.py`** — ties it together, including CORS (needed for §11 deployment):
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import problems, attempts

app = FastAPI(title="LLD Practice Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://<your-frontend>.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems.router)
app.include_router(attempts.router)
```

Run it locally with `uvicorn main:app --reload` and sanity-check every endpoint via the auto-generated Swagger UI at `http://localhost:8000/docs` before touching the frontend at all — this is the fastest way for a fresher to catch backend bugs early.

---

## 6.3 Frontend Implementation in Detail

**Keep dependencies minimal:** `react`, `react-dom`, and nothing else required. No `react-router` (a single `page` state variable is enough for 4 screens), no state management library (`useState`/`useEffect` cover this app's entire needs), no CSS framework (plain CSS is faster to get right for 4 simple screens than learning Tailwind under time pressure, though Tailwind is fine if you already know it).

**`frontend/src/api.js`** — one file, every backend call goes through it:
```javascript
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listProblems: () => request("/problems"),
  getProblem: (id) => request(`/problems/${id}`),
  startAttempt: (problemId, learnerId) =>
    request(`/attempts?problem_id=${problemId}&learner_id=${learnerId}`, { method: "POST" }),
  listAttempts: (learnerId) => request(`/attempts?learner_id=${learnerId}`),
  getAttempt: (id) => request(`/attempts/${id}`),
  submitAttempt: (id, content, format = "text") =>
    request(`/attempts/${id}/submit`, { method: "POST", body: JSON.stringify({ content, format }) }),
};
```

**`frontend/src/App.jsx`** — simple state-based navigation, no router needed:
```jsx
import { useState } from "react";
import ProblemList from "./components/ProblemList";
import ProblemDetail from "./components/ProblemDetail";
import AttemptHistory from "./components/AttemptHistory";

export default function App() {
  const [page, setPage] = useState({ name: "list" });
  const [learnerId] = useState(() => localStorage.getItem("learnerId") || "demo-learner");
  // note: localStorage here is only for the *browser-native* learnerId label,
  // not app data storage — the app's real data all lives server-side in MySQL.

  return (
    <div className="app">
      <nav>
        <button onClick={() => setPage({ name: "list" })}>Problems</button>
        <button onClick={() => setPage({ name: "history" })}>My Attempts</button>
      </nav>

      {page.name === "list" && (
        <ProblemList onSelect={(id) => setPage({ name: "detail", problemId: id })} />
      )}
      {page.name === "detail" && (
        <ProblemDetail
          problemId={page.problemId}
          learnerId={learnerId}
          onSubmitted={(attemptId) => setPage({ name: "history", highlightId: attemptId })}
        />
      )}
      {page.name === "history" && (
        <AttemptHistory learnerId={learnerId} highlightId={page.highlightId} />
      )}
    </div>
  );
}
```

**`frontend/src/components/ProblemList.jsx`:**
```jsx
import { useEffect, useState } from "react";
import { api } from "../api";

export default function ProblemList({ onSelect }) {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listProblems().then(setProblems).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">Couldn't load problems: {error}</p>;

  return (
    <div className="problem-list">
      {problems.map((p) => (
        <div key={p.id} className="problem-card" onClick={() => onSelect(p.id)}>
          <h3>{p.title}</h3>
          <span className="difficulty">{p.difficulty}</span>
        </div>
      ))}
    </div>
  );
}
```

**`frontend/src/components/ProblemDetail.jsx`** — combines the practice + submit step (this is your `AttemptEditor` folded into one screen; split it into a separate file only if it grows past ~100 lines):
```jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import FeedbackView from "./FeedbackView";

export default function ProblemDetail({ problemId, learnerId, onSubmitted }) {
  const [problem, setProblem] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getProblem(problemId).then(setProblem).catch((e) => setError(e.message));
    api.startAttempt(problemId, learnerId).then((a) => setAttemptId(a.id)).catch((e) => setError(e.message));
  }, [problemId]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.submitAttempt(attemptId, content);
      setEvaluating(true);
      pollForResult();
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  function pollForResult() {
    const interval = setInterval(async () => {
      const result = await api.getAttempt(attemptId);
      if (result.evaluation && ["Completed", "Failed"].includes(result.evaluation.status)) {
        clearInterval(interval);
        setAttempt(result);
        setEvaluating(false);
        setSubmitting(false);
      }
    }, 2000);
  }

  if (!problem) return <p>Loading...</p>;

  return (
    <div className="problem-detail">
      <h2>{problem.title}</h2>
      <p>{problem.description}</p>
      {problem.constraints && <p className="constraints">Constraints: {problem.constraints}</p>}

      {!attempt && (
        <>
          <textarea
            rows={16}
            placeholder="Describe your classes, responsibilities, relationships, and reasoning..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
          />
          <button onClick={handleSubmit} disabled={submitting || content.length < 20}>
            {evaluating ? "Evaluating..." : submitting ? "Submitting..." : "Submit"}
          </button>
          {error && <p className="error">{error}</p>}
        </>
      )}

      {attempt && (
        <>
          <FeedbackView evaluation={attempt.evaluation} />
          <button onClick={() => onSubmitted(attempt.id)}>View in History</button>
        </>
      )}
    </div>
  );
}
```

**`frontend/src/components/FeedbackView.jsx`:**
```jsx
export default function FeedbackView({ evaluation }) {
  if (!evaluation) return null;

  return (
    <div className="feedback-view">
      <h3>Feedback</h3>
      <p className={`status status-${evaluation.status.toLowerCase()}`}>{evaluation.status}</p>
      {evaluation.overall_summary && <p className="summary">{evaluation.overall_summary}</p>}

      <div className="rubric-scores">
        {evaluation.scores.map((s, i) => (
          <div key={i} className="rubric-card">
            <div className="rubric-header">
              <strong>{s.criterion}</strong>
              <span className="score">{s.score}/5</span>
            </div>
            <p><em>Evidence:</em> {s.evidence}</p>
            {s.concern && <p><em>Concern:</em> {s.concern}</p>}
            {s.suggestion && <p><em>Suggestion:</em> {s.suggestion}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`frontend/src/components/AttemptHistory.jsx`:**
```jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import FeedbackView from "./FeedbackView";

export default function AttemptHistory({ learnerId, highlightId }) {
  const [attempts, setAttempts] = useState([]);
  const [expandedId, setExpandedId] = useState(highlightId || null);

  useEffect(() => {
    api.listAttempts(learnerId).then(setAttempts);
  }, [learnerId]);

  return (
    <div className="attempt-history">
      {attempts.map((a) => (
        <div key={a.id} className={`attempt-row ${a.id === expandedId ? "expanded" : ""}`}>
          <div onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
            <span>Attempt #{a.id}</span>
            <span className={`status status-${a.status.toLowerCase()}`}>{a.status}</span>
          </div>
          {expandedId === a.id && a.evaluation && <FeedbackView evaluation={a.evaluation} />}
        </div>
      ))}
    </div>
  );
}
```

**`frontend/.env.example`:**
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

**A few things worth doing on purpose:**
- The 2-second poll loop in `ProblemDetail.jsx` is your visible answer to the "don't block on slow AI evaluation" requirement — point to it explicitly in `DESIGN.md`.
- Keep every component a plain function reading props + local state; you don't need `useReducer`, context, or global state for an app this size — reaching for it would just be time spent impressing no one.
- Test the "long submission" and "empty submission" cases manually in the UI before Hour 12–13's final pass — the backend rejects `content.length < 20` (Pydantic `min_length`), so confirm the frontend surfaces that error message instead of failing silently.

---

## 6.4 Minimal Testing Plan — Backend Unit Test + Frontend E2E Test

The assignment only asks for "tests for important behaviour and a few failure/edge cases" — not a full test suite. One well-chosen test on each side is enough to satisfy that line and to demonstrate you know *where* the risk in this system actually is. Add these on top of (not instead of) the 4–5 backend tests already listed in §6 Hours 7–9; this section is about which single test matters most on each side if your time is very tight.

**Backend — minimal unit test (pytest, no live LLM call):**
The single most valuable backend unit test is on `DeterministicEvaluator`, because it's the one piece of evaluation logic that runs every time, never depends on the network, and directly implements a graded requirement (deterministic vs. AI-driven evaluation). The test should construct a submission that is deliberately missing one of the required sections (e.g., no mention of "responsibilities") and assert that the resulting criteria list scores that check as 0 and includes a non-empty concern/suggestion for it — while a second, well-formed submission scores that same check as 5. This proves the structural-check logic actually discriminates between a weak and a strong submission, which is the whole point of having it. Keep the LLM evaluator out of this test entirely (mock it or don't call it) so the test stays fast and doesn't depend on API keys or network access — that's what makes it "unit," not "integration."

**Frontend — minimal E2E test (Playwright or Cypress, against a running backend):**
The single most valuable E2E test is the full practice loop in one pass: load the problem list, click into a problem, type a submission into the textarea, click Submit, wait for the feedback view to render (asserting on the polling/"Evaluating..." state disappearing and rubric cards appearing), then navigate to Attempt History and assert the just-completed attempt appears there with a "Completed" status. This one test exercises every layer at once — API wiring, the poll loop, and the history view — so a single passing run is strong evidence the product actually works end-to-end, which matters more to an interviewer than several narrow, isolated frontend tests would. Run it against your local dev servers (or the deployed URLs) rather than mocking the API, since the point of an E2E test is to catch real integration breakage, not to re-test logic your unit tests already cover.

If time allows exactly one more test beyond these two, add a backend test for the `/submit` idempotency guard (§6.2) — it's a one-line assertion (second submit on the same attempt returns 409) and directly demonstrates the "avoid duplicate processing" requirement from the assignment doc.

---

## 7. Handling "Evaluation Takes Time or Fails" Without Overbuilding

The doc explicitly warns against turning this into a distributed-systems project. Do this simple version:
1. `POST /submit` immediately saves the Submission and creates an `Evaluation` row with status `Pending` — so nothing is lost even if evaluation crashes.
2. Run evaluation **synchronously in the same request** for the MVP (deterministic checks are instant; one LLM call is typically 2–5 seconds — acceptable to just await it). This avoids building a queue/worker system.
3. In your Design Note, **describe** (don't build) the next step: "at higher scale, this call would be pushed to a background worker/queue with the same Pending → Evaluating → Completed/Failed states, and the frontend would keep polling — the state machine doesn't need to change, only where it executes." This single paragraph earns you HLD-judgement marks without any extra code.
4. Wrap the LLM call in try/except → on failure, set status `Failed`, save whatever the DeterministicEvaluator already produced, and show the learner a clear "AI feedback unavailable, here's what we could check automatically" message. This is more impressive than a crash.

---

## 8. Common Pitfalls (Explicitly Called Out by the Assignment — Avoid These)

- ❌ Building microservices, Kubernetes, or multi-region anything — this is a monolith exercise.
- ❌ Spending most of your time on UI polish while the domain/evaluation logic is thin.
- ❌ Adding design patterns (Factory, Observer, etc.) just to show you know them — only add the `Evaluator` interface (Strategy pattern) because it's actually needed.
- ❌ A prompt that just asks the LLM "Is this a good design, score 1–100?" — always force the structured rubric shape.
- ❌ Building a diagram editor or code sandbox "to be safe" — text submission is explicitly acceptable; justify it instead of avoiding the decision.
- ❌ Skipping the Research Note/AI_USAGE.md because they "aren't code" — they're graded deliverables worth real percentage points.

---

## 9. Optional Stretch (Only If Everything Above Is Done With Time to Spare)

Once the core MVP checklist (§13) is fully green, pick **one** stretch item, in this priority order:

1. **Add "code" as a second submission format** — do this one first if you attempt any stretch, because it's the single strongest thing you can show an interviewer: it's literally "Change Test A" from the assignment doc, answered with working code instead of just a paragraph. Full plan in §9.1 below.
2. A second, purely rule-based evaluator (e.g., regex/keyword checks for common LLD mistakes like "no interfaces mentioned") to visibly demonstrate the multi-evaluator extensibility point.
3. A simple score trend view in Attempt History (e.g., "your average extensibility score is improving") — directly demonstrates the "practice loop, not one-time solving" goal.

Do **not** attempt more than one, and do not start any of them until the core MVP checklist is fully green — a half-finished stretch feature scores worse than no stretch feature.

---

## 9.1 Extension Plan — Adding "Code" as a Second Submission Format

This is the concrete, file-by-file plan for extending the **existing** repo (backend/frontend/db from §10) to support code submissions alongside text — without touching the core practice loop. Treat it as its own mini-milestone, roughly 3–4 hours, and do it on a separate git branch (`feature/code-submission`) so your working MVP on `main` stays safe.

**Why this is low-risk:** your schema and domain design already anticipated this. `submissions.format` exists in §4's schema and `Submission` already carries a `format` field in §3's domain design — this extension is additive, not a redesign. That's the payoff of the original design decision; point this out explicitly in your `DESIGN.md` update.

**Step 1 — DB (5–10 min, no schema change needed):**
- `submissions.format` already accepts any string — just start writing `"code"` instead of `"text"`.
- Optional: add one nullable column `language VARCHAR(20)` to `submissions` (e.g., `python`, `javascript`) if you want language-aware checks in Step 2. Add via a small migration file `backend/db/migrations/002_add_language.sql` rather than editing `schema.sql` in place, so the change is traceable.

**Step 2 — Backend, evaluators (`backend/evaluators/`) (1.5–2 hrs):**
- Add `deterministic_code.py` implementing the same `Evaluator` interface from §3 — this is the whole point of that abstraction:
  - Structural checks only, no execution/sandboxing (stay inside the assignment's scope boundary): does the content contain at least one `class`/`def` (Python) or `class`/`function` (JS) keyword, is it non-trivial length, does it roughly match the declared `language`.
  - For Python specifically, you can safely go one step further with `ast.parse(content)` wrapped in try/except — this validates *syntax* without *executing* anything, so there's no sandboxing risk, and it's a genuinely nice "deterministic vs LLM" split to show off.
- Extend `llm.py`'s prompt: keep the same rubric shape (`criterion → score → evidence → concern → suggestion → confidence`) but branch the prompt text based on `submission.format` — for code, ask it to evaluate the code's structure/responsibilities/coupling directly rather than a text description of them. Reuse the same rubric criteria list from §6 Hours 13–15 so scores stay comparable across formats.
- In `routes/attempts.py`, the `/submit` handler already accepts arbitrary `content` — just add `format` (and optional `language`) to the request body, and route to `deterministic_code.py` vs `deterministic.py` based on it. This is a 3–4 line branch, not new endpoints.

**Step 3 — Frontend (`frontend/src/`) (1–1.5 hrs):**
- `AttemptEditor.jsx`: add a simple toggle/segmented control at the top — "Text design" / "Code" — and a language dropdown (Python/JavaScript) that only shows when "Code" is selected.
- Swap the plain `<textarea>` for a monospace-font `<textarea>` when in code mode (don't pull in a full editor library like Monaco/CodeMirror unless you have real time to spare — a styled textarea is enough evidence for this MVP and keeps bundle size/setup risk low).
- `FeedbackView.jsx` and `AttemptHistory.jsx`: just render a small "Format: Code (Python)" / "Format: Text" badge using the `format`/`language` fields you're already getting back from the API — no new API calls needed since `GET /attempts/{id}` already returns the full submission.

**Step 4 — Tests (20–30 min):**
- Add 2 tests to `backend/tests/test_flow.py`: one asserting a code submission with valid Python syntax gets structural checks passed, one asserting invalid/unparseable code is flagged by `deterministic_code.py` with a clear concern — mirrors the pattern you already used for the text evaluator.

**Step 5 — Docs (10–15 min):**
- Update `DESIGN.md`: replace the "Change Test A" answer with "implemented, not just designed" and link to the evaluator files as evidence.
- Update `README.md`: mention the format toggle in the usage walkthrough.
- Merge `feature/code-submission` into `main` only after confirming the original text flow still works unchanged — that's your proof the extension was genuinely additive.

**Do not**, even in this stretch: add real code execution/compilation, a sandboxed runner, or multi-language linters — that crosses back into the "distributed-systems/over-engineering" territory the assignment explicitly tells you to avoid. Syntax-level structural checks + LLM judgement is the right ceiling here.

---

## 10. Repository Structure

Use a single monorepo — one repo, two top-level folders. Do not split backend/frontend into separate repos; it only adds overhead for a 2-day project and makes the recruiter's job of reviewing harder.

```
lld-practice-platform/
├── README.md                  <- run instructions, live demo link, screenshots
├── RESEARCH.md
├── DESIGN.md
├── AI_USAGE.md
├── .gitignore                 <- node_modules/, __pycache__/, .env, venv/, *.db
├── docs/
│   └── domain-diagram.png     <- exported image of your §3 class diagram (optional but nice)
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example           <- DB_URL, LLM_API_KEY placeholders (never commit the real .env)
│   ├── main.py                <- FastAPI app entrypoint
│   ├── models/                <- Problem, Attempt, Submission, Evaluation, RubricCriterion
│   ├── evaluators/
│   │   ├── base.py            <- Evaluator interface
│   │   ├── deterministic.py
│   │   └── llm.py
│   ├── routes/                <- problems.py, attempts.py, evaluations.py
│   ├── db/
│   │   ├── schema.sql         <- from §4
│   │   └── seed.sql           <- 3 problems
│   └── tests/
│       └── test_flow.py       <- your 4–5 pytest cases
│
└── frontend/
    ├── package.json
    ├── .env.example            <- REACT_APP_API_BASE_URL placeholder
    ├── public/
    └── src/
        ├── api.js               <- one file wrapping all fetch calls
        ├── components/
        │   ├── ProblemList.jsx
        │   ├── ProblemDetail.jsx
        │   ├── AttemptEditor.jsx
        │   ├── FeedbackView.jsx
        │   └── AttemptHistory.jsx
        └── App.jsx
```

Keep it flat and shallow — a fresher over-nesting folders (`src/features/attempt/components/editor/...`) wastes time and reads as over-engineering for a 3-page app.

**Commit hygiene:** commit in small logical chunks as you hit each milestone in §6 (e.g., "backend: domain models + schema", "backend: deterministic evaluator", "backend: LLM evaluator + failure handling", "frontend: problem list + detail", "frontend: submit + feedback flow", "tests", "docs"). A clean, incremental commit history is itself a small signal of engineering judgement — don't do one giant "final code" commit.

---

## 11. Deploying on Free Platforms

You need three things deployed: **MySQL DB, backend API, frontend**. Pick one option per row — don't overthink this, it only needs to survive the recruiter clicking around for a few minutes.

| Component | Recommended free option | Notes |
|---|---|---|
| MySQL | **Railway** (free trial credits) or **Aiven for MySQL** (free tier) or **Clever Cloud** (free MySQL dev plan) | Get the connection string, put it in the backend's env vars. Avoid PlanetScale for this — it dropped its free tier. |
| Backend (FastAPI) | **Render** (free web service) or **Railway** | Connect your GitHub repo, set the build command (`pip install -r requirements.txt`) and start command (`uvicorn main:app --host 0.0.0.0 --port $PORT`), add `DB_URL` and `LLM_API_KEY` as environment variables in the dashboard. |
| Frontend (React) | **Vercel** or **Netlify** | Connect the repo, set root directory to `frontend/`, build command `npm run build`, output folder `build/`. Set `REACT_APP_API_BASE_URL` env var to your deployed backend URL. |

**Deployment steps, in order:**
1. Deploy the MySQL instance first; run `schema.sql` then `seed.sql` against it (most free MySQL dashboards have a query console, or connect locally with a client using the given host/credentials).
2. Deploy the backend, pointing it at that DB via env var. Confirm `https://<your-backend>.onrender.com/docs` loads and `/problems` returns your 3 seeded problems.
3. Deploy the frontend, pointing it at the deployed backend URL. Confirm the full loop works on the live URL, not just localhost.
4. **Enable CORS** on the backend for your frontend's deployed domain (FastAPI: `CORSMiddleware`, `allow_origins=["https://<your-frontend>.vercel.app"]`) — this is the single most common "works locally, breaks live" bug.
5. Free-tier backends (Render especially) sleep after inactivity and take 20–30s to wake on the first request — mention this in your README so the recruiter isn't confused by a slow first load ("first request may take ~30s to wake the free-tier server").

Put the **live URL** at the very top of your `README.md`, above the run instructions, so the recruiter can click it immediately without setting anything up locally.

---

## 12. Packaging the Zip for the Recruiter

The zip is a backup/offline copy — GitHub + live link are what the recruiter will actually use first, but the assignment explicitly asks for a submission package, so prepare it cleanly.

1. From a **fresh clone** of your GitHub repo (not your working folder — this avoids accidentally including local junk like `node_modules`, `venv`, or your real `.env`), confirm `.gitignore` already excludes: `node_modules/`, `__pycache__/`, `venv/` or `.venv/`, `.env`, `*.db`, `build/`, `dist/`.
2. Zip the whole repo folder:
   ```bash
   cd path/to/parent-folder
   zip -r lld-practice-platform-submission.zip lld-practice-platform -x "*/node_modules/*" -x "*/.git/*" -x "*/venv/*" -x "*/__pycache__/*"
   ```
   (or on Windows: right-click the cloned folder → Send to → Compressed (zipped) folder, after manually confirming `node_modules`/`venv` aren't present.)
3. Before zipping, double check the zip will contain: `README.md` (with the live URL at the top), `RESEARCH.md`, `DESIGN.md`, `AI_USAGE.md`, `backend/`, `frontend/`, `.env.example` files (placeholders only, never real keys).
4. Sanity-check the zip size — it should be a few MB at most (source code + docs only). If it's tens/hundreds of MB, you've accidentally included `node_modules` or a virtual environment; redo step 2.
5. Name the file clearly, e.g. `Abdullah_Raghib_LLD_Practice_Platform_Submission.zip`, so it's identifiable once it lands in a downloads folder full of other candidates' zips.

---

## 13. Final Submission Checklist

- [ ] 3 seeded LLD problems with clear requirements
- [ ] End-to-end flow works: start attempt → write/submit text design → see feedback → view in history
- [ ] `Evaluator` interface with at least Deterministic + LLM implementations
- [ ] Rubric-shaped feedback (criterion/score/evidence/concern/suggestion) stored and displayed
- [ ] Evaluation state machine (Pending/Evaluating/Completed/Failed) implemented and handles LLM failure gracefully
- [ ] Duplicate-submit protection on an already-submitted attempt
- [ ] 4–5 backend tests covering core flow + at least 2 edge/failure cases
- [ ] `README.md` with clear run instructions **and the live deployed URL at the top**
- [ ] `RESEARCH.md` (1–2 pages)
- [ ] `DESIGN.md` (MVP, flow, classes/responsibilities, evaluation approach, trade-offs, both "change tests" answered)
- [ ] `AI_USAGE.md` with 3–5 specific, honest examples
- [ ] Repo structured per §10, committed incrementally, pushed to GitHub
- [ ] MySQL DB, backend, and frontend all deployed on free platforms and verified working end-to-end on the live URL
- [ ] CORS configured so the live frontend can actually talk to the live backend
- [ ] Clean zip built from a fresh clone, correctly named, no `node_modules`/`venv`/real `.env` inside
- [ ] Google Form submitted with GitHub link, live URL, and zip attached/linked as required
- [ ] *(Optional, only if time remains)* Code submission format added per §9.1, on `main` with text flow still working, docs updated

If every box above is checked, you have covered all seven graded deliverable rows in the assignment doc and directly addressed all five "Main Design Questions" it asks — that combination is what "simple but strong quality" looks like to this evaluator.
