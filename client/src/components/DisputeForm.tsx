import { useState } from 'react';
import { TriageResult, RecommendedAction } from './TriageResult';

// --- Types ---

type PaymentType = 'card_transaction' | 'bank_transfer' | 'direct_debit' | 'standing_order';
type IssueCategory =
  | 'duplicate_charge'
  | 'failed_transfer'
  | 'missing_payment'
  | 'unauthorized_transaction'
  | 'incorrect_amount';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

interface FormFields {
  customerName: string;
  transactionRef: string;
  paymentType: PaymentType | '';
  issueCategory: IssueCategory | '';
  transactionStatus: TransactionStatus | '';
  amount: string;
  transactionDate: string;
  description: string;
}

interface FormErrors {
  customerName?: string;
  transactionRef?: string;
  paymentType?: string;
  issueCategory?: string;
  transactionStatus?: string;
  amount?: string;
  transactionDate?: string;
  description?: string;
}

interface DisputeResponse {
  id: string;
  disputeRef: string;
  recommendedAction: RecommendedAction;
  [key: string]: unknown;
}

// --- Constants ---

const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'card_transaction', label: 'Card Transaction' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'direct_debit', label: 'Direct Debit' },
  { value: 'standing_order', label: 'Standing Order' },
];

const ISSUE_CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = [
  { value: 'duplicate_charge', label: 'Duplicate Charge' },
  { value: 'failed_transfer', label: 'Failed Transfer' },
  { value: 'missing_payment', label: 'Missing Payment' },
  { value: 'unauthorized_transaction', label: 'Unauthorized Transaction' },
  { value: 'incorrect_amount', label: 'Incorrect Amount' },
];

const TRANSACTION_STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
];

const DESCRIPTION_MAX = 2000;

const INITIAL_FIELDS: FormFields = {
  customerName: '',
  transactionRef: '',
  paymentType: '',
  issueCategory: '',
  transactionStatus: '',
  amount: '',
  transactionDate: '',
  description: '',
};

// --- Validation ---

function validateFields(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.customerName.trim()) {
    errors.customerName = 'Customer name is required.';
  }

  if (!fields.transactionRef.trim()) {
    errors.transactionRef = 'Transaction reference is required.';
  }

  if (!fields.paymentType) {
    errors.paymentType = 'Payment type is required.';
  }

  if (!fields.issueCategory) {
    errors.issueCategory = 'Issue category is required.';
  }

  if (!fields.transactionStatus) {
    errors.transactionStatus = 'Transaction status is required.';
  }

  if (!fields.amount.trim()) {
    errors.amount = 'Amount is required.';
  } else {
    const numeric = parseFloat(fields.amount);
    if (isNaN(numeric) || numeric < 0.01 || numeric > 999999999.99) {
      errors.amount = 'Amount must be between 0.01 and 999,999,999.99.';
    }
  }

  if (!fields.transactionDate) {
    errors.transactionDate = 'Transaction date is required.';
  } else {
    const dateValue = new Date(fields.transactionDate);
    if (isNaN(dateValue.getTime())) {
      errors.transactionDate = 'Transaction date must be a valid date.';
    } else {
      // Compare date-only (strip time) to avoid timezone edge cases
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateValue > today) {
        errors.transactionDate = 'Transaction date cannot be in the future.';
      }
    }
  }

  if (fields.description.length > DESCRIPTION_MAX) {
    errors.description = `Description must not exceed ${DESCRIPTION_MAX} characters.`;
  }

  return errors;
}

// --- Component ---

