import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { adminSession } from '../lib/session';
import { ApiError, type SubscriptionFilter, type SubscriptionResponse } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function AdminListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<SubscriptionFilter>({ page: 1, pageSize: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [target, setTarget] = useState<SubscriptionResponse | null>(null);

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
    onSuccess: (_, id) => {
      const removed = target;
      setTarget(null);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success('Subscription removed', {
        description: removed
          ? `${removed.firstName} ${removed.lastName} (${removed.email}) will stop receiving newsletters.`
          : `Subscription ${id} was removed.`,
      });
    },
    onError: (err) => {
      toast.error("Couldn't delete", {
        description: err instanceof ApiError ? err.message : 'Unexpected error.',
      });
    },
  });

  function applyFilter(next: Partial<SubscriptionFilter>) {
    setFilter((current) => ({ ...current, ...next, page: 1 }));
  }

  function setPage(page: number) {
    setFilter((current) => ({ ...current, page }));
  }

  function handleSignOut() {
    adminSession.clear();
    toast.success('Signed out');
    navigate('/admin', { replace: true });
  }

  if (listQuery.isError && listQuery.error instanceof ApiError && listQuery.error.isUnauthorized) {
    adminSession.clear();
    navigate('/admin', { replace: true });
    return null;
  }

  const result = listQuery.data;
  const totalPages = result && result.pageSize > 0
    ? Math.max(1, Math.ceil(result.totalCount / result.pageSize))
    : 1;
  const hasFilters =
    !!filter.searchTerm ||
    !!filter.subscriberTypeId ||
    !!filter.communicationPreferenceId ||
    !!filter.interestId;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-2">
            Subscriptions
          </h1>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Live (non-deleted) subscribers. Use filters and search to narrow the list.
          </p>
        </div>
        <Button
          variant="secondary"
          leadingIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
          onClick={handleSignOut}
          className="!bg-slate-200 dark:!bg-midnight-600 hover:!bg-slate-300 dark:hover:!bg-midnight-500 !border-slate-400 dark:!border-midnight-500"
        >
          Sign out
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
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
          className="flex flex-wrap items-end gap-4 p-5 border-b border-muted"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilter({ searchTerm: searchInput || undefined });
          }}
        >
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="search" className="block text-xs font-medium text-subtle mb-1.5">
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
                placeholder="Name or email..."
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
          <Button type="submit">Search</Button>
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

        {listQuery.isLoading ? (
          <table className="min-w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))}
            </tbody>
          </table>
        ) : listQuery.isError ? (
          <div className="p-5">
            <Alert tone="error" title="Couldn't load subscriptions">
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
                : "Once people subscribe, they'll appear here."
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
            <table className="min-w-full divide-y divide-slate-200 dark:divide-midnight-800 text-sm">
              <thead className="bg-slate-50 dark:bg-midnight-800/50 text-left text-xs uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-5 py-4 font-semibold">Subscriber</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Channels</th>
                  <th className="px-5 py-4 font-semibold">Interests</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-midnight-800">
                {result.items.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50 dark:hover:bg-midnight-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {sub.firstName} {sub.lastName}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-subtle mt-1">
                        <EnvelopeIcon className="h-3 w-3 flex-none" />
                        <span className="truncate">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="pill">{sub.subscriberType.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {sub.communicationPreferences.map((c) => (
                          <span key={c.id} className="pill">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {sub.interests.map((i) => (
                          <span key={i.id} className="pill">
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-subtle whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        leadingIcon={<TrashIcon className="h-4 w-4" />}
                        onClick={() => setTarget(sub)}
                        aria-label={`Delete subscription for ${sub.email}`}
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
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-muted text-sm">
            <span className="text-subtle">
              Page {result.page} of {totalPages} —{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {result.items.length}
              </span>{' '}
              of{' '}
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

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() => target && deleteMutation.mutate(target.id)}
        loading={deleteMutation.isPending}
        title="Delete this subscription?"
        confirmLabel="Yes, delete"
        cancelLabel="Keep subscription"
        tone="danger"
        description={
          target && (
            <div className="space-y-2">
              <p>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {target.firstName} {target.lastName}
                </span>{' '}
                <span className="text-subtle">({target.email})</span> will stop receiving
                newsletters.
              </p>
              <p className="text-xs text-subtle">
                This is a soft delete — the record stays in the database, just hidden from
                the active list.
              </p>
            </div>
          )
        }
      />
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
      <label htmlFor={id} className="block text-xs font-medium text-subtle mb-1.5">
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
