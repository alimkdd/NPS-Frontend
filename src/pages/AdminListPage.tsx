import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import { adminAuth } from '../lib/auth';
import { ApiError, type SubscriptionFilter } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/Skeleton';

export function AdminListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<SubscriptionFilter>({ page: 1, pageSize: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const lookupsQuery = useQuery({
    queryKey: ['lookups'],
    queryFn: ({ signal }) => api.getLookups(signal),
  });

  const statsQuery = useQuery({
    queryKey: ['adminStats'],
    queryFn: ({ signal }) => api.getStats(signal),
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
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
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
  const hasFilters =
    !!filter.searchTerm ||
    !!filter.subscriberTypeId ||
    !!filter.communicationPreferenceId ||
    !!filter.interestId;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Live (non-deleted) subscribers. Use filters and search to narrow the list.
          </p>
        </div>
        <Button
          variant="secondary"
          leadingIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<UsersIcon className="h-4 w-4" />}
          label="Total active"
          value={statsQuery.data?.totalActive ?? 0}
          loading={statsQuery.isLoading}
          accent="brand"
        />
        <StatCard
          icon={<CalendarDaysIcon className="h-4 w-4" />}
          label="Last 7 days"
          value={statsQuery.data?.newLast7Days ?? 0}
          hint="New signups"
          loading={statsQuery.isLoading}
          accent="emerald"
        />
        <StatCard
          icon={<UserGroupIcon className="h-4 w-4" />}
          label="Last 30 days"
          value={statsQuery.data?.newLast30Days ?? 0}
          hint="New signups"
          loading={statsQuery.isLoading}
          accent="amber"
        />
      </div>

      <Card padded={false}>
        <form
          className="flex flex-wrap items-end gap-3 p-4 border-b border-muted"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilter({ searchTerm: searchInput || undefined });
          }}
        >
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="search" className="block text-xs font-medium text-subtle mb-1">
              Search
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input
                id="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or email…"
                className="input-base pl-9"
              />
            </div>
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
          <Button type="submit">Apply</Button>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput('');
                setFilter({ page: 1, pageSize: 10 });
              }}
            >
              Reset
            </Button>
          )}
        </form>

        {deleteError && (
          <div className="px-4 pt-4">
            <Alert tone="error">{deleteError}</Alert>
          </div>
        )}

        {listQuery.isLoading ? (
          <table className="min-w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))}
            </tbody>
          </table>
        ) : listQuery.isError ? (
          <div className="p-4">
            <Alert tone="error" title="Couldn’t load subscriptions">
              {listQuery.error instanceof ApiError ? listQuery.error.message : 'Unexpected error.'}
            </Alert>
          </div>
        ) : !result || result.items.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-7 w-7" />}
            title="No subscriptions match"
            description={
              hasFilters
                ? 'Try clearing the filters or broadening your search.'
                : 'Once people subscribe, they’ll appear here.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchInput('');
                    setFilter({ page: 1, pageSize: 10 });
                  }}
                >
                  Reset filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Subscriber</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Channels</th>
                  <th className="px-4 py-3 font-semibold">Interests</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.items.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {sub.firstName} {sub.lastName}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-subtle mt-0.5">
                        <EnvelopeIcon className="h-3 w-3 flex-none" />
                        <span className="truncate">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="pill">{sub.subscriberType.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sub.communicationPreferences.map((c) => (
                          <span key={c.id} className="pill">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sub.interests.map((i) => (
                          <span key={i.id} className="pill">
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-subtle whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<TrashIcon className="h-4 w-4" />}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Soft-delete ${sub.email}? They will stop receiving newsletters.`,
                            )
                          ) {
                            deleteMutation.mutate(sub.id);
                          }
                        }}
                        loading={
                          deleteMutation.isPending && deleteMutation.variables === sub.id
                        }
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
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-muted text-sm">
            <span className="text-subtle">
              Page {result.page} of {totalPages} —{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {result.totalCount}
              </span>{' '}
              subscriber{result.totalCount === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={result.page <= 1}
                onClick={() => setPage(result.page - 1)}
                leadingIcon={<ArrowLeftIcon className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={result.page >= totalPages}
                onClick={() => setPage(result.page + 1)}
                trailingIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
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
    <div className="w-full sm:w-44">
      <label htmlFor={id} className="block text-xs font-medium text-subtle mb-1">
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
