# Intelligent Triage of Customer Payment Disputes

## Problem Statement

Bank customers expect payment issues to be resolved quickly and
accurately, whether the problem relates to a duplicate debit, failed
transfer, missing payment, or card transaction dispute. In many cases,
frontline staff must manually gather information from multiple sources,
interpret the issue, and decide what action should be taken next. This
can slow down resolution, create inconsistent handling, and frustrate
both customers and support teams.

Your challenge is to design and build a lightweight internal prototype
that helps a banking operations user triage and route customer payment
disputes more effectively. The user should be able to capture a dispute,
record the payment type and issue category, and receive a recommended
next action based on simple business rules such as transaction status,
amount, age of the dispute, and issue type.

The prototype should answer one practical question: given this payment
dispute, what is the most appropriate next step right now?

## Why This Problem Matters

In a banking environment, payment disputes are a high-volume operational
reality with direct impact on customer trust, service costs, and
regulatory handling standards. Improving the triage process can reduce
turnaround times, improve consistency of decisions, and help operations
teams focus their effort where it is most needed.

## What Teams Should Build

Teams should produce a working prototype that supports a single, focused
journey: an operations user captures a customer payment dispute and
receives a recommended route or action. The prototype should clearly
show why the case was classified in a certain way and whether it should
be resolved immediately, investigated further, escalated, or referred to
another team.

## Constraints

- Use mock dispute, customer, and transaction data only.

- Use a simple rules-based decision approach rather than AI or machine
  learning.

- Limit the solution to a small set of payment types, such as card
  payments, EFTs, or internal transfers.

- Represent case priority and age using a few simple indicators only.

- Avoid real integrations with core banking, card processing, case
  management, or customer platforms.

## Expected Outcome

The best solutions will demonstrate a clear understanding of a realistic
banking operations problem, a practical and intuitive user flow, and a
sensible way to guide dispute handling using transparent rules. Teams
should focus on clarity, usability, and a well-scoped working prototype
rather than trying to solve the full end-to-end disputes process.

# Day 1 Lab

Specification generation is the most critical activity of Day 1.

Teams choose their own collaboration tool for commenting. Options
include:

- **SharePoint:** Upload markdown files and use inline comments.

- **Microsoft Teams:** Upload markdown files and use inline comments.

- **Microsoft 365:** Paste specifications into Word or OneNote and use
  track changes or comments.

- **Confluence:** Create a team space and comment on pages.

- **GitHub Pull Request:** Open a pull request with the specification
  pack and use inline review comments.

The tool does not matter. What matters is that every team member reads
the full spec pack and comments are captured and resolved before Day 2.

Teams may continue refining specifications after Day 1 sessions end.

# Pre-Event Preparation

## All Participants

- Read the use case brief published on 19 June 2026.

- Know your team assignment and role.

- Bring a laptop.

- Attend the AI SDLC introduction and AWS Kiro explanation by JC
  Pretorius.

## Developers and Kiro Users

- Kiro IDE installed or Kiro CLI installed.

- Kiro authenticated through the IDE or terminal.

- Node.js 20+ installed.

- npm installed.

- Git configured.

- Starter repository cloned and npm install completed successfully.

- Run npm run dev and confirm that the health check works.

- Familiarise yourself with the Kiro Specs workflow.

## Specification Roles

- Review your role's template.

- Read the EARS cheatsheet; it applies to Feature Analyst and Test
  roles.

- Have a text editor ready, such as VS Code, Notepad, or any suitable
  document editor.

# Teams and Roles

Each team should consist of 10--15 participants and include at least one
developer with access to Kiro.

  ------------------------------------------------------------------------
  **Role**                **Count**   **Produces**
  ----------------------- ----------- ------------------------------------
  Feature Analyst         2           EARS requirements and user journeys

  Quality Engineer        2           Acceptance criteria and test cases

  API Designer / Software 2           Endpoint specifications
  Engineer                            

  UI/UX Designer          2           Screen specifications and flows

  Architect               1--2        System design and data model

  Harness Engineer / Kiro 1--2        Kiro steering, specs, hooks, skills,
  Engineer                            and project setup

  Facilitator / Delivery  1           Timekeeping and cross-role
  Manager                             consistency
  ------------------------------------------------------------------------

Generalists **are** welcome: Participants may contribute across roles.
For example, a developer may write requirements and a Feature Analyst
may sketch screens.

Separation of concerns: Specification roles produce the source
documents. Kiro users translate those documents into an agent-ready
harness and build from it.

