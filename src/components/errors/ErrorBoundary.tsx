import { Component } from 'react';
import type { ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { componentLogger } from '../../utils/logger';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary para capturar erros em componentes React
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // Com fallback customizado
 * <ErrorBoundary
 *   fallback={(error, errorInfo, reset) => (
 *     <CustomErrorUI error={error} onReset={reset} />
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Atualiza o state para exibir o fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log do erro
    componentLogger.error(
      'React Error Boundary caught an error',
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
      }
    );

    // Atualiza o state com informações completas do erro
    this.setState({
      errorInfo,
    });

    // Callback customizado de erro
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Enviar para serviço de tracking (Sentry, LogRocket)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   });
    // }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    componentLogger.info('Error boundary reset');
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Renderiza fallback customizado se fornecido
      if (fallback) {
        return fallback(error, errorInfo!, this.resetError);
      }

      // Renderiza fallback padrão
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo!}
          resetError={this.resetError}
        />
      );
    }

    return children;
  }
}
