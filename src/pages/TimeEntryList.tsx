import { Table, Button, Space, Card, Typography, Select, DatePicker, Modal, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTimeEntries, useDeleteTimeEntry } from '../hooks/useTimeEntries';
import { useEmployees } from '../hooks/useEmployees';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { TimeEntry } from '../types/time-entry';
import { useTranslation } from 'react-i18next';
import { formatHours } from '../utils/format-hours';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function TimeEntryList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: employees = [] } = useEmployees(true);
  const { data: timeEntries = [], isLoading } = useTimeEntries({
    employee_id: employeeId,
    start_date: dateRange?.[0],
    end_date: dateRange?.[1],
  });
  const deleteTimeEntry = useDeleteTimeEntry();

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('timeEntries.delete'),
      content: t('timeEntries.confirmDelete'),
      okText: t('common.delete'),
      okType: 'danger',
      onOk: async () => {
        await deleteTimeEntry.mutateAsync(id);
      },
    });
  };

  const handleViewDetails = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const renderTimeEntryCard = (entry: TimeEntry) => {
    const employee = employees.find((e) => e.employee_id === entry.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${entry.employee_id}`;

    return (
      <Card
        key={entry.time_entry_id}
        style={{ marginBottom: '16px', cursor: 'pointer' }}
        hoverable
        onClick={() => navigate(`/time-entries/${entry.time_entry_id}/edit`)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: '16px', whiteSpace: 'normal', wordBreak: 'normal' }}>{employeeName}</Text>
        </div>
        
        <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '12px' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('timeEntries.clockInTime')}:
            </Text>
            <br />
            <ClockCircleOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
            <Text>{dayjs(entry.clock_in).format('DD/MM/YYYY HH:mm')}</Text>
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('timeEntries.clockOutTime')}:
            </Text>
            <br />
            {entry.clock_out ? (
              <>
                <ClockCircleOutlined style={{ marginRight: '6px', color: '#ff4d4f' }} />
                <Text>{dayjs(entry.clock_out).format('DD/MM/YYYY HH:mm')}</Text>
              </>
            ) : (
              <Text style={{ marginLeft: '22px' }}>-</Text>
            )}
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('timeEntries.totalHours')}:
            </Text>
            <br />
            <Tag color={entry.total_hours ? 'green' : 'orange'} style={{ marginTop: '4px' }}>
              {entry.total_hours ? formatHours(entry.total_hours) : '-'} hrs
            </Tag>
          </div>

          {entry.notes && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('common.notes')}:
              </Text>
              <br />
              <Text style={{ fontSize: '13px' }}>{entry.notes}</Text>
            </div>
          )}
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
              navigate(`/time-entries/${entry.time_entry_id}/edit`);
            }}
          >
            {t('common.edit')}
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(entry.time_entry_id);
            }}
            loading={deleteTimeEntry.isPending}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Card>
    );
  };

  const columns: ColumnsType<TimeEntry> = [
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
              onClick={() => navigate(`/time-entries/${record.time_entry_id}/edit`)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t('timeEntries.employee'),
      key: 'employee',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        const employee = employees.find((e) => e.employee_id === record.employee_id);
        return employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${record.employee_id}`;
      },
    },
    {
      title: t('timeEntries.clockInTime'),
      dataIndex: 'clock_in',
      key: 'clock_in',
      width: 150,
      align: 'center' as const,
      render: (datetime) => (
        <>
          <div>{dayjs(datetime).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{dayjs(datetime).format('HH:mm')}</div>
        </>
      ),
    },
    {
      title: t('timeEntries.clockOutTime'),
      dataIndex: 'clock_out',
      key: 'clock_out',
      width: 150,
      align: 'center' as const,
      render: (datetime) => datetime ? (
        <>
          <div>{dayjs(datetime).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{dayjs(datetime).format('HH:mm')}</div>
        </>
      ) : '-',
    },
    {
      title: t('timeEntries.totalHours'),
      dataIndex: 'total_hours',
      key: 'total_hours',
      width: 120,
      align: 'center' as const,
      render: (hours) => (
        <Tag color={hours ? 'green' : 'orange'}>{hours ? formatHours(hours) : '-'} hrs</Tag>
      ),
    },
    {
      title: t('common.notes'),
      dataIndex: 'notes',
      key: 'notes',
      width: 250,
      ellipsis: {
        showTitle: true,
      },
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
            <Title level={3} style={{ margin: 0 }}>{t('timeEntries.title')}</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/time-entries/new')}
            >
              <span style={{ display: 'inline' }}>{t('timeEntries.newEntry')}</span>
            </Button>
          </div>

          <Space 
            size="middle" 
            style={{ width: '100%', flexWrap: 'wrap' }}
            direction="vertical"
          >
            <Select
              placeholder={t('timeEntries.filterByEmployee')}
              allowClear
              style={{ width: '100%', minWidth: '200px' }}
              onChange={(value) => setEmployeeId(value)}
              options={employees.map((emp) => ({
                label: `${emp.first_name} ${emp.last_name}`,
                value: emp.employee_id,
              }))}
            />
            <RangePicker
              placeholder={[t('timeEntries.startDate'), t('timeEntries.endDate')]}
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([
                    dates[0]!.format('YYYY-MM-DD'),
                    dates[1]!.format('YYYY-MM-DD'),
                  ]);
                } else {
                  setDateRange(undefined);
                }
              }}
            />
          </Space>

          {timeEntries.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">{t('timeEntries.noEntries')}</Text>
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="mobile-only">
                {timeEntries.map(renderTimeEntryCard)}
              </div>

              {/* Desktop: Table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <Table
                  columns={columns}
                  dataSource={timeEntries}
                  rowKey="time_entry_id"
                  loading={isLoading}
                  tableLayout="fixed"
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50'],
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

      {/* Modal de Detalhes do Registro de Ponto */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockCircleOutlined style={{ color: '#1890ff' }} />
            {t('timeEntries.details')}
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {selectedEntry && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text strong style={{ fontSize: '16px' }}>
                  {(() => {
                    const employee = employees.find((e) => e.employee_id === selectedEntry.employee_id);
                    return employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${selectedEntry.employee_id}`;
                  })()}
                </Text>
              </div>
              <Tag color={selectedEntry.total_hours ? 'green' : 'orange'}>
                {selectedEntry.total_hours ? `${formatHours(selectedEntry.total_hours)} hrs` : t('timeEntries.inProgress')}
              </Tag>
            </div>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" strong>
                  <ClockCircleOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
                  {t('timeEntries.clockInTime')}:
                </Text>
                <br />
                <Text strong style={{ fontSize: '15px' }}>
                  {dayjs(selectedEntry.clock_in).format('DD/MM/YYYY')}
                </Text>
                <Text style={{ marginLeft: '12px', color: '#52c41a' }}>
                  {dayjs(selectedEntry.clock_in).format('HH:mm')}
                </Text>
              </div>

              <div>
                <Text type="secondary" strong>
                  <ClockCircleOutlined style={{ marginRight: '6px', color: '#ff4d4f' }} />
                  {t('timeEntries.clockOutTime')}:
                </Text>
                <br />
                {selectedEntry.clock_out ? (
                  <>
                    <Text strong style={{ fontSize: '15px' }}>
                      {dayjs(selectedEntry.clock_out).format('DD/MM/YYYY')}
                    </Text>
                    <Text style={{ marginLeft: '12px', color: '#ff4d4f' }}>
                      {dayjs(selectedEntry.clock_out).format('HH:mm')}
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">-</Text>
                )}
              </div>

              <div>
                <Text type="secondary" strong>
                  {t('timeEntries.totalHours')}:
                </Text>
                <br />
                <Text strong style={{ fontSize: '18px', color: selectedEntry.total_hours ? '#52c41a' : '#faad14' }}>
                  {selectedEntry.total_hours ? formatHours(selectedEntry.total_hours) : '-'} hrs
                </Text>
              </div>

              {selectedEntry.notes && (
                <div>
                  <Text type="secondary" strong>
                    {t('common.notes')}:
                  </Text>
                  <br />
                  <Text>{selectedEntry.notes}</Text>
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
                    navigate(`/time-entries/${selectedEntry.time_entry_id}/edit`);
                  }}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    handleCloseModal();
                    handleDelete(selectedEntry.time_entry_id);
                  }}
                  loading={deleteTimeEntry.isPending}
                >
                  {t('common.delete')}
                </Button>
              </Space>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
