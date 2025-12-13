import { Form, Button, Card, DatePicker, Select, Space, Typography, Input, Switch, InputNumber, Row, Col, theme } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ClockCircleOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreateTimeEntry } from '../hooks/useTimeEntries';
import { useEmployees } from '../hooks/useEmployees';
import dayjs from 'dayjs';
import type { CreateTimeEntryData } from '../types/time-entry';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const { Title } = Typography;

export function TimeEntryNew() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [registerByTime, setRegisterByTime] = useState(true); // true = by time, false = by hours
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();

  const { data: employees = [] } = useEmployees(true);
  const createTimeEntry = useCreateTimeEntry();

  const selectedEmployee = employees.find(e => e.employee_id === selectedEmployeeId);

  const onFinish = async (values: any) => {
    let data: CreateTimeEntryData;

    if (registerByTime) {
      // Mode 1: Register by time (clock_in + clock_out)
      if (values.clock_out && values.clock_out.isBefore(values.clock_in)) {
        form.setFields([
          {
            name: 'clock_out',
            errors: [t('timeEntries.validation.clockOutBeforeClockIn')],
          },
        ]);
        return;
      }

      data = {
        employee_id: values.employee_id,
        clock_in: values.clock_in.toISOString(),
        clock_out: values.clock_out ? values.clock_out.toISOString() : null,
        notes: values.notes || null,
      };
    } else {
      // Mode 2: Register by hours (date + total_hours)
      // Use the date picker value as clock_in (without time component matters)
      const dateOnly = values.work_date.startOf('day');
      
      data = {
        employee_id: values.employee_id,
        clock_in: dateOnly.toISOString(),
        total_hours: values.total_hours,
        notes: values.notes || null,
      };
    }

    await createTimeEntry.mutateAsync(data);
    navigate('/time-entries');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/time-entries')} />
              <Title level={3} style={{ margin: 0 }}>{t('timeEntries.newEntry')}</Title>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: token.colorTextSecondary
              }}>
                {t('timeEntries.registrationMode')}:
              </span>

              <div
                onClick={() => {
                  setRegisterByTime(true);
                  form.resetFields(['clock_in', 'clock_out', 'work_date', 'total_hours']);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: registerByTime ? token.colorPrimary : 'transparent',
                  color: registerByTime ? token.colorTextLightSolid : token.colorText,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontWeight: registerByTime ? 600 : 400,
                }}
              >
                <ClockCircleOutlined />
                <span>{t('timeEntries.byTime')}</span>
              </div>

              <div
                onClick={() => {
                  setRegisterByTime(false);
                  form.resetFields(['clock_in', 'clock_out', 'work_date', 'total_hours']);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: !registerByTime ? token.colorSuccess : 'transparent',
                  color: !registerByTime ? token.colorTextLightSolid : token.colorText,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontWeight: !registerByTime ? 600 : 400,
                }}
              >
                <FieldTimeOutlined />
                <span>{t('timeEntries.byHours')}</span>
              </div>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              clock_in: dayjs(),
              work_date: dayjs(),
            }}
          >
            <Form.Item
              label={t('timeEntries.employee')}
              name="employee_id"
              rules={[{ required: true, message: t('timeEntries.requiredEmployee') }]}
            >
              <Select
                placeholder={t('timeEntries.employee')}
                showSearch
                optionFilterProp="label"
                onChange={(value) => setSelectedEmployeeId(value)}
                options={employees.map((emp) => ({
                  label: `${emp.first_name} ${emp.last_name} - ${emp.job_title}`,
                  value: emp.employee_id,
                }))}
              />
            </Form.Item>

            {registerByTime ? (
              // Mode 1: Register by Time
              <>
                <Form.Item
                  label={t('timeEntries.clockInTime')}
                  name="clock_in"
                  rules={[{ required: true, message: t('timeEntries.requiredClockIn') }]}
                >
                  <DatePicker
                    showTime={{ format: 'HH' }}
                    format="DD/MM/YYYY HH:00"
                    style={{ width: '100%' }}
                    disabledDate={(current) => {
                      // Bloquear datas futuras
                      if (current.isAfter(dayjs(), 'day')) return true;

                      if (!selectedEmployee) return false;

                      const startDate = dayjs(selectedEmployee.start_date).startOf('day');
                      if (current.isBefore(startDate, 'day')) return true;

                      if (selectedEmployee.end_date) {
                        const endDate = dayjs(selectedEmployee.end_date).endOf('day');
                        if (current.isAfter(endDate, 'day')) return true;
                      }

                      return false;
                    }}
                    onChange={(value) => {
                      if (value) {
                        // Zerar minutos e segundos
                        form.setFieldValue('clock_in', value.startOf('hour'));
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={t('timeEntries.clockOutTime')}
                  name="clock_out"
                  dependencies={['clock_in']}
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (!value) return Promise.resolve();
                        const clockIn = form.getFieldValue('clock_in');
                        if (clockIn && value.isBefore(clockIn)) {
                          return Promise.reject(new Error(t('timeEntries.validation.clockOutBeforeClockIn')));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <DatePicker
                    showTime={{ format: 'HH' }}
                    format="DD/MM/YYYY HH:00"
                    style={{ width: '100%' }}
                    placeholder={t('timeEntries.clockOutOptional')}
                    disabledDate={(current) => {
                      // Bloquear datas futuras
                      if (current.isAfter(dayjs(), 'day')) return true;

                      if (!selectedEmployee) return false;

                      const startDate = dayjs(selectedEmployee.start_date).startOf('day');
                      if (current.isBefore(startDate, 'day')) return true;

                      if (selectedEmployee.end_date) {
                        const endDate = dayjs(selectedEmployee.end_date).endOf('day');
                        if (current.isAfter(endDate, 'day')) return true;
                      }

                      return false;
                    }}
                    onChange={(value) => {
                      if (value) {
                        // Zerar minutos e segundos
                        form.setFieldValue('clock_out', value.startOf('hour'));
                      }
                    }}
                  />
                </Form.Item>
              </>
            ) : (
              // Mode 2: Register by Hours
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={t('timeEntries.workDate')}
                      name="work_date"
                      rules={[{ required: true, message: t('timeEntries.requiredWorkDate') }]}
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                        disabledDate={(current) => {
                          // Bloquear datas futuras
                          if (current.isAfter(dayjs(), 'day')) return true;

                          if (!selectedEmployee) return false;

                          const startDate = dayjs(selectedEmployee.start_date).startOf('day');
                          if (current.isBefore(startDate, 'day')) return true;

                          if (selectedEmployee.end_date) {
                            const endDate = dayjs(selectedEmployee.end_date).endOf('day');
                            if (current.isAfter(endDate, 'day')) return true;
                          }

                          return false;
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t('timeEntries.totalHoursWorked')}
                      name="total_hours"
                      rules={[
                        { required: true, message: t('timeEntries.requiredTotalHours') },
                        { type: 'number', min: 1, max: 24, message: t('timeEntries.validation.hoursRange') },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            if (!Number.isInteger(value)) {
                              return Promise.reject(new Error(t('timeEntries.validation.mustBeWholeHour')));
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={24}
                        step={1}
                        precision={0}
                        style={{ width: '100%' }}
                        placeholder="8"
                        addonAfter="hrs"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={4} placeholder={t('timeEntries.notesPlaceholder')} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={createTimeEntry.isPending}
                >
                  {t('common.save')}
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
