import { useState, useEffect, useCallback, useMemo, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { TriageResult } from './TriageResult';
import type { RecommendedAction } from './TriageResult';
import { StatusHistory } from './StatusHistory';
import type { DisputeStatusHistory } from './StatusHistory';
import { formatLabel } from '../utils';

// ---------------------------------------------------------------------------
// Error boundary — catches render-time errors so a crash shows a message
// instead of a blank screen.
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class DisputeDetailErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { hasError: true, message };
  }

  componentDidCatch(_err: Error, _info: ErrorInfo) {
    // Could wire up structured logging here in production.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="dispute-detail-error"
          className="flex flex-col items-center gap-4 py-16 text-red-600"
        >
          <p className="font-semibold">{this.state.message}</p>
          <button
            data-testid="retry-detail"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type DisputeStatus = 'open' | 'resolved' | 'escalated' | 'reopened';
type Action = 'reopen' | 'escalate' | 'resolve';

interface Dispute {
  id: string;
  disputeRef: string;
  customerName: string;
  transactionRef: string;
  paymentType: string;
  issueCategory: string;
  transactionStatus: string;
  amount: number;
  transactionDate: string;
  description?: string;
  recommendedAction: RecommendedAction;
  disputeStatus: DisputeStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory: DisputeStatusHistory[];
}

interface DisputeDetailProps {
  id: string;
}

interface ConfirmState {
  action: Action;
  reason: string;
  submitting: boolean;
  error: string | null;
}

const STATUS_BADGE_CLASSES: Record<DisputeStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-red-100 text-red-700',
  reopened: 'bg-amber-100 text-amber-700',
};

function getStatusBadgeClass(status: string): string {
  return (
    STATUS_BADGE_CLASSES[status as DisputeStatus] ?? 'bg-gray-100 text-gray-700'
  );
}

// ---------------------------------------------------------------------------
// ConfirmPanel — shared confirm/cancel UI reused by resolve, reopen, escalate
// ---------------------------------------------------------------------------

const CONFIRM_PANEL_LABELS: Record<Action, string> = {
  resolve: 'Mark this dispute as resolved',
  reopen: 'Reopen this dispute',
  escalate: 'Escalate this dispute to fraud',
};

interface ConfirmPanelProps {
  confirmState: ConfirmState;
  onConfirm: () => void;
  onCancel: () => void;
  onReasonChange: (reason: string) => void;
}

