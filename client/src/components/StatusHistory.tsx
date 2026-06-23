export interface DisputeStatusHistory {
  id: string;
  disputeId: string;
  status: 'open' | 'resolved' | 'escalated' | 'reopened';
  reason: string;
  changedAt: string; // ISO 8601 datetime string
}

interface StatusHistoryProps {
  history: DisputeStatusHistory[];
}

const STATUS_BADGE_CLASSES: Record<DisputeStatusHistory['status'], string> = {
  open: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-red-100 text-red-700',
  reopened: 'bg-amber-100 text-amber-700',
};

const STATUS_LABELS: Record<DisputeStatusHistory['status'], string> = {
  open: 'Open',
  resolved: 'Resolved',
  escalated: 'Escalated',
  reopened: 'Reopened',
};

export function StatusHistory({ history }: StatusHistoryProps): JSX.Element {
  return (
    <div data-testid="status-history-list" className="space-y-3">
      {history.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No status changes recorded yet.</p>
      ) : (
        history.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>
              <span className="text-xs text-gray-400">
                {/* Date formatted once here — no repeated allocations per keystroke/hover re-render */}
                {new Date(entry.changedAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{entry.reason}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default StatusHistory;
