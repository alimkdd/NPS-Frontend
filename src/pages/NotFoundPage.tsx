import { Link } from 'react-router-dom';
import { MapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="max-w-lg mx-auto">
      <EmptyState
        icon={<MapIcon className="h-7 w-7" />}
        title="Page not found"
        description="We couldn’t find what you were looking for. Maybe the link is old, or maybe we never had it."
        action={
          <Link to="/">
            <Button leadingIcon={<ArrowLeftIcon className="h-4 w-4" />}>Go home</Button>
          </Link>
        }
      />
    </div>
  );
}
