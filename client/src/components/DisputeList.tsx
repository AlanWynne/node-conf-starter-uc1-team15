import { useState, useEffect, useCallback } from 'react';
import { formatLabel } from '../utils';

interface DisputeSummary {
  id: string;
  disputeRef: string;
  customerName: string;
  paymentType: string;
  issueCategory: string;
  recommendedAction: string;
  disputeStatus: string;
  amount: number;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

interface DisputeListProps {
  onSelect: (id: string) => void;
}

export function DisputeList({ onSelect }: DisputeListProps) {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, pageSize: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/disputes?page=${page}&pageSize=50`);
      if (!response.ok) {
        throw new Error(`Failed to load disputes (${response.status})`);
      }
      const body = await response.json();
      // Pre-format dates at data-load time to avoid repeated allocations in the render loop
      const formattedData: DisputeSummary[] = (body.data as DisputeSummary[]).map((d) => ({
        ...d,
        createdAt: new Date(d.createdAt).toLocaleDateString(),
      }));
      setDisputes(formattedData);
      setPagination(body.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes(1);
  }, [fetchDisputes]);

  function handlePageChange(newPage: number) {
    fetchDisputes(newPage);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        Loading disputes…
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="dispute-list-error"
        className="flex flex-col items-center gap-4 py-16 text-red-600"
      >
        <p className="font-semibold">{error}</p>
        <button
          data-testid="retry-list"
          onClick={() => fetchDisputes(pagination.page)}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div
        data-testid="dispute-list-empty"
        className="flex items-center justify-center py-16 text-gray-500"
      >
        No disputes found.
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const showPagination = pagination.total > pagination.pageSize;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Dispute Ref
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Customer Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Payment Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Issue Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Recommended Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {disputes.map((dispute) => (
              <tr
                key={dispute.id}
                data-testid={`dispute-row-${dispute.id}`}
                onClick={() => onSelect(dispute.id)}
                className="cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-mono font-medium text-indigo-700">
                  <span data-testid={`dispute-ref-${dispute.id}`}>{dispute.disputeRef}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{dispute.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatLabel(dispute.paymentType)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatLabel(dispute.issueCategory)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatLabel(dispute.recommendedAction)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatLabel(dispute.disputeStatus)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {/* Already formatted at fetch time — no Date allocation in the render loop */}
                  {dispute.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
