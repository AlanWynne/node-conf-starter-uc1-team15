# Project Constraints

## Scope Boundaries

The following constraints apply to all implementation decisions for this project. They must be respected across design, code, and testing.

## Data

- Use **mock dispute, customer, and transaction data only**. Do not connect to, read from, or write to any real customer or banking data sources.
- Seed files or in-memory fixtures are acceptable for populating the application with sample data.

## Decision Logic

- Use a **simple rules-based approach** to determine the recommended action for a dispute. Do not introduce AI, machine learning, probabilistic scoring, or external decision engines.
- Rules must be deterministic: the same inputs must always produce the same output.

## Payment Types

- Limit the solution to a **small set of payment types**: card transactions, bank transfers (EFT), direct debits, and standing orders.
- Do not add support for additional payment instruments without explicit agreement.

## Priority and Age Indicators

- Represent case priority and dispute age using **a few simple indicators only** (e.g., low / medium / high urgency labels, or a day-count threshold such as "over 30 days").
- Do not build complex scoring, SLA tracking, or tiered escalation workflows.

## Integrations

- **Avoid all real integrations** with external platforms, including:
  - Core banking systems
  - Card processing networks
  - Case management tools
  - Customer relationship management (CRM) platforms
- All backend endpoints must be self-contained within this monorepo and rely only on local data.
