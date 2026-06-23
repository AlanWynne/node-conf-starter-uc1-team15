# Product Context

## What This Project Is

A full-stack internal prototype that helps banking operations staff triage and route customer payment disputes. The system captures dispute details, applies deterministic business rules, and surfaces a recommended next action so that operations staff can act quickly and consistently.

## Goals

- Reduce manual effort in dispute handling by providing a clear, rule-driven recommendation for every submitted dispute.
- Ensure consistent triage outcomes — the same dispute inputs must always produce the same recommendation.
- Enable operations staff to review past disputes and their outcomes in one place.

## Target User

**Operations User** — a bank employee who receives and processes customer payment dispute requests. They are not technical users; the interface must be simple and self-explanatory.

## Constraints

- Use **mock data only** — no real customer, transaction, or banking data.
- Use a **rules-based decision engine** — no AI, machine learning, or external scoring services.
- Limit payment types to: **card transactions, bank transfers (EFT), direct debits, and standing orders**.
- Represent priority and dispute age with **simple indicators** (e.g., urgency labels, day-count thresholds).
- **No real integrations** — no core banking, card processing, CRM, or case management systems.

## Out of Scope

- Authentication and authorisation (no login required for this prototype).
- Real-time notifications or webhooks.
- Multi-tenancy or role-based access control.
- Reporting, analytics dashboards, or SLA tracking.
