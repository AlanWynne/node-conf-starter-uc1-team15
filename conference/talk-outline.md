# Talk Outline: "The Kiro Engineer — AI-Partnered Development in Practice"

**Duration:** 30–40 minutes (including live demo)
**Audience:** IT engineers, full-stack developers, engineering leads
**Format:** Presentation + live coding demo

---

## Part 1: Opening (5 min)

### The Shift in How We Build Software

- The role of an engineer is evolving: from writing every line to *directing and collaborating* with AI
- "Kiro Engineer" isn't a job title — it's a way of working
- What it means: you bring judgment, architecture, and intent; the AI brings speed, breadth, and consistency
- The goal isn't to replace thinking — it's to eliminate the mechanical parts

### What This Talk Covers

- How Kiro differs from copilot-style autocomplete
- A live demo: building a real feature from zero in a production-grade starter
- Patterns for maintaining quality when AI writes your code

---

## Part 2: What Makes a Kiro Engineer (8 min)

### The Human-AI Boundary

- **You own:** Architecture decisions, security boundaries, UX intent, trade-off analysis
- **AI handles:** Boilerplate, wiring, test scaffolding, repetitive refactors
- **You collaborate on:** API design, data modeling, error handling strategy

### Kiro's Core Concepts

1. **Spec-Driven Development** — Requirements → Design → Tasks pipeline
   - Not just "write me code" — structured feature decomposition
   - Agent works against concrete tasks, not vague wishes

2. **Steering Files** — Persistent context for the AI
   - Team conventions, project standards, domain knowledge
   - Like onboarding docs that the AI actually reads every time

3. **Agent Hooks** — Automated behaviors triggered by events
   - File saved → lint runs → agent fixes errors
   - Message sent → chat logged automatically
   - Task completed → tests executed

4. **Autonomy Modes** — Choose your trust level
   - Autopilot: agent works end-to-end, you review at the end
   - Supervised: approve each change as it happens

### The Key Skill: Directing, Not Dictating

- Knowing when to be specific vs. when to let the agent explore
- Writing good specs is more valuable than writing good prompts
- Reviewing AI output is a core engineering skill now

---

## Part 3: Live Demo (15–20 min)

### Demo Project: node-conf-starter

**Stack:** React 18 + Vite | Express + Node.js | SQLite + Prisma | Tailwind CSS | Vitest + Playwright

> A full-stack monorepo that runs in two commands. The audience can clone it and follow along.

### Demo Sequence

See [demo-script.md](./demo-script.md) for the complete step-by-step script.

**Demo 1: Hooks in Action** (3 min)
- Show the chat logging hook — every message is automatically logged
- Explain the hook schema and event types
- Point: *the AI follows team processes automatically*

**Demo 2: Adding a Feature with Specs** (10 min)
- Create a spec for "Add a Todo List feature"
- Walk through requirements → design → tasks
- Let the agent implement in autopilot
- Show the resulting code: Prisma model, API routes, React component
- Run tests to prove it works

**Demo 3: Steering for Team Standards** (5 min)
- Create a steering file with API conventions
- Ask the agent to add another endpoint
- Show how it follows the conventions without being told each time
- Point: *this scales across a team — write the standard once, enforce it always*

---

## Part 4: Patterns and Anti-Patterns (5 min)

### What Works

- **Start with structure:** Specs before code. The 2 minutes writing requirements saves 20 minutes of rework.
- **Use steering for repetition:** If you've corrected the agent twice, write a steering file.
- **Trust but verify:** Autopilot for boilerplate, supervised for security-sensitive code.
- **Iterate on specs, not prompts:** Refining your requirements doc is more productive than rephrasing the same question.

### What Doesn't Work

- **Vague specs:** "Make it good" produces mediocre code. Be specific about behavior.
- **Over-trusting on novel architecture:** AI excels at well-trodden paths, not inventing new patterns.
- **Skipping review:** The code compiles and tests pass — but does it match your intent?
- **Fighting the agent:** If it's going wrong, step back and clarify rather than patching.

---

## Part 5: Closing (3 min)

### The Kiro Engineer Mindset

- You're not less of an engineer because AI writes the code
- You're *more* of an engineer because you focus on the hard parts
- The craft shifts from typing to thinking — and that's the valuable part

### Call to Action

- Clone the starter: `github.com/thandog/node-conf-starter`
- Try one feature with specs end-to-end
- Write your first steering file for your team's conventions
- Experiment with hooks for your workflow

### Q&A

---

## Appendix: Backup Talking Points

If questions come up about:

- **Security:** Kiro won't execute destructive operations without confirmation. Steering files can encode security boundaries.
- **Team adoption:** Start with one engineer, one feature. Share steering files via the repo.
- **Cost/speed:** Spec-driven approach front-loads thinking but dramatically reduces iteration cycles.
- **Testing:** Agent writes tests when asked, runs them for verification. E2E still needs human judgment for scenarios.
- **MCP Servers:** Extensibility model for connecting to external tools (databases, APIs, documentation).
