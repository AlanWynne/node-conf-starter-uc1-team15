# Requirements Document

## Introduction

### Background

In a banking environment, payment disputes are a high-volume operational reality with direct impact on customer trust, service costs, and regulatory handling standards. Frontline staff currently must gather information from multiple sources, interpret each case manually, and decide what action to take — a process that slows resolution, creates inconsistent outcomes, and diverts effort from the cases that need it most. Improving the triage process can reduce turnaround times, improve consistency of decisions, and help operations teams focus their effort where it is most needed.

### What This Feature Delivers

This feature provides an internal tool for banking operations users to triage and route customer payment disputes. The system captures dispute details (payment type, issue category, transaction metadata), applies deterministic business rules, and recommends the most appropriate next action.

The prototype supports a single, focused journey: an operations user captures a customer payment dispute and receives a recommended route or action. The result must clearly indicate why the case was classified in a certain way and whether it should be resolved immediately, investigated further, escalated, or referred to another team.

The goal is to reduce manual effort, speed up resolution, and ensure consistent handling across the operations team.

### Expected Outcome

The best solutions will demonstrate a clear understanding of a realistic banking operations problem, a practical and intuitive user flow, and a sensible way to guide dispute handling using transparent rules. Teams should focus on clarity, usability, and a well-scoped working prototype rather than trying to solve the full end-to-end disputes process.

## Glossary

- **Triage_System**: The backend service responsible for accepting dispute data, evaluating business rules, and returning a recommended next action.
- **Dispute_Form**: The frontend UI component that allows an operations user to capture and submit a new payment dispute.
- **Dispute**: A record representing a customer's complaint about a specific payment transaction, including metadata such as payment type, issue category, transaction amount, transaction date, and current transaction status.
- **Payment_Type**: The category of payment instrument involved in the dispute. Valid values: direct_debit, bank_transfer, card_transaction, standing_order.
- **Issue_Category**: The classification of the problem reported by the customer. Valid values: duplicate_charge, failed_transfer, missing_payment, unauthorized_transaction, incorrect_amount.
- **Transaction_Status**: The current state of the disputed transaction. Valid values: pending, completed, failed, reversed.
- **Recommended_Action**: The next step suggested by the Triage_System based on business rules. Valid values: auto_refund, manual_review, escalate_to_fraud, contact_customer, reject_dispute.
- **Dispute_Age**: The number of calendar days between the transaction date and the date the dispute is submitted.
- **Operations_User**: A bank employee using the Triage_System to process customer payment disputes.
- **Dispute_Status**: The lifecycle state of a Dispute. Valid values: open, resolved, escalated, reopened.

## Requirements

### Requirement 1: Capture Payment Dispute

**User Story:** As an Operations_User, I want to capture a payment dispute with all relevant details, so that the dispute is recorded and ready for triage.

#### Acceptance Criteria

1. THE Dispute_Form SHALL display input fields for customer name (maximum 200 characters), transaction reference (maximum 50 characters), Payment_Type, Issue_Category, transaction amount, transaction date, Transaction_Status, and a free-text description.
2. WHEN the Operations_User submits the Dispute_Form with all required fields populated, THE Triage_System SHALL create a new Dispute record, return a unique dispute identifier, and THE Dispute_Form SHALL display a success confirmation containing the dispute identifier.
3. IF the Operations_User submits the Dispute_Form with one or more required fields missing, THEN THE Dispute_Form SHALL display a validation error indicating which fields are missing without clearing the already-populated fields.
4. WHEN the Operations_User enters a transaction amount, THE Dispute_Form SHALL accept only numeric values between 0.01 and 9,999,999.99 inclusive, with up to two decimal places.
5. WHEN the Operations_User enters a transaction date, THE Dispute_Form SHALL accept only dates that are not in the future relative to the current calendar date.
6. WHEN the Operations_User enters a free-text description, THE Dispute_Form SHALL accept a maximum of 2000 characters and display the remaining character count.

### Requirement 2: Calculate Recommended Action

**User Story:** As an Operations_User, I want the system to recommend the next action for a dispute, so that I can handle it quickly and consistently.

#### Acceptance Criteria

