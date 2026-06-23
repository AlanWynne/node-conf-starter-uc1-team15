export type RecommendedAction =
  | 'auto_refund'
  | 'manual_review'
  | 'escalate_to_fraud'
  | 'contact_customer'
  | 'reject_dispute';

interface TriageResultProps {
  action: RecommendedAction;
}

interface ActionConfig {
  label: string;
  containerClass: string;
  badgeClass: string;
}

const ACTION_CONFIG: Record<RecommendedAction, ActionConfig> = {
  escalate_to_fraud: {
    label: 'Escalate to Fraud Team',
    containerClass: 'bg-red-50 border border-red-300 text-red-800',
    badgeClass: 'bg-red-100 text-red-700',
  },
  auto_refund: {
    label: 'Auto Refund',
    containerClass: 'bg-green-50 border border-green-300 text-green-800',
    badgeClass: 'bg-green-100 text-green-700',
  },
  manual_review: {
    label: 'Manual Review',
    containerClass: 'bg-blue-50 border border-blue-300 text-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  contact_customer: {
    label: 'Contact Customer',
    containerClass: 'bg-amber-50 border border-amber-300 text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  reject_dispute: {
    label: 'Reject Dispute',
    containerClass: 'bg-gray-50 border border-gray-300 text-gray-800',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
};

export function TriageResult({ action }: TriageResultProps): JSX.Element {
  const config = ACTION_CONFIG[action] ?? ACTION_CONFIG['manual_review'];
  const isHighUrgency = action === 'escalate_to_fraud';

  return (
    <div
      data-testid="triage-result"
      className={`rounded-lg p-4 ${config.containerClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">
        Recommended Action
      </p>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold ${config.badgeClass}`}
        >
          {config.label}
        </span>
        {isHighUrgency ? (
          <span
            data-testid="triage-urgency-high"
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 ring-1 ring-red-300"
          >
            High Urgency
          </span>
        ) : (
          <span
            data-testid="triage-urgency-standard"
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-white text-gray-500 ring-1 ring-gray-300"
          >
            Standard Priority
          </span>
        )}
      </div>
    </div>
  );
}

export default TriageResult;
