import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Space, Button, Tooltip, Modal, Select } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined, StopOutlined, UserOutlined, MailOutlined, CalendarOutlined, DollarOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useEmployees, useDisableEmployee, useEnableEmployee } from '../hooks/useEmployees';
import type { Employee } from '../types/employee';
import { formatUKCurrency } from '../types/employee';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

export function EmployeeList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: employees = [], isLoading } = useEmployees(showInactive ? undefined : true);
  const { mutate: disableEmployee, isPending: isDisabling } = useDisableEmployee();
  const { mutate: enableEmployee, isPending: isEnabling } = useEnableEmployee();

  const handleDisable = (id: number) => {
    Modal.confirm({
      title: t('employees.disableEmployee'),
      content: t('employees.confirmDisable'),
      okText: t('employees.disable'),
      okType: 'danger',
      onOk: () => {
        disableEmployee(id);
      },
    });
  };

  const handleEnable = (id: number) => {
    Modal.confirm({
      title: t('employees.enableEmployee'),
      content: t('employees.confirmEnable'),
      okText: t('employees.enable'),
      okType: 'primary',
      onOk: () => {
        enableEmployee(id);
      },
    });
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  // Filtrar funcionários
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = searchText === '' ||
        employee.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
        employee.job_title.toLowerCase().includes(searchText.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [employees, searchText]);

  const renderEmployeeCard = (employee: Employee) => {
    return (
      <Card
        key={employee.employee_id}
        style={{ marginBottom: '16px', cursor: 'pointer' }}
        hoverable
        onClick={() => navigate(`/employees/${employee.employee_id}`)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <UserOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          <Text strong style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>
            {employee.first_name} {employee.last_name}
          </Text>
          <Tag color={employee.is_active ? 'green' : 'red'}>
            {employee.is_active ? t('common.active') : t('common.inactive')}
          </Tag>
        </div>

        <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '12px' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('employees.jobTitle')}:
            </Text>
            <br />
            <Text>{employee.job_title}</Text>
          </div>

          {employee.email && (
            <div>
              <MailOutlined style={{ marginRight: '6px', color: '#8c8c8c' }} />
              <Text style={{ fontSize: '13px' }}>{employee.email}</Text>
            </div>
          )}

          <div>
            <DollarOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
            <Text strong style={{ color: '#52c41a' }}>
              {formatUKCurrency(employee.hourly_rate_pence)}/hr
            </Text>
          </div>

          <div>
            <CalendarOutlined style={{ marginRight: '6px', color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>
              {t('employees.startDate')}: {dayjs(employee.start_date).format('DD/MM/YYYY')}
            </Text>
          </div>
        </Space>

        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            paddingTop: '12px', 
            borderTop: '1px solid #f0f0f0',
            justifyContent: 'flex-end'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${employee.employee_id}/edit`);
            }}
          >
            {t('common.edit')}
          </Button>
          {employee.is_active ? (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDisable(employee.employee_id);
              }}
              loading={isDisabling}
            >
              {t('employees.disable')}
            </Button>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEnable(employee.employee_id);
              }}
              loading={isEnabling}
            >
              {t('employees.enable')}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const columns: ColumnsType<Employee> = [
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      align: 'center' as const,
      fixed: window.innerWidth >= 768 ? 'left' : undefined,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/employees/${record.employee_id}/edit`)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t('users.name'),
      key: 'name',
      dataIndex: 'first_name',
      width: 180,
      ellipsis: {
        showTitle: true,
      },
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: t('employees.jobTitle'),
      dataIndex: 'job_title',
      key: 'job_title',
      width: 150,
      ellipsis: true,
      responsive: ['lg'] as any,
    },
    {
      title: t('users.email'),
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      responsive: ['md'] as any,
    },
    {
      title: t('employees.hourlyRate'),
      key: 'hourly_rate',
      width: 120,
      align: 'right' as const,
      render: (_, record) => formatUKCurrency(record.hourly_rate_pence),
    },
    {
      title: t('common.status'),
      key: 'is_active',
      width: 120,
      align: 'center' as const,
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
      filters: [
        { text: t('common.active'), value: true },
        { text: t('common.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('employees.startDate'),
      key: 'start_date',
      width: 150,
      align: 'center' as const,
      render: (_, record) => dayjs(record.start_date).format('DD/MM/YYYY'),
      responsive: ['lg'] as any,
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <Title level={3} style={{ margin: 0 }}>{t('employees.title')}</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/employees/new')}
            >
              <span style={{ display: 'inline' }}>{t('employees.newEmployee')}</span>
            </Button>
          </div>

          <Space 
            size="middle" 
            style={{ width: '100%' }}
            direction="vertical"
          >
            <Search
              placeholder={t('employees.searchPlaceholder')}
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
            <Select
              placeholder={t('employees.showStatus')}
              style={{ width: '100%', minWidth: '200px' }}
              value={showInactive ? 'all' : 'active'}
              onChange={(value) => setShowInactive(value === 'all')}
              options={[
                { label: t('employees.activeOnly'), value: 'active' },
                { label: t('employees.allEmployees'), value: 'all' },
              ]}
            />
          </Space>

          {filteredEmployees.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">{t('employees.noEmployees')}</Text>
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="mobile-only">
                {filteredEmployees.map(renderEmployeeCard)}
              </div>

              {/* Desktop: Table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <Table
                  columns={columns}
                  dataSource={filteredEmployees}
                  rowKey="employee_id"
                  loading={isLoading}
                  tableLayout="fixed"
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    showTotal: (total) => t('employees.list', { count: total }),
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    },
                  }}
                  scroll={{ x: 1000, y: 600 }}
                />
              </div>
            </>
          )}

          <style>{`
            @media (max-width: 768px) {
              .desktop-only {
                display: none;
              }
              .mobile-only {
                display: block;
              }
            }
            @media (min-width: 769px) {
              .desktop-only {
                display: block;
              }
              .mobile-only {
                display: none;
              }
            }
          `}</style>
        </Space>
      </Card>

      {/* Modal de Detalhes do Funcionário */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ color: '#1890ff' }} />
            {selectedEmployee && `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {selectedEmployee && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Tag color={selectedEmployee.is_active ? 'green' : 'red'} style={{ marginBottom: '16px' }}>
                {selectedEmployee.is_active ? t('common.active') : t('common.inactive')}
              </Tag>
            </div>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" strong>{t('employees.jobTitle')}:</Text>
                <br />
                <Text>{selectedEmployee.job_title}</Text>
              </div>

              {selectedEmployee.email && (
                <div>
                  <Text type="secondary" strong>
                    <MailOutlined style={{ marginRight: '6px' }} />
                    {t('users.email')}:
                  </Text>
                  <br />
                  <Text>{selectedEmployee.email}</Text>
                </div>
              )}

              <div>
                <Text type="secondary" strong>
                  <DollarOutlined style={{ marginRight: '6px' }} />
                  {t('employees.hourlyRate')}:
                </Text>
                <br />
                <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                  {formatUKCurrency(selectedEmployee.hourly_rate_pence)}/hr
                </Text>
              </div>

              <div>
                <Text type="secondary" strong>
                  <CalendarOutlined style={{ marginRight: '6px' }} />
                  {t('employees.startDate')}:
                </Text>
                <br />
                <Text>{dayjs(selectedEmployee.start_date).format('DD/MM/YYYY')}</Text>
              </div>

              {selectedEmployee.end_date && (
                <div>
                  <Text type="secondary" strong>
                    <CalendarOutlined style={{ marginRight: '6px' }} />
                    {t('employees.endDate')}:
                  </Text>
                  <br />
                  <Text>{dayjs(selectedEmployee.end_date).format('DD/MM/YYYY')}</Text>
                </div>
              )}
            </Space>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '8px' }}>
              <Space size="middle">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleCloseModal();
                    navigate(`/employees/${selectedEmployee.employee_id}/edit`);
                  }}
                >
                  {t('common.edit')}
                </Button>
                {selectedEmployee.is_active ? (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => {
                      handleCloseModal();
                      handleDisable(selectedEmployee.employee_id);
                    }}
                    loading={isDisabling}
                  >
                    {t('employees.disable')}
                  </Button>
                ) : (
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      handleCloseModal();
                      handleEnable(selectedEmployee.employee_id);
                    }}
                    loading={isEnabling}
                  >
                    {t('employees.enable')}
                  </Button>
                )}
              </Space>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
