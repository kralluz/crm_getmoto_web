import { useState, useEffect } from 'react';
import { FloatButton, Tooltip } from 'antd';
import { PlusOutlined, SwapOutlined } from '@ant-design/icons';

interface FloatingActionButtonWithMenuProps {
  onNew: () => void;
  onMovement: () => void;
  newTooltip: string;
  movementTooltip: string;
  mobileOnly?: boolean;
}

export function FloatingActionButtonWithMenu({
  onNew,
  onMovement,
  newTooltip,
  movementTooltip,
  mobileOnly = true,
}: FloatingActionButtonWithMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const handleMainClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNew = () => {
    setIsMenuOpen(false);
    onNew();
  };

  const handleMovement = () => {
    setIsMenuOpen(false);
    onMovement();
  };

  return (
    <>
      {/* Menu de opções */}
      {isMenuOpen && (
        <>
          <FloatButton
            icon={<PlusOutlined />}
            tooltip={newTooltip}
            onClick={handleNew}
            style={{
              right: 24,
              bottom: 160,
              width: 48,
              height: 48,
            }}
          />
          <FloatButton
            icon={<SwapOutlined />}
            tooltip={movementTooltip}
            onClick={handleMovement}
            style={{
              right: 24,
              bottom: 100,
              width: 48,
              height: 48,
            }}
          />
        </>
      )}

      {/* Botão principal */}
      <FloatButton
        type="primary"
        icon={
          <PlusOutlined
            style={{
              transform: isMenuOpen ? 'rotate(45deg)' : 'none',
              transition: 'transform 0.3s',
            }}
          />
        }
        tooltip={isMenuOpen ? 'Fechar' : 'Opções'}
        onClick={handleMainClick}
        style={{
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
        }}
      />
    </>
  );
}

