import { useState } from 'react';
import { DisputeForm } from './components/DisputeForm';
import { DisputeList } from './components/DisputeList';
import { DisputeDetail } from './components/DisputeDetail';

type View = 'new-dispute' | 'disputes' | 'detail';

function App(): JSX.Element {
  const [view, setView] = useState<View>('new-dispute');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelectDispute(id: string): void {
    setSelectedId(id);
    setView('detail');
  }

  function handleBackToList(): void {
    setSelectedId(null);
    setView('disputes');
  }

  const tabs: { id: Exclude<View, 'detail'>; label: string }[] = [
    { id: 'new-dispute', label: 'New Dispute' },
    { id: 'disputes', label: 'Disputes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <span className="text-base font-semibold text-gray-800 tracking-tight">
              Payment Dispute Triage
            </span>
          </div>
        </div>
      </header>

      {/* Tab bar — hidden when viewing a detail */}
      {view !== 'detail' && (
        <nav
          className="bg-white border-b border-gray-200"
          aria-label="Main navigation"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0" role="tablist">
              {tabs.map((tab) => {
                const isActive = view === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => setView(tab.id)}
                    className={[
                      'px-5 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Back breadcrumb — shown only in detail view */}
      {view === 'detail' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <button
              data-testid="back-to-list"
              onClick={handleBackToList}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Disputes
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'new-dispute' && <DisputeForm key="new-dispute" />}

        {view === 'disputes' && (
          <DisputeList key="disputes" onSelect={handleSelectDispute} />
        )}

        {view === 'detail' && selectedId !== null && (
          <DisputeDetail key={selectedId} id={selectedId} />
        )}
      </main>
    </div>
  );
}

export default App;
