import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
      <p className="text-7xl font-black text-primary-500">404</p>
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Page not found</h1>
      <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );
}