export function DisputeForm(): JSX.Element {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [aborted, setAborted] = useState(false);
  const [result, setResult] = useState<DisputeResponse | null>(null);

  const charsRemaining = DESCRIPTION_MAX - fields.description.length;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the per-field error as the user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setApiError(null);
    setAborted(false);

    const validationErrors = validateFields(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const body = {
        customerName: fields.customerName.trim(),
        transactionRef: fields.transactionRef.trim(),
        paymentType: fields.paymentType,
        issueCategory: fields.issueCategory,
        transactionStatus: fields.transactionStatus,
        amount: parseFloat(fields.amount),
        transactionDate: new Date(fields.transactionDate).toISOString(),
        description: fields.description || undefined,
      };

      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let message = 'An unexpected error occurred. Please try again.';
        try {
          const json = await response.json();
          if (json?.error?.message) {
            message = json.error.message;
          }
        } catch {
          // leave generic message
        }
        setApiError(message);
        return;
      }

      const data: DisputeResponse = await response.json();
      setResult(data);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setAborted(true);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry(): void {
    setAborted(false);
    setApiError(null);
  }

  // --- Render helpers ---

  const inputBase =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const inputError =
    'block w-full rounded-md border border-red-400 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'mt-1 text-xs text-red-600';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Payment Dispute</h1>

      {/* Success banner */}
      {result && (
        <div
          data-testid="success-banner"
          className="mb-6 rounded-md bg-green-50 border border-green-300 p-4 text-green-800"
        >
          <p className="font-semibold">Dispute submitted successfully.</p>
          <p className="text-sm mt-2">
            Your dispute reference number:{' '}
            <span
              data-testid="dispute-ref"
              className="font-mono font-bold text-base tracking-wide"
            >
              {result.disputeRef}
            </span>
          </p>
          <p className="text-xs text-green-600 mt-1">
            Please keep this reference for your records. You can use it to track your dispute.
          </p>
        </div>
      )}

      {/* Triage result */}
      {result && (
        <div className="mb-6">
          <TriageResult action={result.recommendedAction} />
        </div>
      )}

      {/* Error popup modal */}
      {(apiError || aborted) && (
        <div
          data-testid="error-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div
            data-testid="error-banner"
            className={`w-full max-w-md mx-4 rounded-lg shadow-xl p-6 ${
              aborted
                ? 'bg-yellow-50 border border-yellow-300 text-yellow-900'
                : 'bg-red-50 border border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Icon */}
                {aborted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <h2
                  id="error-modal-title"
                  className="text-base font-semibold"
                >
                  {aborted ? 'Request timed out' : 'Submission failed'}
                </h2>
              </div>
              {/* Close button */}
              <button
                type="button"
                data-testid="error-modal-close"
                onClick={handleRetry}
                aria-label="Close error"
                className={`rounded-md p-1 hover:bg-black/10 focus:outline-none focus:ring-2 ${
                  aborted ? 'focus:ring-yellow-600' : 'focus:ring-red-600'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-sm">
              {aborted
                ? 'The server did not respond within 10 seconds. Please check your connection and try again.'
                : apiError}
            </p>

            {aborted && (
              <button
                type="button"
                data-testid="error-modal-retry"
                onClick={handleRetry}
                className="mt-4 inline-flex items-center rounded-md bg-yellow-700 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-1"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Customer Name */}
        <div>
          <label htmlFor="customerName" className={labelClass}>
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            autoComplete="off"
            data-testid="customer-name"
            value={fields.customerName}
            onChange={handleChange}
            className={errors.customerName ? inputError : inputBase}
          />
          {errors.customerName && (
            <p className={errorClass} role="alert">
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Transaction Reference */}
        <div>
          <label htmlFor="transactionRef" className={labelClass}>
            Transaction Reference <span className="text-red-500">*</span>
          </label>
          <input
            id="transactionRef"
            name="transactionRef"
            type="text"
            autoComplete="off"
            data-testid="transaction-ref"
            value={fields.transactionRef}
            onChange={handleChange}
            className={errors.transactionRef ? inputError : inputBase}
          />
          {errors.transactionRef && (
            <p className={errorClass} role="alert">
              {errors.transactionRef}
            </p>
          )}
        </div>

        {/* Payment Type */}
        <div>
          <label htmlFor="paymentType" className={labelClass}>
            Payment Type <span className="text-red-500">*</span>
          </label>
          <select
            id="paymentType"
            name="paymentType"
            data-testid="payment-type"
            value={fields.paymentType}
            onChange={handleChange}
            className={errors.paymentType ? inputError : inputBase}
          >
            <option value="">Select a payment type</option>
            {PAYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.paymentType && (
            <p className={errorClass} role="alert">
              {errors.paymentType}
            </p>
          )}
        </div>

        {/* Issue Category */}
        <div>
          <label htmlFor="issueCategory" className={labelClass}>
            Issue Category <span className="text-red-500">*</span>
          </label>
          <select
            id="issueCategory"
            name="issueCategory"
            data-testid="issue-category"
            value={fields.issueCategory}
            onChange={handleChange}
            className={errors.issueCategory ? inputError : inputBase}
          >
            <option value="">Select an issue category</option>
            {ISSUE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.issueCategory && (
            <p className={errorClass} role="alert">
              {errors.issueCategory}
            </p>
          )}
        </div>

        {/* Transaction Status */}
        <div>
          <label htmlFor="transactionStatus" className={labelClass}>
            Transaction Status <span className="text-red-500">*</span>
          </label>
          <select
            id="transactionStatus"
            name="transactionStatus"
            data-testid="transaction-status"
            value={fields.transactionStatus}
            onChange={handleChange}
            className={errors.transactionStatus ? inputError : inputBase}
          >
            <option value="">Select a transaction status</option>
            {TRANSACTION_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.transactionStatus && (
            <p className={errorClass} role="alert">
              {errors.transactionStatus}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className={labelClass}>
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max="999999999.99"
            data-testid="amount"
            value={fields.amount}
            onChange={handleChange}
            className={errors.amount ? inputError : inputBase}
          />
          {errors.amount && (
            <p className={errorClass} role="alert">
              {errors.amount}
            </p>
          )}
        </div>

        {/* Transaction Date */}
        <div>
          <label htmlFor="transactionDate" className={labelClass}>
            Transaction Date <span className="text-red-500">*</span>
          </label>
          <input
            id="transactionDate"
            name="transactionDate"
            type="date"
            data-testid="transaction-date"
            value={fields.transactionDate}
            onChange={handleChange}
            className={errors.transactionDate ? inputError : inputBase}
          />
          {errors.transactionDate && (
            <p className={errorClass} role="alert">
              {errors.transactionDate}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClass}>
            Description
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({charsRemaining} characters remaining)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            data-testid="description"
            value={fields.description}
            onChange={handleChange}
            className={errors.description ? inputError : inputBase}
          />
          {errors.description && (
            <p className={errorClass} role="alert">
              {errors.description}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            data-testid="submit-dispute"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DisputeForm;
