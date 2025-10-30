import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { FormatService } from '../../services/format.service';
import { parseDecimal } from '../../utils';

interface ServiceCategorySelectProps extends Omit<SelectProps, 'options'> {
  value?: number;
  onChange?: (value: number) => void;
}

export function ServiceCategorySelect({ value, onChange, ...props }: ServiceCategorySelectProps) {
  const { data: categories = [], isLoading } = useServiceCategories({ is_active: true });

  return (
    <Select
      showSearch
      placeholder="Selecione a categoria do serviço"
      optionFilterProp="children"
      value={value}
      onChange={onChange}
      loading={isLoading}
      notFoundContent={isLoading ? <Spin size="small" /> : 'Nenhuma categoria encontrada'}
      filterOption={(input, option) =>
        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      {...props}
    >
      {categories.map(cat => {
        const displayText = `${cat.service_name} - Custo: ${FormatService.currency(parseDecimal(cat.service_cost))}`;
        return (
          <Select.Option
            key={cat.service_id}
            value={cat.service_id}
            label={displayText}
          >
            <div style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <strong>{cat.service_name}</strong>
              <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                Custo: {FormatService.currency(parseDecimal(cat.service_cost))}
              </span>
            </div>
          </Select.Option>
        );
      })}
    </Select>
  );
}