## Facilitator / Delivery Manager

  ------------------------------------------------------------------------
  **Area**         **Details**
  ---------------- -------------------------------------------------------
  Primary          Keep the team on track, enforce timeboxes, and ensure
  responsibility   artefacts are consistent across roles.

  Produces         No direct artefact; ensures others produce quality work
                   on time.

  Tools            Timer and spec pack checklist.
  ------------------------------------------------------------------------

## Feature Analyst

  ------------------------------------------------------------------------
  **Area**         **Details**
  ---------------- -------------------------------------------------------
  Primary          Define what the system must do from the user's
  responsibility   perspective.

  Produces         EARS-format requirements covering all functional areas;
                   15--25 requirements minimum.

  Tools            Text editor, whiteboard, and the EARS template.

  Documentation    EARS Syntax; EARS Wikipedia; EARS Tutorial.
  ------------------------------------------------------------------------

## Test Architect / Quality Engineer

  ------------------------------------------------------------------------
  **Area**         **Details**
  ---------------- -------------------------------------------------------
  Primary          Define how to verify that the system works correctly;
  responsibility   write structured given/when/then test cases, not code.

  Produces         15--20 test cases covering happy paths, error cases,
                   and edge cases.

  Tools            Text editor and the test case template.

  Documentation    EARS Syntax and Vitest reference material.
  ------------------------------------------------------------------------

## API Designer / Software Engineer

  ------------------------------------------------------------------------
  **Area**         **Details**
  ---------------- -------------------------------------------------------
  Primary          Define the contract between frontend and backend,
  responsibility   including inputs, outputs, and error scenarios for each
                   endpoint.

  Produces         Endpoint specifications for 4--6 API routes.

  Tools            Text editor, Microsoft Copilot where Kiro is
                   unavailable, and the API specification template.

  Documentation    REST API design basics and HTTP status code references.
  ------------------------------------------------------------------------

## UI/UX Designer

  -----------------------------------------------------------------------
  **Area**         **Details**
  ---------------- ------------------------------------------------------
  Primary          Define screen layout, components, user interactions,
  responsibility   and visual flow.

  Produces         Screen specifications for 4--5 screens in markdown,
                   Figma, or photographed sketches.

  Important        Kiro must be able to read the output; visual artefacts
  requirement      must include a text description.

  Tools            Figma, paper and pen, whiteboard, text editor, and the
                   UI specification template.

  Documentation    Tailwind CSS and React references.
  -----------------------------------------------------------------------

## Architect

  ------------------------------------------------------------------------
  **Area**         **Details**
  ---------------- -------------------------------------------------------
  Primary          Define the system structure, including components, data
  responsibility   model, integrations, and technical decisions.

  Produces         Architecture document covering components, data model,
                   integration points, and key decisions.

  Important        Diagrams must be photographed or exported and
  requirement      accompanied by a text description that Kiro can
                   consume.

  Tools            Draw.io, Miro, whiteboard, pen and paper, text editor,
                   and the architecture template.

  Documentation    Prisma schema reference and Express.js reference.
  ------------------------------------------------------------------------

## Harness Engineer / Kiro Engineer

**Primary responsibility**: Set up the Kiro project, including
specifications, steering files, hooks, skills, and feedback loops. This
role connects the specification team with the AI agent and acts as the
agent wrangler for the build.

### Key Outputs

#### Steering Files

- **product.md:** Project context, goals, and constraints.

- **tech.md:** Framework choices and dependencies.

- **structure.md:** File organisation and naming conventions.

- **conventions.md:** Coding style and patterns to follow.

- **Custom files:** Files such as api-standards.md or
  testing-standards.md with appropriate inclusion modes.

- **File references:** References to team artefacts such as #api-spec.md
  and #requirements.md.

#### Specs

- **requirements.md:** Derived from the team's EARS requirements.

- **design.md:** Technical architecture and implementation approach.

- **tasks.md:** Discrete, trackable implementation tasks that Kiro
  executes.

- **Quick Plan:** Use this to auto-generate all three files when time is
  short.

- **Analyze Requirements:** Use this to catch inconsistencies before
  design work starts.

#### Hooks

- Run ESLint on file save.

- Run Vitest tests on file create or modify.

- Run TypeScript strict type-checks on save.

- Auto-update documentation when code changes.

- Define custom hooks for team conventions.

#### Skills

- Create Express endpoint from API specification.

- Create React page from UI specification.

- Generate Prisma migration from the data model.

#### MCP Connections

- Database tools, such as Prisma.

