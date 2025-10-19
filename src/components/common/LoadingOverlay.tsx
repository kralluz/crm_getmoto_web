import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';

export interface LoadingOverlayProps {
  loading?: boolean;
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
}

/**
 * Componente de loading overlay
 * Pode ser usado como fullscreen ou inline
 */
export function LoadingOverlay({
  loading = true,
  tip,
  size = 'large',
  fullScreen = false,
}: LoadingOverlayProps) {
  const { t } = useTranslation();

  if (!loading) return null;

  const spinElement = (
    <Spin
      size={size}
      tip={tip || t('common.loading')}
    />
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        {spinElement}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px',
      }}
    >
      {spinElement}
    </div>
  );
}
