import { Outlet } from 'react-router-dom';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { ShortcutsModal } from '@/components/shared/ShortcutsModal';
import { ToastContainer } from '@/components/shared/Toast';
import { OnboardingWizard } from '@/components/shared/OnboardingWizard';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { user } = useAuthStore();
  return (
    <>
      <Outlet />
      <GlobalSearch />
      <ShortcutsModal />
      <ToastContainer />
      {user?.role === 'admin' && <OnboardingWizard />}
    </>
  );
}
