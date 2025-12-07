import { Form, Input, Button, Card, DatePicker, Select, Space, Typography } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTimeEntry, useUpdateTimeEntry } from '../hooks/useTimeEntries';
import { useEmployees } from '../hooks/useEmployees';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import type { UpdateTimeEntryData } from '../types/time-entry';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

export function TimeEntryForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: timeEntry } = useTimeEntry(id);
  const { data: employees = [] } = useEmployees(true);
  const updateTimeEntry = useUpdateTimeEntry();

  useEffect(() => {
    if (timeEntry) {
      form.setFieldsValue({
        employee_id: timeEntry.employee_id,
        clock_in: dayjs(timeEntry.clock_in),
        clock_out: timeEntry.clock_out ? dayjs(timeEntry.clock_out) : null,
        notes: timeEntry.notes,
      });
    }
  }, [timeEntry, form]);

  const onFinish = async (values: any) => {
    const data: UpdateTimeEntryData = {
      clock_out: values.clock_out.toISOString(),
      notes: values.notes || null,
    };

    await updateTimeEntry.mutateAsync({ id: id!, data });
    navigate('/time-entries');
  };

  if (!timeEntry) {
    return <div>{t('common.loading')}</div>;
  }

  const employee = employees.find((e) => e.employee_id === timeEntry.employee_id);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/time-entries')} />
            <Title level={3}>{t('timeEntries.clockOut')} - {employee?.first_name} {employee?.last_name}</Title>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item label={t('timeEntries.employee')}>
              <Input value={`${employee?.first_name} ${employee?.last_name}`} disabled />
            </Form.Item>

            <Form.Item label={t('timeEntries.clockInTime')}>
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                disabled
                style={{ width: '100%' }}
                value={dayjs(timeEntry.clock_in)}
              />
            </Form.Item>

            <Form.Item
              label={t('timeEntries.clockOutTime')}
              name="clock_out"
              rules={[{ required: true, message: t('timeEntries.requiredClockOut') }]}
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={4} placeholder={t('timeEntries.notesPlaceholder')} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={updateTimeEntry.isPending}
                >
                  {t('timeEntries.clockOut')}
                </Button>
                <Button onClick={() => navigate('/time-entries')}>
                  {t('common.cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