- Image processing for whiteboard photos and Figma exports.

- Documentation servers.

#### Context Providers During Build

- **#codebase:** Find relevant files across the project.

- **#file / #folder:** Reference specific files or folders.

- **#spec:** Reference all files from a specific spec.

- **#terminal:** Include terminal output for debugging.

- **#url:** Include web documentation.

#### Critical Responsibility

- Markdown and text files work directly.

- Hand-drawn diagrams, whiteboard photos, and Figma exports must be
  included as images in the repository with an accompanying text
  description.

- If tools produce non-text output, transcribe key information into
  markdown or configure MCPs that can process visual input.

- Decide what Kiro can and cannot consume, then fill any gaps.

#### Day 2 Build Role

1.  Feed specs to Kiro and monitor output quality.

2.  Refine steering files when Kiro produces inconsistent results.

3.  Run tasks individually or in parallel.

4.  Debug with #terminal context when builds fail.

5.  Adjust hooks and constraints as patterns emerge.

Tools: Kiro IDE or CLI, Kiro-assisted steering and specification
creation, and a text editor.

**Documentation:** Kiro Specs, Steering, Hooks, Skills, MCP, CLI,
Harness Engineering, and Opinionated Agents.

# Technology Stack

All teams will use the same application stack to ensure Kiro produces
consistent and comparable results.

  --------------------------------------------------
  **Layer**     **Choice**
  ------------- ------------------------------------
  Language      TypeScript in strict mode

  Frontend      React + Vite

  Backend       Node.js + Express

  Database      SQLite via Prisma

  Styling       Tailwind CSS

  Testing       Vitest for unit tests + Playwright
                for end-to-end tests

  Package       npm
  Manager       

  Structure     npm workspaces for frontend and
                backend
  --------------------------------------------------

## Infrastructure Options

Infrastructure choices depend on what each environment permits. All
paths are equally valid for judging.

  ------------------------------------------------------------------------
  **Path**           **When to Use**          **Requirements**
  ------------------ ------------------------ ----------------------------
  Local development  Machine allows Node.js,  Node.js 20+, npm, and
                     npm, and local servers.  unrestricted localhost
                                              access.

  AWS deployment     Team has AWS access and  AWS account, CDK, and
                     architecture approval.   landing zone compliance.

  Cloud development  Machine is locked down.  GitHub Codespaces or a
  environment                                 pre-provisioned virtual
                                              machine.
  ------------------------------------------------------------------------

## Starter Repository

Teams receive a starter repository containing:

- Working project structure with frontend and backend workspaces.

- Single health check endpoint: GET /health.

- Shell React application to prove that the toolchain works.

- Empty .kiro/ folder structure for teams to populate.

- All templates in docs/templates/.

- README with setup instructions.

Teams should run npm install and npm run dev to establish a working
baseline within minutes.

# Spec Pack

The spec pack is the collection of artefacts produced on Day 1 and used
as the primary input to Kiro on Day 2.

## Contents

  ------------------------------------------------------------------------------
  **Area**          **Artefact**                     **Owner / Purpose**
  ----------------- -------------------------------- ---------------------------
  docs/             requirements.md                  EARS-format requirements
                                                     produced by the Feature
                                                     Analyst.

  docs/             test-cases.md                    Acceptance criteria
                                                     produced by the Test
                                                     Architect.

  docs/             api-spec.md                      Endpoint specifications
                                                     produced by the API
                                                     Designer.

  docs/             ui-spec.md                       Screen specifications
                                                     produced by the UI/UX
                                                     Designer.

  docs/             architecture.md                  System design and data
                                                     model produced by the
                                                     Architect.

  .kiro/steering/   product.md, tech.md,             Persistent project context
                    structure.md, conventions.md,    maintained by the Harness
                    and custom steering files        Engineer.

  .kiro/specs/      requirements.md, design.md,      Kiro build workflow
                    tasks.md                         artefacts for each feature.

  .kiro/hooks/      lint-on-save.md and              Automated quality triggers.
                    test-on-create.md                

  .kiro/skills/     Optional custom skills           Reusable agent instructions
                                                     for common implementation
                                                     patterns.
  ------------------------------------------------------------------------------

# References

## Kiro

Kiro documentation: https://kiro.dev/docs

Kiro CLI: https://kiro.dev/docs/cli/

Kiro Specs: https://kiro.dev/docs/specs/

Kiro Steering: https://kiro.dev/docs/steering/

Kiro Hooks: https://kiro.dev/docs/hooks/

