# Kiro Engineer Guide — Conference Exercise

This guide walks you through the three demo exercises from the conference talk. Each one showcases a core Kiro capability. Do them in order — they build on each other.

---

## Before You Begin

1. Open this project in Kiro
2. Run `npm install` at the root
3. Start both services: `npm run dev`
4. Confirm the app is running at http://localhost:5173 and backend is healthy at http://localhost:3001/health

---

## Exercise 1: Hooks — Automated Agent Behaviors (5 min)

**Goal:** Understand how hooks trigger agent actions on IDE events.

### What's Already Here

Look at `.kiro/hooks/log-chat-messages.kiro.hook`. This hook fires on every `promptSubmit` event and tells the agent to log the conversation to `Chat-Log/chat-session.log`.

### Try It

1. Send any message in Kiro chat (e.g., "Hello from the conference!")
2. Open `Chat-Log/chat-session.log` — your message and the response are timestamped there
3. Browse the other hooks in `.kiro/hooks/` to see enable/disable/rename patterns

### Key Takeaway

Hooks let you encode repeatable workflows that run automatically. No manual steps, no forgetting. The pattern scales to: lint on save, test after task completion, security review before file writes.

---

## Exercise 2: Spec-Driven Development — Payment Dispute Triage (15 min)

**Goal:** Use the requirements → design → tasks workflow to build a full-stack feature.

This repo already contains a complete, working example of the spec-driven workflow. The Payment Dispute Triage feature was built entirely through Kiro's requirements → design → tasks cycle. Use it as a reference, or build a new feature alongside it.

### Explore the Existing Spec

Open `.kiro/specs/payment-dispute-triage/` and review the three spec artefacts in order:

1. **`requirements.md`** — 7 requirements and 48 acceptance criteria written in structured natural language. Note how each criterion is traceable to a specific behaviour.

2. **`design.md`** — Technical design covering architecture, API contract, triage rules engine, component breakdown, and 12 formally defined correctness properties for property-based testing.

3. **`tasks.md`** — 14 implementation tasks organised into dependency waves. All tasks are complete. Notice how each task references specific requirement IDs for traceability.

### Try It Yourself — Add a New Feature

1. **Switch to Spec mode** in Kiro (look for the session type toggle)

2. **Create a new spec** — for example, "Dispute Statistics":

```
## Requirements

1. The system shall provide a summary dashboard showing:
   - Total disputes submitted
   - Disputes by recommended action (counts for each action type)
   - Disputes by status (open, resolved, escalated, reopened)
2. The dashboard shall update when new disputes are submitted
3. The API shall expose GET /api/disputes/stats returning the summary data
4. The UI shall display the stats as a card grid above the dispute list
```

3. **Review the generated design** — the agent will propose:
   - An API route shape
   - A React component for the stats cards
   - A database query strategy

   Push back if something doesn't match your intent. This is where engineering judgment lives.

4. **Approve and let it implement** — switch to Autopilot and watch it:
   - Add the stats endpoint to `server/src/routes/disputes.ts`
   - Build the stats component in `client/src/components/`
   - Write tests
   - Wire it into `App.tsx`

5. **Verify** — refresh the browser and confirm the stats update when you submit a new dispute

### Key Takeaway

You didn't write implementation code, but you directed every aspect of what was built. The spec is the artifact — it captures intent, not just output. The existing Payment Dispute Triage spec in this repo shows what a complete, production-quality spec looks like.

---

## Exercise 3: Steering — Team Conventions That Stick (10 min)

**Goal:** See how steering files enforce standards without repeating yourself.

### Steps

1. **Look at the existing steering file:** `.kiro/steering/project-conventions.md`
   - This is already loaded into every Kiro session automatically

2. **Create an API conventions steering file:**

   Create `.kiro/steering/api-conventions.md`:

```markdown
# API Conventions

## Response Format
All API endpoints must return responses in this envelope format:
{"data": <payload>, "meta": {"timestamp": "<ISO string>"}}

## Error Format
Errors must return:
{"error": {"code": "<ERROR_CODE>", "message": "<human readable>"}}

## Validation
- Validate request body before processing
- Return 400 with descriptive error for invalid input
```

3. **Test it** — in Vibe mode, ask:
   > "Add a GET /api/todos/stats endpoint that returns the total count, completed count, and pending count"

4. **Observe** — the agent will use the envelope format (`{data, meta}`) without you telling it to, because the steering file is active

### Key Takeaway

Steering files compound. Each one you add makes the agent more aligned with your team's standards. Write the convention once, enforce it on every interaction.

---

## What You've Learned

| Concept | What It Does | When to Use |
|---------|-------------|-------------|
| **Hooks** | Automate agent actions on IDE events | Repetitive workflows: logging, linting, testing |
| **Specs** | Structured requirements → design → implementation | Any non-trivial feature |
| **Steering** | Persistent instructions the agent always follows | Team conventions, project standards, domain rules |

---

## Going Further

- Try **Supervised mode** for the Todo feature — approve each change individually
- Add a steering file for testing conventions (e.g., "always mock external calls")
- Create a hook that runs `npm test` after every spec task completes (`postTaskExecution`)
- Build another feature using specs: user authentication, search, pagination

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Spec mode not visible | Check the session type toggle at the top of the Kiro chat panel |
| Prisma migration fails | Ensure `server/.env` exists with `DATABASE_URL=file:./dev.db` |
| Steering file not picked up | Verify it's in `.kiro/steering/` and has a `.md` extension |
| Hook not firing | Check the Agent Hooks section in the sidebar explorer |
