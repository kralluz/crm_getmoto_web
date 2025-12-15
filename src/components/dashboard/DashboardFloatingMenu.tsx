import { useState, useEffect } from 'react';
import { FloatButton } from 'antd';
import { PlusOutlined, ToolOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function DashboardFloatingMenu() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Não renderiza em desktop
    if (!isMobile) {
        return null;
    }

    const handleMainClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleServiceOrder = () => {
        setIsMenuOpen(false);
        navigate('/servicos?openModal=true');
    };

    const handlePurchaseOrder = () => {
        setIsMenuOpen(false);
        navigate('/estoque?openModal=true');
    };

    const handleExpense = () => {
        setIsMenuOpen(false);
        navigate('/despesas?openModal=true');
    };

    return (
        <>
            {/* Menu de opções */}
            {isMenuOpen && (
                <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 999 }}>
                    <FloatButton
                        icon={<ToolOutlined />}
                        tooltip={t('services.newServiceOrder')}
                        onClick={handleServiceOrder}
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 196,
                            width: 48,
                            height: 48,
                        }}
                    />
                    <FloatButton
                        icon={<ShoppingCartOutlined />}
                        tooltip={t('inventory.newPurchaseOrder')}
                        onClick={handlePurchaseOrder}
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 136,
                            width: 48,
                            height: 48,
                        }}
                    />
                    <FloatButton
                        icon={<DollarOutlined />}
                        tooltip={t('expenses.newExpense')}
                        onClick={handleExpense}
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 76,
                            width: 48,
                            height: 48,
                        }}
                    />
                </div>
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
                tooltip={isMenuOpen ? t('common.close') : t('common.add')}
                onClick={handleMainClick}
                style={{
                    right: 24,
                    bottom: 24,
                    width: 56,
                    height: 56,
                    zIndex: 1000,
                }}
            />
        </>
    );
}
