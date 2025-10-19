import { ConfigProvider, App as AntdApp, theme } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/errors';
import { Home } from './pages/Home';
import { useThemeStore } from './store/theme-store';

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
            <Home />
          </AntdApp>
        </ConfigProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
