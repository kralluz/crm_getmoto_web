import { useState } from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../layouts';
import { Settings } from './Settings';
import { DashboardFinanceiro } from './DashboardFinanceiro';
import { TransactionForm } from './TransactionForm';
import { ProductList } from './ProductList';
import { ServiceList } from './ServiceList';
import { SearchResults } from './SearchResults';
import { ProductDetail } from './ProductDetail';
import { ClientDetail } from './ClientDetail';
import { VehicleDetail } from './VehicleDetail';
import { ServiceOrderDetail } from './ServiceOrderDetail';

const { Title } = Typography;

export function Home() {
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [detailView, setDetailView] = useState<{
    type: 'product' | 'client' | 'vehicle' | 'serviceOrder' | null;
    id: string | null;
  }>({ type: null, id: null });
  const { t } = useTranslation();

  const handleSearch = (_query: string) => {
    setSelectedMenu('search');
    setDetailView({ type: null, id: null });
  };

  const handleBackToSearch = () => {
    setDetailView({ type: null, id: null });
  };

  const handleResultClick = (type: string, id: string) => {
    setDetailView({
      type: type as 'product' | 'client' | 'vehicle' | 'serviceOrder',
      id,
    });
  };

  const renderContent = () => {
    // Se estiver em uma página de detalhes
    if (detailView.type && detailView.id) {
      switch (detailView.type) {
        case 'product':
          return <ProductDetail productId={detailView.id} onBack={handleBackToSearch} />;
        case 'client':
          return <ClientDetail clientId={detailView.id} onBack={handleBackToSearch} />;
        case 'vehicle':
          return <VehicleDetail vehicleId={detailView.id} onBack={handleBackToSearch} />;
        case 'serviceOrder':
          return <ServiceOrderDetail orderId={detailView.id} onBack={handleBackToSearch} />;
        default:
          return null;
      }
    }

    // Páginas normais
    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardFinanceiro />;
      case 'transacao':
        return <TransactionForm />;
      case 'search':
        return <SearchResults onResultClick={handleResultClick} />;
      case 'clientes':
        return (
          <div>
            <Title level={2}>{t('menu.clients')}</Title>
            <p>{t('menu.clients')} - Em desenvolvimento</p>
          </div>
        );
      case 'produtos':
        return <ProductList />;
      case 'servicos':
        return <ServiceList />;
      case 'configuracoes':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <MainLayout
      selectedMenu={selectedMenu}
      onMenuSelect={setSelectedMenu}
      onSearch={handleSearch}
    >
      {renderContent()}
    </MainLayout>
  );
}
