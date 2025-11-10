import { ConfigProvider, App as AntdApp, theme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/errors';
import { useThemeStore } from './store/theme-store';
import { router } from './routes';
import { setNotificationInstance } from './services/notification.service';
import { useEffect } from 'react';

function AppContent() {
  const { notification } = AntdApp.useApp();

  useEffect(() => {
    // Inicializa a instância de notificação para uso em toda a aplicação
    setNotificationInstance(notification);
  }, [notification]);

  return <RouterProvider router={router} />;
}

function App() {
  const { mode } = useThemeStore();

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ConfigProvider
          locale={ptBR}
          theme={{
            algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
          }}
        >
          <AntdApp>
            <AppContent />
          </AntdApp>
        </ConfigProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
