import { Select, Spin } from 'antd';
import { useProducts } from '../../hooks/useProducts';
import { useFormat } from '../../hooks/useFormat';

interface ProductSelectProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ProductSelect({ value, onChange, disabled, placeholder }: ProductSelectProps) {
  const { data: products, isLoading } = useProducts();
  const { formatCurrency } = useFormat();

  const options = products?.map((product) => ({
    value: product.product_id,
    label: `${product.product_name} - ${formatCurrency(product.sell_price)} (Estoque: ${product.quantity})`,
    product,
  })) || [];

  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder || 'Selecione um produto'}
      loading={isLoading}
      notFoundContent={isLoading ? <Spin size="small" /> : 'Nenhum produto encontrado'}
      filterOption={(input, option) =>
        (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={options}
      style={{ width: '100%' }}
    />
  );
}
