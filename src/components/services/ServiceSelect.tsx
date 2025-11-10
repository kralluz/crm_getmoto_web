import { Select, Spin } from 'antd';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { useFormat } from '../../hooks/useFormat';

interface ServiceSelectProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ServiceSelect({ value, onChange, disabled, placeholder }: ServiceSelectProps) {
  const { data: services, isLoading } = useServiceCategories({ is_active: true });
  const { formatCurrency } = useFormat();

  const options = services?.map((service) => ({
    value: service.service_id,
    label: `${service.service_name} - ${formatCurrency(Number(service.service_cost))}`,
    service,
  })) || [];

  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder || 'Selecione um serviço'}
      loading={isLoading}
      notFoundContent={isLoading ? <Spin size="small" /> : 'Nenhum serviço encontrado'}
      filterOption={(input, option) =>
        (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={options}
      style={{ width: '100%' }}
    />
  );
}
