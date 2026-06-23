# Demo Script: Live Kiro Engineering

**Project:** node-conf-starter
**Pre-requisites:** Project cloned, `npm install` done, both servers running (`npm run dev`)
**Browser:** Open to http://localhost:5173 showing the starter app

---

## Pre-Demo Setup Checklist

- [ ] Fresh git branch: `git checkout -b conference-demo`
- [ ] Both servers running (backend :3001, frontend :5173)
- [ ] Browser open showing the starter app UI
- [ ] Kiro IDE open with the project
- [ ] Terminal visible but not blocking the editor
- [ ] Font size bumped for projector readability

---

## Demo 1: Hooks — The AI That Follows Process (3 min)

### Talking Point
> "The first thing a Kiro Engineer sets up is automated behaviors. These are hooks — they fire on IDE events and tell the agent what to do. Let me show you one that's already running."

### Steps

1. **Show the hook file**
   - Open `.kiro/hooks/log-chat-messages.kiro.hook`
   - Walk through the JSON:
     ```json
     {
       "when": { "type": "promptSubmit" },
       "then": {
         "type": "askAgent",
         "prompt": "Append the user's message to chat-log/chat-session.log..."
       }
     }
     ```
   - Explain: "Every time I send a message, the agent logs it. No extra effort from me."

2. **Send a message in chat**
   - Type: "Hello from the conference!"
   - Wait for response

3. **Show the log file**
   - Open `chat-log/chat-session.log`
   - Point out the timestamped entry that just appeared
   - "This is a trivial example, but the pattern scales: lint on save, test after task completion, security review before writes."

4. **Show the hook explorer** (brief)
   - Point to the Agent Hooks section in the sidebar
   - "You can create these visually or let the agent build them for you."

### Transition
> "So hooks handle the automated stuff. But the real power is in structured feature development. Let me show you how a Kiro Engineer adds a feature."

---

## Demo 2: Spec-Driven Feature — Todo List (10 min)

### Talking Point
> "I'm not going to just ask 'add a todo list.' I'm going to define what I want, let the agent design it, review the design, and then let it build. This is spec-driven development."

### Step 1: Create the Spec (2 min)

- Switch to **Spec mode** in Kiro
- Create a new spec: "Todo List Feature"
- Enter requirements (type or paste):

```
## Requirements

1. Users can create todo items with a title and optional description
2. Users can mark todos as complete/incomplete (toggle)
3. Users can delete todos
4. Todos persist in the SQLite database via Prisma
5. The UI shows a list of todos with add/complete/delete actions
6. The API follows RESTful conventions: GET /api/todos, POST /api/todos, PATCH /api/todos/:id, DELETE /api/todos/:id
7. Include loading and error states in the UI
```

- "Notice I'm being specific about the API shape and the behaviors I want. This is where engineering judgment lives — in the requirements, not the implementation."

### Step 2: Review the Design (2 min)

- Let the agent generate the design document
- Walk through what it proposes:
  - Prisma model addition
  - API route structure
  - React component breakdown
  - Error handling approach
- "I can push back here. Maybe I don't want a separate TodoItem component, or maybe I want optimistic updates. The design phase is where you negotiate."
- Approve the design (or adjust one thing to show the iteration)

### Step 3: Implementation in Autopilot (4 min)

- Start task execution
- Narrate as the agent works:
  - "It's updating the Prisma schema... adding a Todo model"
  - "Now it's creating the API routes... notice it used the RESTful pattern I specified"
  - "Building the React component... Tailwind styling to match the existing UI"
  - "Running the tests to verify..."

- **Key moments to highlight:**
  - When it runs `prisma migrate dev` automatically
  - When it creates the route file with proper error handling
  - When it matches the existing code style (Express patterns, Tailwind classes)

### Step 4: See It Working (2 min)

- Switch to the browser
- Refresh the page — show the new Todo UI
- Add a few todos, check one off, delete one
- "From requirements to working feature in under 10 minutes. And I didn't write a single line of implementation code — but I *directed* every aspect of what was built."

### Transition
> "That works great for a solo engineer. But what about teams? How do you make sure the agent follows your team's conventions? That's where steering comes in."

---

## Demo 3: Steering — Persistent Team Standards (5 min)

### Talking Point
> "Steering files are like team conventions docs that the AI actually reads. Every time. Without being asked."

### Step 1: Create a Steering File (1 min)

- Create `.kiro/steering/api-conventions.md`:

```markdown
# API Conventions

## Response Format
All API endpoints must return responses in this envelope format:
```json
{ "data": <payload>, "meta": { "timestamp": "<ISO string>" } }
```

## Error Format
Errors must return:
```json
{ "error": { "code": "<ERROR_CODE>", "message": "<human readable>" } }
```

## Route Organization
- One file per resource in `server/src/routes/`
- Router exported as `<resource>Router`
- All routes prefixed with `/api/<resource>`

## Validation
- Validate request body before processing
- Return 400 with descriptive error for invalid input
```

- "This lives in the repo. Every engineer on the team gets it. Every Kiro session reads it."

### Step 2: Ask for a New Endpoint (2 min)

- In Vibe mode, ask: "Add a GET /api/todos/stats endpoint that returns the total count, completed count, and pending count"
- Watch the agent implement it
- **Highlight:** It uses the envelope response format (`{ data, meta }`) without being told — because of the steering file

### Step 3: Show the Contrast (1 min)

- "If I hadn't created that steering file, the agent would have returned a flat JSON object. Now it follows our team standard automatically."
- "Steering files compound. Add one for testing patterns, one for component structure, one for database conventions. Over time, the agent becomes increasingly aligned with your team."

### Closing the Demo
> "Three features of Kiro, three different parts of the engineer's workflow: hooks for automation, specs for structured development, steering for team alignment. Together, they make the 'Kiro Engineer' a real, productive way of working."

---

## Backup Demo: Error Recovery (if time allows)

### Talking Point
> "What happens when the agent gets it wrong? Let me show you the feedback loop."

### Steps

1. Ask for something intentionally under-specified: "Add user authentication"
2. Show how the agent asks clarifying questions (or show supervised mode catching an issue)
3. Provide clarification and show it course-correct
4. "The key skill: recognizing when to clarify vs. when to let it explore"

---

## Recovery Plans

**If the dev server crashes:**
- Have a pre-built version ready in a separate branch: `git stash && git checkout demo-complete`
- "Let me switch to the finished version to keep us moving"

**If the spec takes too long:**
- Have a pre-written spec ready to paste in
- "In the interest of time, let me use one I prepared earlier"

**If the audience wants to see the code:**
- Open the generated files and walk through them
- Highlight how the style matches existing code
- Show the test file if one was generated

**If someone asks about hallucinations/bugs:**
- "Great question. The verification step is key — Kiro runs the build and tests. If it breaks, it fixes it before presenting the result. But the engineer's review is still the final gate."

---

## Key Messages to Reinforce Throughout

1. **The engineer is in control** — you set the direction, boundaries, and quality bar
2. **Structure beats prompting** — specs and steering produce better results than clever one-liners
3. **It compounds** — each steering file and hook makes the next session more productive
4. **It's collaborative, not magical** — you'll still review, push back, and iterate
5. **This is engineering** — the medium changed (from typing to directing), the discipline didn't
