import {
  FRAUD_ESCALATION_AMOUNT_THRESHOLD,
  MISSING_PAYMENT_ESCALATION_DAYS,
} from './constants.js';

export type PaymentType =
  | 'card_transaction'
  | 'bank_transfer'
  | 'direct_debit'
  | 'standing_order';

export type IssueCategory =
  | 'duplicate_charge'
  | 'failed_transfer'
  | 'missing_payment'
  | 'unauthorized_transaction'
  | 'incorrect_amount';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export type RecommendedAction =
  | 'auto_refund'
  | 'manual_review'
  | 'escalate_to_fraud'
  | 'contact_customer'
  | 'reject_dispute';

export interface TriageInput {
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  amount: number; // positive, up to 2 decimal places
  disputeAge: number; // calendar days from transaction date to submission date
}

export function triageDispute(input: TriageInput): RecommendedAction {
  const { issueCategory, transactionStatus, amount, disputeAge } = input;

  // Rule 1: unauthorized_transaction AND amount > FRAUD_ESCALATION_AMOUNT_THRESHOLD
  if (issueCategory === 'unauthorized_transaction' && amount > FRAUD_ESCALATION_AMOUNT_THRESHOLD) {
    return 'escalate_to_fraud';
  }

  // Rule 2: unauthorized_transaction AND amount <= FRAUD_ESCALATION_AMOUNT_THRESHOLD
  if (issueCategory === 'unauthorized_transaction' && amount <= FRAUD_ESCALATION_AMOUNT_THRESHOLD) {
    return 'manual_review';
  }

  // Rule 3: duplicate_charge AND transactionStatus === 'completed'
  if (issueCategory === 'duplicate_charge' && transactionStatus === 'completed') {
    return 'auto_refund';
  }

  // Rule 4: failed_transfer AND transactionStatus === 'failed'
  if (issueCategory === 'failed_transfer' && transactionStatus === 'failed') {
    return 'contact_customer';
  }

  // Rule 5: missing_payment AND disputeAge > MISSING_PAYMENT_ESCALATION_DAYS
  if (issueCategory === 'missing_payment' && disputeAge > MISSING_PAYMENT_ESCALATION_DAYS) {
    return 'escalate_to_fraud';
  }

  // Rule 6: missing_payment AND disputeAge <= MISSING_PAYMENT_ESCALATION_DAYS
  if (issueCategory === 'missing_payment' && disputeAge <= MISSING_PAYMENT_ESCALATION_DAYS) {
    return 'manual_review';
  }

  // Rule 7: incorrect_amount
  if (issueCategory === 'incorrect_amount') {
    return 'manual_review';
  }

  // Default fallback
  return 'manual_review';
}