1. WHEN a Dispute is created with valid Payment_Type, Issue_Category, Transaction_Status, transaction amount, and Dispute_Age, THE Triage_System SHALL evaluate the rules in criteria 2 through 8 in order and return the Recommended_Action from the first matching rule.
2. WHEN the Issue_Category is unauthorized_transaction AND the transaction amount exceeds 500 (in the transaction's currency), THE Triage_System SHALL return escalate_to_fraud as the Recommended_Action.
3. WHEN the Issue_Category is unauthorized_transaction AND the transaction amount is 500 or less (in the transaction's currency), THE Triage_System SHALL return manual_review as the Recommended_Action.
4. WHEN the Issue_Category is duplicate_charge AND the Transaction_Status is completed, THE Triage_System SHALL return auto_refund as the Recommended_Action.
5. WHEN the Issue_Category is failed_transfer AND the Transaction_Status is failed, THE Triage_System SHALL return contact_customer as the Recommended_Action.
6. WHEN the Issue_Category is missing_payment AND the Dispute_Age exceeds 30 days, THE Triage_System SHALL return escalate_to_fraud as the Recommended_Action.
7. WHEN the Issue_Category is missing_payment AND the Dispute_Age is 30 days or less, THE Triage_System SHALL return manual_review as the Recommended_Action.
8. WHEN the Issue_Category is incorrect_amount, THE Triage_System SHALL return manual_review as the Recommended_Action.
9. WHEN no specific rule from criteria 2 through 8 matches the dispute parameters, THE Triage_System SHALL return manual_review as the Recommended_Action.
10. IF the dispute is missing any required field (Payment_Type, Issue_Category, Transaction_Status, transaction amount, or Dispute_Age) or contains a value not in the valid set defined in the Glossary, THEN THE Triage_System SHALL reject the request with an error message indicating which field is missing or invalid, and SHALL NOT return a Recommended_Action.
11. THE Triage_System SHALL return the Recommended_Action within 2 seconds of receiving the dispute data.

### Requirement 3: Display Triage Result

**User Story:** As an Operations_User, I want to see the recommended action immediately after submitting a dispute, so that I can act on it without delay.

#### Acceptance Criteria

1. WHEN the Triage_System returns a Recommended_Action, THE Dispute_Form SHALL display the recommendation above the fold and visually distinct from the dispute summary, without requiring the user to scroll.
2. THE Dispute_Form SHALL display the Recommended_Action using a human-readable label (e.g., "Escalate to Fraud Team" instead of "escalate_to_fraud").
3. WHEN the Recommended_Action is escalate_to_fraud, THE Dispute_Form SHALL display the recommendation with a high-urgency visual indicator that is visually distinct from the standard-priority indicator.
4. WHEN the Recommended_Action is auto_refund, manual_review, contact_customer, or reject_dispute, THE Dispute_Form SHALL display the recommendation with a standard-priority visual indicator.
5. IF the Triage_System does not return a Recommended_Action within 10 seconds of submission, THEN THE Dispute_Form SHALL display an error message indicating the triage result is unavailable and allow the Operations_User to retry the submission.
6. WHEN the Triage_System returns a Recommended_Action, THE Dispute_Form SHALL display the result within 3 seconds of the user submitting the dispute.

### Requirement 4: List and Review Disputes

**User Story:** As an Operations_User, I want to view previously submitted disputes and their recommended actions, so that I can track dispute handling and review past decisions.

#### Acceptance Criteria

1. THE Triage_System SHALL provide an endpoint that returns stored Dispute records ordered by creation date descending, returning a maximum of 50 records per page and supporting pagination parameters to retrieve subsequent pages.
2. THE Dispute_Form SHALL include a dispute list view showing customer name, Payment_Type, Issue_Category, Recommended_Action, and creation date for each dispute.
3. WHEN the Operations_User selects a dispute from the list, THE Dispute_Form SHALL display the dispute details including customer name, Payment_Type, Issue_Category, disputed amount, transaction date, description, Recommended_Action, and creation date.
4. IF no Dispute records exist, THEN THE Dispute_Form SHALL display an empty-state message indicating that no disputes have been submitted.
5. IF the Triage_System fails to retrieve Dispute records, THEN THE Dispute_Form SHALL display an error message indicating that disputes could not be loaded and allow the Operations_User to retry the request.

### Requirement 5: Validate Business Rule Inputs

**User Story:** As an Operations_User, I want the system to reject invalid dispute data, so that triage decisions are based on accurate information.

#### Acceptance Criteria

1. WHEN the Operations_User submits a Payment_Type value that is not one of direct_debit, bank_transfer, card_transaction, or standing_order, THE Triage_System SHALL reject the request with an error message indicating the field name and the list of valid values.
2. WHEN the Operations_User submits an Issue_Category value that is not one of duplicate_charge, failed_transfer, missing_payment, unauthorized_transaction, or incorrect_amount, THE Triage_System SHALL reject the request with an error message indicating the field name and the list of valid values.
3. WHEN the Operations_User submits a Transaction_Status value that is not one of pending, completed, failed, or reversed, THE Triage_System SHALL reject the request with an error message indicating the field name and the list of valid values.
4. WHEN the Operations_User submits a transaction amount that is less than or equal to zero or greater than 999,999,999.99, THE Triage_System SHALL reject the request with an error message indicating the field name and the acceptable range of 0.01 to 999,999,999.99.
5. WHEN the Operations_User submits a request with any required field empty or missing, THE Triage_System SHALL reject the request with an error message identifying each missing or empty field.
6. WHEN the Operations_User submits a request containing multiple validation errors, THE Triage_System SHALL reject the request with an error message listing all validation failures rather than only the first encountered.

### Requirement 6: Persist Disputes

**User Story:** As an Operations_User, I want disputes to be stored persistently, so that I can retrieve them across sessions.

#### Acceptance Criteria

1. WHEN a Dispute is successfully created, THE Triage_System SHALL persist the Dispute record including all submitted fields, the calculated Recommended_Action, and a creation timestamp in ISO 8601 UTC format.
2. THE Triage_System SHALL assign each Dispute a unique identifier upon creation, and WHEN an Operations_User requests a Dispute by its identifier, THE Triage_System SHALL return the complete Dispute record with all persisted fields matching the originally submitted values.
3. WHEN the Triage_System restarts, THE Triage_System SHALL retain all previously persisted Dispute records with no data loss.
4. IF the Triage_System fails to persist a Dispute record, THEN THE Triage_System SHALL not confirm successful creation to the caller and SHALL return an error response indicating that the dispute was not saved.

### Requirement 7: Reopen or Escalate a Resolved Dispute

**User Story:** As an Operations_User, I want to reopen or escalate a resolved dispute, so that I can act when new information emerges or the original resolution turns out to be insufficient.

#### Acceptance Criteria

1. WHEN a Dispute has a Dispute_Status of resolved, THE Dispute_Form SHALL display a "Reopen" action and an "Escalate" action alongside the dispute details. WHEN a Dispute has a Dispute_Status of reopened, THE Dispute_Form SHALL display an "Escalate" action (but not a "Reopen" action) alongside the dispute details.
2. WHEN the Operations_User selects "Reopen" on a resolved Dispute, THE Triage_System SHALL update the Dispute_Status to reopened and record the timestamp of the status change.
3. WHEN the Operations_User selects "Escalate" on a resolved Dispute, THE Triage_System SHALL update the Dispute_Status to escalated, set the Recommended_Action to escalate_to_fraud, and record the timestamp of the status change.
4. WHEN the Operations_User reopens or escalates a Dispute, THE Dispute_Form SHALL require the Operations_User to enter a reason before confirming the action, and THE Triage_System SHALL persist the reason alongside the status change.
5. WHEN the Operations_User reopens or escalates a Dispute, THE Dispute_Form SHALL display a confirmation message indicating the new Dispute_Status and the recorded reason.
6. IF a Dispute has a Dispute_Status of open or escalated, THEN THE Dispute_Form SHALL NOT display the "Reopen" or "Escalate" actions for that Dispute. IF a Dispute has a Dispute_Status of reopened, THEN THE Dispute_Form SHALL NOT display the "Reopen" action for that Dispute.
7. THE Triage_System SHALL record the full status history of a Dispute, including each status value, the reason provided, and the timestamp of each change, and SHALL return this history when the Dispute is retrieved.