Kiro Agent Skills: https://kiro.dev/docs/skills/

Kiro MCP Servers: https://kiro.dev/docs/mcp/

Kiro Chat & Context: https://kiro.dev/docs/chat/

Kiro CLI Installation: https://kiro.dev/docs/cli/installation/

Agent Skills Standard: https://agentskills.io

## EARS Requirements Syntax

Official site: https://alistairmavin.com/ears/

Wikipedia:
https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax

Tutorial:
https://lifemichael.com/corporate/mastering-the-ears-syntax-write-better-requirements/

## Harness Engineering

Anatomy of an Agent Harness:
https://www.vtrivedy.com/posts/the-anatomy-of-an-agent-harness

Opinionated Agents:
https://www.vtrivedy.com/posts/agents-should-be-more-opinionated

Improving Deep Agents:
https://www.vtrivedy.com/posts/improving-deep-agents-with-harness-engineering

## AI-Native Teams

Andrew Ng --- The Batch Issue 349:
https://www.deeplearning.ai/the-batch/issue-349/

## Technology References

React: https://react.dev

Vite: https://vitejs.dev

Express.js: https://expressjs.com

Prisma: https://www.prisma.io/docs

Tailwind CSS: https://tailwindcss.com

Vitest: https://vitest.dev

Playwright: https://playwright.dev

TypeScript: https://www.typescriptlang.org/docs

# Templates

## EARS Requirements Template

\# Requirements (EARS Format)

\## \[Functional Area Name\]

\- REQ-XXX: When \[trigger\], the system shall \[action\]
\[constraint\].

\- REQ-XXX: While \[state\], the system shall \[behaviour\].

\- REQ-XXX: Where \[condition\], the system shall \[action\].

\- REQ-XXX: If \[condition\], then the system shall \[action\].

\- REQ-XXX: The system shall \[action\]. (ubiquitous --- always applies)

\## Example

\- REQ-001: When a merchant submits a payment request with valid amount,

reason, and customer phone number, the system shall create a request

record with status PENDING and return the request ID within 2 seconds.

\- REQ-002: When a merchant submits a payment request without an amount,

the system shall reject the request and return an error message

indicating \"Amount is required.\"

\- REQ-003: While a payment request has status PENDING, the system shall

accept payment attempts against that request.

\- REQ-004: Where the payment request has expired, the system shall
reject

payment attempts and return status EXPIRED.

## Test Cases Template

\# Test Cases

\## TC-XXX: \[Test Name\]

\- GIVEN \[precondition\]

\- WHEN \[action\]

\- THEN \[expected outcome\]

\- AND \[additional assertion\]

\## Example

\## TC-001: Successful Payment Request Creation

\- GIVEN a merchant is authenticated

\- WHEN they submit a request with amount=150.00, reason=\"Invoice
#123\",

customerPhone=\"0821234567\", expiresInHours=24

\- THEN the system creates a request with status PENDING

\- AND returns the request ID

\- AND the response time is under 2 seconds

\## TC-002: Reject Request Without Amount

\- GIVEN a merchant is authenticated

\- WHEN they submit a request without an amount field

\- THEN the system returns HTTP 400

\- AND the error message contains \"Amount is required\"

## API Specification Template

\# API Specification

\## \[METHOD\] \[PATH\]

\[Brief description of what this endpoint does\]

\*\*Request body:\*\*

\- fieldName (type, required/optional) --- description

\*\*Success response (status code):\*\*

\- fieldName --- description

\*\*Error responses:\*\*

\- \[status code\] --- \[when this occurs\]

\*\*Example:\*\*

Request: { \... }

Response: { \... }

\-\--

\## Example

\## POST /api/requests

Create a new payment request.

\*\*Request body:\*\*

\- amount (number, required) --- payment amount in ZAR

\- reason (string, required) --- description or invoice reference

\- customerPhone (string, required) --- SA mobile format (08x xxx xxxx)

\- expiresInHours (number, optional, default: 24) --- hours until expiry

\*\*Success response (201):\*\*

\- id --- unique request identifier

\- status --- \"PENDING\"

\- createdAt --- ISO timestamp

\- expiresAt --- ISO timestamp

\*\*Error responses:\*\*

\- 400 --- validation failed (missing required fields, invalid phone
format)

\- 401 --- not authenticated

\*\*Example:\*\*