function ConfirmPanel({
  confirmState,
  onConfirm,
  onCancel,
  onReasonChange,
}: ConfirmPanelProps): JSX.Element {
  return (
    <div
      data-testid="confirm-panel"
      className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3"
    >
      <p className="text-sm font-medium text-gray-800">
        {CONFIRM_PANEL_LABELS[confirmState.action]}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirm-reason" className="text-xs font-medium text-gray-600">
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          id="confirm-reason"
          data-testid="confirm-reason"
          value={confirmState.reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          placeholder="Enter reason…"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      {confirmState.error && (
        <p className="text-sm text-red-600">{confirmState.error}</p>
      )}
      <div className="flex gap-2">
        <button
          data-testid="confirm-action-btn"
          onClick={onConfirm}
          disabled={confirmState.submitting || confirmState.reason.trim() === ''}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {confirmState.submitting ? 'Saving…' : 'Confirm'}
        </button>
        <button
          data-testid="cancel-action-btn"
          onClick={onCancel}
          disabled={confirmState.submitting}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DisputeDetail({ id }: DisputeDetailProps): JSX.Element {
  return (
    <DisputeDetailErrorBoundary>
      <DisputeDetailInner id={id} />
    </DisputeDetailErrorBoundary>
  );
}

function DisputeDetailInner({ id }: DisputeDetailProps): JSX.Element {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const fetchDispute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/disputes/${id}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error?.message ?? `Failed to load dispute (${response.status})`
        );
      }
      const data = (await response.json()) as Dispute;
      setDispute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispute');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  // Memoize date formatting — declared before any early returns to satisfy Rules of Hooks
  const formattedDates = useMemo(
    () => ({
      transactionDate: dispute
        ? new Date(dispute.transactionDate).toLocaleDateString()
        : '',
      createdAt: dispute ? new Date(dispute.createdAt).toLocaleString() : '',
    }),
    [dispute],
  );

  function handleOpenConfirm(action: Action) {
    setConfirmState({ action, reason: '', submitting: false, error: null });
  }

  function handleCancelConfirm() {
    setConfirmState(null);
  }

  async function handleConfirm() {
    if (!confirmState) return;
    const { action, reason } = confirmState;

    setConfirmState((prev) => prev && { ...prev, submitting: true, error: null });

    try {
      const isResolve = action === 'resolve';
      const url = isResolve ? `/api/disputes/${id}/resolve` : `/api/disputes/${id}/status`;
      const body = isResolve ? { reason } : { action, reason };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(
          responseBody?.error?.message ?? `Failed to update dispute (${response.status})`
        );
      }

      const updated = (await response.json()) as Dispute;
      setDispute(updated);
      setConfirmState(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update dispute';
      setConfirmState((prev) => prev && { ...prev, submitting: false, error: message });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        Loading dispute…
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div
        data-testid="dispute-detail-error"
        className="flex flex-col items-center gap-4 py-16 text-red-600"
      >
        <p className="font-semibold">{error ?? 'Dispute not found'}</p>
        <button
          data-testid="retry-detail"
          onClick={fetchDispute}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isResolved = dispute.disputeStatus === 'resolved';
  const isReopened = dispute.disputeStatus === 'reopened';
  const canResolve =
    dispute.disputeStatus === 'open' ||
    dispute.disputeStatus === 'reopened' ||
    dispute.disputeStatus === 'escalated';
  const canEscalate = isResolved || isReopened;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-semibold text-indigo-700 mb-0.5">
            {dispute.disputeRef}
          </p>
          <h2 className="text-xl font-semibold text-gray-900">{dispute.customerName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Txn Ref: {dispute.transactionRef}</p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(dispute.disputeStatus)}`}
        >
          {formatLabel(dispute.disputeStatus)}
        </span>
      </div>

      {/* Triage Result */}
      <TriageResult action={dispute.recommendedAction} />

      {/* Dispute Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Dispute Details
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">Payment Type</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatLabel(dispute.paymentType)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Issue Category</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatLabel(dispute.issueCategory)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Transaction Status</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatLabel(dispute.transactionStatus)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Amount</dt>
            <dd className="text-sm font-medium text-gray-900">
              {dispute.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Transaction Date</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formattedDates.transactionDate}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Created At</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formattedDates.createdAt}
            </dd>
          </div>
          {dispute.description && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">Description</dt>
              <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {dispute.description}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Status History */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Status History
        </h3>
        <StatusHistory history={dispute.statusHistory} />
      </div>

      {/* Mark as Resolved — only for open or reopened disputes */}
      {canResolve && (
        <div className="flex flex-col gap-3">
          {!confirmState && (
            <div className="flex gap-3">
              <button
                data-testid="resolve-btn"
                onClick={() => handleOpenConfirm('resolve')}
                className="rounded-lg border border-green-400 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 transition-colors"
              >
                Mark as Resolved
              </button>
            </div>
          )}

          {confirmState && (
            <ConfirmPanel
              confirmState={confirmState}
              onConfirm={handleConfirm}
              onCancel={handleCancelConfirm}
              onReasonChange={(reason) =>
                setConfirmState((prev) => prev && { ...prev, reason })
              }
            />
          )}
        </div>
      )}

      {/* Reopen (resolved only) + Escalate (resolved or reopened) */}
      {canEscalate && !confirmState && (
        <div className="flex gap-3">
          {isResolved && (
            <button
              data-testid="reopen-btn"
              onClick={() => handleOpenConfirm('reopen')}
              className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Reopen
            </button>
          )}
          <button
            data-testid="escalate-btn"
            onClick={() => handleOpenConfirm('escalate')}
            className="rounded-lg border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 transition-colors"
          >
            Escalate
          </button>
        </div>
      )}

      {/* Shared confirm panel for reopen / escalate */}
      {canEscalate && confirmState && (
        <ConfirmPanel
          confirmState={confirmState}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          onReasonChange={(reason) =>
            setConfirmState((prev) => prev && { ...prev, reason })
          }
        />
      )}
    </div>
  );
}

export default DisputeDetail;
