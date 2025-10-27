import { ConfigProvider, App as AntdApp, theme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/errors';
import { useThemeStore } from './store/theme-store';
import { router } from './routes';

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
            <RouterProvider router={router} />
          </AntdApp>
        </ConfigProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
