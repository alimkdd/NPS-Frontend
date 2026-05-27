import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

type Tone = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  loading?: boolean;
}

const toneStyles: Record<Tone, { iconBg: string; iconColor: string }> = {
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-500/15',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    iconBg: 'bg-brand-100 dark:bg-brand-500/15',
    iconColor: 'text-brand-600 dark:text-brand-400',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const { iconBg, iconColor } = toneStyles[tone];
  const confirmVariant = tone === 'danger' ? 'danger' : 'primary';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={loading ? () => {} : onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative w-full max-w-md rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-midnight-700 p-6 shadow-card-lg">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-midnight-800 hover:text-slate-700 dark:hover:text-slate-200 transition disabled:cursor-not-allowed"
                aria-label="Close dialog"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
                >
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 pr-8">
                  <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description as="div" className="mt-1.5 text-sm text-muted">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  variant={confirmVariant}
                  onClick={onConfirm}
                  loading={loading}
                >
                  {confirmLabel}
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
