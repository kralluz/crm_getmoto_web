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
} from 'antd';
import {
  ShoppingCartOutlined,
  ToolOutlined,
  UserOutlined,
  CarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { SearchResult, SearchResultType } from '../types/search';

const { Title, Text } = Typography;

export function SearchResults() {
  const { t } = useTranslation();
  // const [searchParams] = useSearchParams();
  // TODO: Usar searchQuery para filtrar resultados
  // const searchQuery = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<SearchResultType | 'all'>('all');
  const [isLoading] = useState(false);

  const handleResultClick = (type: string, id: string) => {
    const routes: Record<string, string> = {
      product: '/produtos',
      service: '/servicos',
      client: '/clientes',
      vehicle: '/veiculos',
    };

    const basePath = routes[type];
    if (basePath) {
      navigate(`${basePath}/${id}`);
    }
  };

  // Mock data - substituir por chamada real à API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'product',
      title: 'Óleo Motul 5W30',
      description: 'Óleo sintético premium para motores',
      subtitle: 'R$ 89,90',
      metadata: { stock: 15, category: 'Lubrificantes' },
    },
    {
      id: '2',
      type: 'service',
      title: 'Troca de Óleo Completa',
      description: 'Inclui óleo, filtro e mão de obra',
      subtitle: 'R$ 150,00',
      metadata: { duration: '30min' },
    },
    {
      id: '3',
      type: 'client',
      title: 'João Silva',
      description: 'joao.silva@email.com',
      subtitle: '(11) 98765-4321',
      metadata: { cpf: '123.456.789-00' },
    },
    {
      id: '4',
      type: 'vehicle',
      title: 'Honda CG 160',
      description: 'Placa: ABC-1234',
      subtitle: 'Ano: 2020',
      metadata: { color: 'Vermelho', owner: 'João Silva' },
    },
    {
      id: '5',
      type: 'serviceOrder',
      title: 'OS #1234',
      description: 'Revisão completa - Honda CG 160',
      subtitle: 'Em andamento',
      metadata: { clientName: 'João Silva', total: 450.00 },
    },
  ];

  const filteredResults = useMemo(() => {
    let results = mockResults;

    // Filtrar por tipo
    if (selectedType !== 'all') {
      results = results.filter((r) => r.type === selectedType);
    }

    return results;
  }, [selectedType]);

  const getIcon = (type: SearchResultType) => {
    switch (type) {
      case 'product':
        return <ShoppingCartOutlined />;
      case 'service':
        return <ToolOutlined />;
      case 'client':
        return <UserOutlined />;
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
      case 'client':
        return 'purple';
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
      case 'client':
        return t('menu.clients');
      case 'vehicle':
        return 'Veículos';
      case 'serviceOrder':
        return 'Ordens de Serviço';
      default:
        return '';
    }
  };

  const handleItemClick = (result: SearchResult) => {
    // Navegar para a página de detalhes correspondente
    handleResultClick(result.type, result.id);
  };

  const typeFilters = [
    { label: 'Todos', value: 'all' },
    { label: t('menu.products'), value: 'product' },
    { label: t('menu.services'), value: 'service' },
    { label: t('menu.clients'), value: 'client' },
    { label: 'Veículos', value: 'vehicle' },
    { label: 'Ordens de Serviço', value: 'serviceOrder' },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Resultados da Busca</Title>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Filtrar por tipo:</Text>
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
                {filteredResults.length} resultado(s) encontrado(s)
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
            <Empty description="Nenhum resultado encontrado" />
          </Card>
        ) : selectedType === 'all' ? (
          // Visualização agrupada por tipo (estilo YouTube)
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {(['product', 'service', 'client', 'vehicle', 'serviceOrder'] as SearchResultType[]).map((type) => {
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
