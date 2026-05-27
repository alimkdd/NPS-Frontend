import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { adminAuth } from '../lib/auth';
import { ApiError, type SubscriptionFilter } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';

export function AdminListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<SubscriptionFilter>({
    page: 1,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const lookupsQuery = useQuery({
    queryKey: ['lookups'],
    queryFn: ({ signal }) => api.getLookups(signal),
  });

  const listQuery = useQuery({
    queryKey: ['subscriptions', filter],
    queryFn: ({ signal }) => api.listSubscriptions(filter, signal),
    placeholderData: (previous) => previous,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (err) => {
      setDeleteError(err instanceof ApiError ? err.message : 'Delete failed.');
    },
  });

  function applyFilter(next: Partial<SubscriptionFilter>) {
    setFilter((current) => ({ ...current, ...next, page: 1 }));
  }

  function setPage(page: number) {
    setFilter((current) => ({ ...current, page }));
  }

  function handleSignOut() {
    adminAuth.clear();
    navigate('/admin', { replace: true });
  }

  if (listQuery.isError && listQuery.error instanceof ApiError && listQuery.error.isUnauthorized) {
    adminAuth.clear();
    navigate('/admin', { replace: true });
    return null;
  }

  const result = listQuery.data;
  const totalPages = result ? Math.max(1, Math.ceil(result.totalCount / (filter.pageSize ?? 10))) : 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Live (non-deleted) subscribers. Use filters to narrow the list.
          </p>
        </div>
        <Button variant="secondary" onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      <form
        className="grid gap-3 sm:grid-cols-[1fr,auto,auto,auto,auto] items-end bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilter({ searchTerm: searchInput || undefined });
        }}
      >
        <div>
          <label htmlFor="search" className="block text-xs font-medium text-slate-600 mb-1">
            Search (name or email)
          </label>
          <input
            id="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-base"
          />
        </div>
        <FilterSelect
          label="Subscriber type"
          options={lookupsQuery.data?.subscriberTypes ?? []}
          value={filter.subscriberTypeId}
          onChange={(v) => applyFilter({ subscriberTypeId: v })}
        />
        <FilterSelect
          label="Communication"
          options={lookupsQuery.data?.communicationPreferences ?? []}
          value={filter.communicationPreferenceId}
          onChange={(v) => applyFilter({ communicationPreferenceId: v })}
        />
        <FilterSelect
          label="Interest"
          options={lookupsQuery.data?.interests ?? []}
          value={filter.interestId}
          onChange={(v) => applyFilter({ interestId: v })}
        />
        <Button type="submit" variant="primary">
          Apply
        </Button>
      </form>

      {deleteError && <Alert tone="error">{deleteError}</Alert>}

      {listQuery.isLoading ? (
        <Spinner label="Loading subscribers…" />
      ) : listQuery.isError ? (
        <Alert tone="error" title="Couldn’t load subscriptions">
          {listQuery.error instanceof ApiError ? listQuery.error.message : 'Unexpected error.'}
        </Alert>
      ) : !result || result.items.length === 0 ? (
        <Alert tone="info">No subscriptions match your filters.</Alert>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Channels</th>
                <th className="px-4 py-3 font-semibold">Interests</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.items.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {sub.firstName} {sub.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{sub.email}</td>
                  <td className="px-4 py-3 text-slate-700">{sub.subscriberType.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {sub.communicationPreferences.map((c) => c.name).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {sub.interests.map((i) => i.name).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Soft-delete ${sub.email}? They will stop receiving newsletters.`,
                          )
                        ) {
                          deleteMutation.mutate(sub.id);
                        }
                      }}
                      loading={deleteMutation.isPending && deleteMutation.variables === sub.id}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalCount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Page {result.page} of {totalPages} — {result.totalCount} subscriber
            {result.totalCount === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={result.page <= 1}
              onClick={() => setPage(result.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={result.page >= totalPages}
              onClick={() => setPage(result.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  options: { id: number; name: string }[];
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}

function FilterSelect({ label, options, value, onChange }: FilterSelectProps) {
  const id = `filter-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <select
        id={id}
        className="input-base"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