Request: { \"amount\": 250.00, \"reason\": \"Haircut\",
\"customerPhone\": \"0821234567\" }

Response: { \"id\": \"req_abc123\", \"status\": \"PENDING\",
\"createdAt\": \"\...\", \"expiresAt\": \"\...\" }

## UI Specification Template

\# Screen Specifications

\## Screen: \[Screen Name\]

\*\*Purpose:\*\* \[What the user accomplishes here\]

\*\*Layout:\*\*

\- \[Component\] --- \[description\]

\- \[Component\] --- \[description\]

\*\*Data displayed:\*\*

\- \[field\]: \[format/source\]

\*\*Interactions:\*\*

\- \[User action\] → \[system response\]

\*\*States:\*\*

\- Empty: \[what shows when no data\]

\- Loading: \[what shows while fetching\]

\- Error: \[what shows on failure\]

\-\--

\## Example

\## Screen: Merchant Dashboard

\*\*Purpose:\*\* Merchant views all payment requests and their statuses.

\*\*Layout:\*\*

\- Header: business name, logout button

\- Action bar: \"New Request\" button (primary action, top-right)

\- Request list/table showing all requests

\*\*Data displayed:\*\*

\- Customer phone, amount (ZAR), reason, status badge, created date

\*\*Interactions:\*\*

\- Click \"New Request\" → opens create request form

\- Click a request row → shows request detail

\- Status badges update in real-time when payment is received (no page
refresh)

\*\*States:\*\*

\- Empty: \"No payment requests yet. Create your first one.\"

\- Loading: skeleton/shimmer on the request list

\- Error: \"Unable to load requests. Try again.\"

## Architecture Template

\# Architecture Document

\## Components

\- \[Component name\] --- \[responsibility\]

\## Data Model

\- \[Entity\] --- \[key fields\] --- \[relationships\]

\## Integrations

\- \[External system\] --- \[how we connect\] --- \[simulated/real\]

\## Key Decisions

\- \[Decision\] --- \[rationale\]

\-\--

\## Example

\## Components

\- Frontend (React + Vite) --- merchant and customer UIs

\- API Layer (Express) --- REST endpoints, validation, business logic

\- Database (SQLite + Prisma) --- persistence

\- Notification Service --- sends payment request to customer
(simulated)

\## Data Model

\- Merchant --- id, name, phone, email

\- PaymentRequest --- id, merchantId, amount, reason, customerPhone,
status, expiresAt

\- Transaction --- id, requestId, paymentMethod, amount, status,
completedAt

\## Integrations

\- Payment rail --- simulated (mock service returns success after 2s
delay)

\- SMS notifications --- simulated (logged to console)

\## Key Decisions

\- SQLite chosen for zero-infrastructure setup

\- Real-time updates via polling (simpler than WebSockets for a
prototype)

\- All payment processing is simulated --- no real money moves

# EARS Cheatsheet

  ----------------------------------------------------------------------------
  **Pattern**    **Structure**                     **Use When**
  -------------- --------------------------------- ---------------------------
  Ubiquitous     The system shall \[action\].      Requirement always applies.

  Event-driven   When \[trigger\], the system      Something happens that
                 shall \[action\].                 triggers behaviour.

  State-driven   While \[state\], the system shall Behaviour depends on system
                 \[behaviour\].                    state.

  Optional       Where \[feature is enabled\], the Feature may or may not be
                 system shall \[action\].          present.

  Unwanted       If \[condition\], then the system Handling error or edge
                 shall \[action\].                 cases.

  Complex        While \[state\], when             Combines state and event.
                 \[trigger\], the system shall     
                 \[action\].                       
  ----------------------------------------------------------------------------

## Tips

- One requirement per statement; do not combine multiple behaviours.

- Be specific about quantities, times, and formats.

- Avoid vague words such as "quickly", "user-friendly", "robust", and
  "seamless".

- Every requirement must be testable; if you cannot write a test case
  for it, rewrite it.

# Quality Checklist: Self-Review Before Day 2

Before starting the build, each team should verify the following items:

## Specification Consistency

- [ ] Every requirement has a corresponding test case.

- [ ] Every API endpoint is referenced by at least one requirement.

- [ ] Every UI screen references the API endpoints it calls.

- [ ] The data model supports all API endpoints.

## Harness Readiness

- [ ] Steering files reference the team's specification documents.

- [ ] At least one Kiro spec is configured: requirements.md → design.md
  → tasks.md.

- [ ] At least one hook is defined, such as lint on save or test on file
  create.

- [ ] TypeScript strict mode is enabled in tsconfig.json.

- [ ] ESLint is configured.

- [ ] All artefacts are in text or markdown format, or have text
  descriptions alongside images.
