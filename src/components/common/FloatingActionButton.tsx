import { FloatButton } from 'antd';
import { useState, useEffect } from 'react';
import type { FloatButtonProps } from 'antd';

interface FloatingActionButtonProps extends Omit<FloatButtonProps, 'style'> {
  /** Apenas exibe o botão no mobile (< 768px) */
  mobileOnly?: boolean;
}

/**
 * Componente de Floating Action Button (FAB) reutilizável
 * Usa o FloatButton do Ant Design
 * Pode ser configurado para aparecer apenas no mobile
 */
export function FloatingActionButton({
  mobileOnly = false,
  ...props
}: FloatingActionButtonProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (mobileOnly) {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [mobileOnly]);

  // Se for mobileOnly e não estiver no mobile, não renderiza
  if (mobileOnly && !isMobile) {
    return null;
  }

  return (
    <FloatButton
      type="primary"
      style={{
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
      }}
      {...props}
    />
  );
}
