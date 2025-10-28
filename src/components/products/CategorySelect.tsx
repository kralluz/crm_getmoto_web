import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { useProductCategories } from '../../hooks/useProductCategories';

interface CategorySelectProps extends Omit<SelectProps, 'options'> {
  value?: number;
  onChange?: (value: number) => void;
}

export function CategorySelect({ value, onChange, ...props }: CategorySelectProps) {
  const { data: categories = [], isLoading } = useProductCategories({ is_active: true });

  return (
    <Select
      showSearch
      placeholder="Selecione a categoria"
      optionFilterProp="children"
      value={value}
      onChange={onChange}
      loading={isLoading}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={categories.map(cat => ({
        value: cat.product_category_id,
        label: cat.product_category_name,
      }))}
      {...props}
    />
  );
}
