import { DatePicker, Space, Card, Dropdown, Button, Row, Col } from 'antd';
import type { MenuProps } from 'antd';
import { CalendarOutlined, DownOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

const { RangePicker } = DatePicker;

export type PeriodType =
  | 'today'
  | 'last7days'
  | 'last15days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisSemester'
  | 'lastSemester'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

interface PeriodSelectorProps {
  onPeriodChange: (startDate: string, endDate: string) => void;
  onGenerateReport?: () => void;
  reportLoading?: boolean;
  reportDisabled?: boolean;
}

export function PeriodSelector({ onPeriodChange, onGenerateReport, reportLoading, reportDisabled }: PeriodSelectorProps) {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thisMonth');
  const [customDates, setCustomDates] = useState<[Dayjs, Dayjs] | null>(null);

  const calculateDates = (period: PeriodType): [string, string] => {
    const today = dayjs();
    let startDate: Dayjs;
    let endDate: Dayjs = today;

    switch (period) {
      case 'today':
        startDate = today.startOf('day');
        endDate = today.endOf('day');
        break;
      case 'last7days':
        startDate = today.subtract(7, 'days').startOf('day');
        break;
      case 'last15days':
        startDate = today.subtract(15, 'days').startOf('day');
        break;
      case 'last30days':
        startDate = today.subtract(30, 'days').startOf('day');
        break;
      case 'thisMonth':
        startDate = today.startOf('month');
        endDate = today.endOf('month');
        break;
      case 'lastMonth':
        startDate = today.subtract(1, 'month').startOf('month');
        endDate = today.subtract(1, 'month').endOf('month');
        break;
      case 'thisQuarter':
        {
          const quarterStartMonth = Math.floor(today.month() / 3) * 3;
          startDate = today.month(quarterStartMonth).startOf('month');
          endDate = today.month(quarterStartMonth + 2).endOf('month');
        }
        break;
      case 'lastQuarter':
        {
          const lastQuarterStartMonth = Math.floor((today.month() - 3) / 3) * 3;
          startDate = today.month(lastQuarterStartMonth).startOf('month');
          endDate = today.month(lastQuarterStartMonth + 2).endOf('month');
        }
        break;
      case 'thisSemester':
        const currentMonth = today.month();
        if (currentMonth < 6) {
          // First semester (Jan-Jun)
          startDate = today.startOf('year');
          endDate = today.month(5).endOf('month');
        } else {
          // Second semester (Jul-Dec)
          startDate = today.month(6).startOf('month');
          endDate = today.endOf('year');
        }
        break;
      case 'lastSemester':
        const lastSemesterMonth = today.month();
        if (lastSemesterMonth < 6) {
          // If current is first semester, last is second of previous year
          startDate = today.subtract(1, 'year').month(6).startOf('month');
          endDate = today.subtract(1, 'year').endOf('year');
        } else {
          // If current is second semester, last is first of same year
          startDate = today.startOf('year');
          endDate = today.month(5).endOf('month');
        }
        break;
      case 'thisYear':
        startDate = today.startOf('year');
        endDate = today.endOf('year');
        break;
      case 'lastYear':
        startDate = today.subtract(1, 'year').startOf('year');
        endDate = today.subtract(1, 'year').endOf('year');
        break;
      default:
        startDate = today.subtract(30, 'days').startOf('day');
    }

    return [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')];
  };

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const [start, end] = calculateDates(period);
      onPeriodChange(start, end);
      setCustomDates(null);
    }
  };

  const handleCustomDateChange = (dates: [Dayjs, Dayjs] | null) => {
    if (dates) {
      setCustomDates(dates);
      const start = dates[0].format('YYYY-MM-DD');
      const end = dates[1].format('YYYY-MM-DD');
      onPeriodChange(start, end);
    }
  };

  const periodOptions = [
    { value: 'today', label: t('dashboard.periods.today') },
    { value: 'last7days', label: t('dashboard.periods.last7days') },
    { value: 'last15days', label: t('dashboard.periods.last15days') },
    { value: 'last30days', label: t('dashboard.periods.last30days') },
    { value: 'thisMonth', label: t('dashboard.periods.thisMonth') },
    { value: 'lastMonth', label: t('dashboard.periods.lastMonth') },
    { value: 'thisQuarter', label: t('dashboard.periods.thisQuarter') },
    { value: 'lastQuarter', label: t('dashboard.periods.lastQuarter') },
    { value: 'thisSemester', label: t('dashboard.periods.thisSemester') },
    { value: 'lastSemester', label: t('dashboard.periods.lastSemester') },
    { value: 'thisYear', label: t('dashboard.periods.thisYear') },
    { value: 'lastYear', label: t('dashboard.periods.lastYear') },
    { value: 'custom', label: t('dashboard.periods.custom') },
  ];

  const getLabelForPeriod = (period: PeriodType): string => {
    const option = periodOptions.find(opt => opt.value === period);
    return option ? option.label : '';
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'thisMonth',
      label: t('dashboard.periods.thisMonth'),
      onClick: () => handlePeriodChange('thisMonth'),
    },
    {
      key: 'lastMonth',
      label: t('dashboard.periods.lastMonth'),
      onClick: () => handlePeriodChange('lastMonth'),
    },
    {
      key: 'last30days',
      label: t('dashboard.periods.last30days'),
      onClick: () => handlePeriodChange('last30days'),
    },
    {
      key: 'custom',
      label: t('dashboard.periods.custom'),
      onClick: () => handlePeriodChange('custom'),
    },
    {
      type: 'divider',
    },
    {
      key: 'more',
      label: t('dashboard.periods.moreOptions'),
      children: [
        {
          key: 'last7days',
          label: t('dashboard.periods.last7days'),
          onClick: () => handlePeriodChange('last7days'),
        },
        {
          key: 'last15days',
          label: t('dashboard.periods.last15days'),
          onClick: () => handlePeriodChange('last15days'),
        },
        {
          key: 'thisQuarter',
          label: t('dashboard.periods.thisQuarter'),
          onClick: () => handlePeriodChange('thisQuarter'),
        },
        {
          key: 'lastQuarter',
          label: t('dashboard.periods.lastQuarter'),
          onClick: () => handlePeriodChange('lastQuarter'),
        },
        {
          key: 'thisSemester',
          label: t('dashboard.periods.thisSemester'),
          onClick: () => handlePeriodChange('thisSemester'),
        },
        {
          key: 'lastSemester',
          label: t('dashboard.periods.lastSemester'),
          onClick: () => handlePeriodChange('lastSemester'),
        },
        {
          key: 'thisYear',
          label: t('dashboard.periods.thisYear'),
          onClick: () => handlePeriodChange('thisYear'),
        },
        {
          key: 'lastYear',
          label: t('dashboard.periods.lastYear'),
          onClick: () => handlePeriodChange('lastYear'),
        },
      ],
    },
  ];

  return (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <CalendarOutlined style={{ fontSize: 18 }} />
              <span style={{ fontWeight: 500 }}>{t('dashboard.selectPeriod')}:</span>
            </Space>
            <Space size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <div
                  style={{
                    minWidth: 200,
                    padding: '4px 11px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4096ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                  }}
                >
                  <span>{getLabelForPeriod(selectedPeriod)}</span>
                  <DownOutlined style={{ color: '#00000073', fontSize: 12 }} />
                </div>
              </Dropdown>
              {selectedPeriod === 'custom' && (
                <RangePicker
                  value={customDates}
                  onChange={handleCustomDateChange as any}
                  format="DD/MM/YYYY"
                  placeholder={[t('common.dateStart'), t('common.dateEnd')]}
                />
              )}
            </Space>
          </Space>
        </Col>
        {onGenerateReport && (
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="large"
              onClick={onGenerateReport}
              loading={reportLoading}
              disabled={reportDisabled}
            >
              {t('dashboard.generateReport')}
            </Button>
          </Col>
        )}
      </Row>
    </Card>
  );
}
