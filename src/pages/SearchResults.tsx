import { useState, useMemo } from 'react';
import {
  Typography,
  Space,
  Card,
  List,
  Tag,
  Radio,
  Empty,
  Spin,
  Alert,
} from 'antd';
import {
  ShoppingCartOutlined,
  ToolOutlined,
  CarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetApiSearch } from '../api/generated/search/search';
import type { SearchResult } from '../api/generated/models/searchResult';
import type { SearchResultType } from '../api/generated/models/searchResultType';

const { Title, Text } = Typography;

export function SearchResults() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<SearchResultType | 'all'>('all');

  // Busca na API
  const { data, isLoading, error } = useGetApiSearch(
    { q: searchQuery },
    {
      query: {
        enabled: !!searchQuery.trim()
      }
    }
  );

  const searchData = data?.data;

  const handleResultClick = (type: string, id: string) => {
    const routes: Record<string, string> = {
      product: '/produtos',
      service: '/servicos',
      vehicle: '/veiculos',
      serviceOrder: '/servicos', // Ordens de serviço vão para a rota de serviços
    };

    const basePath = routes[type];
    if (basePath) {
      navigate(`${basePath}/${id}`);
    }
  };

  // Combinar todos os resultados da API
  const allResults: SearchResult[] = useMemo(() => {
    if (!searchData?.results) return [];

    return [
      ...(searchData.results.products || []),
      ...(searchData.results.services || []),
      ...(searchData.results.vehicles || []),
      ...(searchData.results.serviceOrders || []),
    ];
  }, [searchData]);

  const filteredResults = useMemo(() => {
    let results = allResults;

    // Filtrar por tipo
    if (selectedType !== 'all') {
      results = results.filter((r) => r.type === selectedType);
    }

    return results;
  }, [allResults, selectedType]);

  const getIcon = (type: SearchResultType) => {
    switch (type) {
      case 'product':
        return <ShoppingCartOutlined />;
      case 'service':
        return <ToolOutlined />;
      case 'vehicle':
        return <CarOutlined />;
      case 'serviceOrder':
        return <FileTextOutlined />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: SearchResultType) => {
    switch (type) {
      case 'product':
        return 'blue';
      case 'service':
        return 'green';
      case 'vehicle':
        return 'orange';
      case 'serviceOrder':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: SearchResultType) => {
    switch (type) {
      case 'product':
        return t('menu.products');
      case 'service':
        return t('menu.services');
      case 'vehicle':
        return t('search.vehicles');
      case 'serviceOrder':
        return t('search.serviceOrders');
      default:
        return '';
    }
  };

  const handleItemClick = (result: SearchResult) => {
    // Navegar para a página de detalhes correspondente
    handleResultClick(result.type, result.id);
  };

  const typeFilters = [
    { label: t('search.all'), value: 'all' },
    { label: t('menu.products'), value: 'product' },
    { label: t('menu.services'), value: 'service' },
    { label: t('search.vehicles'), value: 'vehicle' },
    { label: t('search.serviceOrders'), value: 'serviceOrder' },
  ];

  // Mostrar mensagem se não há query
  if (!searchQuery.trim()) {
    return (
      <div>
        <Title level={2}>{t('search.title')}</Title>
        <Card>
          <Empty description={t('search.emptyStateDescription')} />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>{t('search.resultsTitle')}</Title>
          <Text type="secondary">{t('search.searchingFor', { query: searchQuery })}</Text>
        </div>

        {!!error && (
          <Alert
            message={t('search.errorTitle')}
            description={t('search.errorDescription')}
            type="error"
            showIcon
          />
        )}

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>{t('search.filterByType')}</Text>
              <Radio.Group
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{ marginTop: 8, display: 'block' }}
              >
                <Space wrap>
                  {typeFilters.map((filter) => (
                    <Radio.Button key={filter.value} value={filter.value}>
                      {filter.label}
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            <div>
              <Text type="secondary">
                {searchData ? t('search.resultsCount', { count: filteredResults.length, total: searchData.total || 0 }) : t('search.loading')}
              </Text>
            </div>
          </Space>
        </Card>

        {isLoading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          </Card>
        ) : filteredResults.length === 0 ? (
          <Card>
            <Empty description={t('search.noResultsFound')} />
          </Card>
        ) : selectedType === 'all' ? (
          // Visualização agrupada por tipo (estilo YouTube)
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {(['product', 'service', 'vehicle', 'serviceOrder'] as SearchResultType[]).map((type) => {
              const typeResults = filteredResults.filter((r) => r.type === type);
              if (typeResults.length === 0) return null;

              return (
                <div key={type}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    {getTypeLabel(type)}
                  </Title>
                  <List
                    dataSource={typeResults}
                    renderItem={(item) => (
                      <List.Item
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleItemClick(item)}
                      >
                        <Card
                          hoverable
                          style={{ width: '100%' }}
                          bodyStyle={{ padding: 16 }}
                        >
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div
                              style={{
                                fontSize: 32,
                                color: `var(--ant-${getTypeColor(item.type)}-color)`,
                              }}
                            >
                              {getIcon(item.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <div>
                                  <Title level={5} style={{ margin: 0 }}>
                                    {item.title}
                                  </Title>
                                  <Tag
                                    icon={getIcon(item.type)}
                                    color={getTypeColor(item.type)}
                                    style={{ marginTop: 4 }}
                                  >
                                    {getTypeLabel(item.type)}
                                  </Tag>
                                </div>
                                {item.description && (
                                  <Text type="secondary">{item.description}</Text>
                                )}
                                {item.subtitle && (
                                  <Text strong style={{ color: '#1890ff' }}>
                                    {item.subtitle}
                                  </Text>
                                )}
                              </Space>
                            </div>
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              );
            })}
          </Space>
        ) : (
          // Visualização em grid quando filtrado por tipo específico
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={filteredResults}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  onClick={() => handleItemClick(item)}
                  style={{ height: '100%' }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Tag
                        icon={getIcon(item.type)}
                        color={getTypeColor(item.type)}
                      >
                        {getTypeLabel(item.type)}
                      </Tag>
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      {item.title}
                    </Title>
                    {item.description && (
                      <Text type="secondary">{item.description}</Text>
                    )}
                    {item.subtitle && (
                      <Text strong style={{ color: '#1890ff' }}>
                        {item.subtitle}
                      </Text>
                    )}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Space>
    </div>
  );
}
