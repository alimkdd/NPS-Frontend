import { Toaster } from 'sonner';
import { useTheme } from '../../lib/theme';

export function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        style: {
          fontFamily: 'inherit',
          borderRadius: '0.75rem',
        },
      }}
    />
  );
}
