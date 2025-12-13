import { AutoComplete, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useEmployees } from '../../hooks/useEmployees';
import { useMemo, useState } from 'react';

interface ProfessionalAutoCompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function ProfessionalAutoComplete({
  value,
  onChange,
  placeholder,
  disabled,
  maxLength = 255,
}: ProfessionalAutoCompleteProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');

  // Buscar funcionários ativos
  const { data: employees, isLoading } = useEmployees(true); // true = apenas ativos

  // Filtrar e mapear para opções do AutoComplete
  const options = useMemo(() => {
    if (!employees || employees.length === 0) return [];

    // Filtrar por busca local se houver
    const filteredEmployees = employees.filter(employee => {
      if (!searchValue) return true;
      const searchLower = searchValue.toLowerCase();
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        employee.first_name.toLowerCase().includes(searchLower) ||
        employee.last_name.toLowerCase().includes(searchLower) ||
        employee.job_title.toLowerCase().includes(searchLower)
      );
    });

    // Mapear para formato do AutoComplete
    return filteredEmployees.map(employee => {
      const fullName = `${employee.first_name} ${employee.last_name}`;
      return {
        value: fullName,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              {fullName}
            </span>
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 16 }}>
              {employee.job_title}
            </span>
          </div>
        ),
      };
    });
  }, [employees, searchValue]);

  const handleSearch = (searchText: string) => {
    setSearchValue(searchText);
  };

  const handleChange = (newValue: string) => {
    onChange?.(newValue);
  };

  return (
    <AutoComplete
      value={value}
      onChange={handleChange}
      onSearch={handleSearch}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      allowClear
      notFoundContent={isLoading ? <Spin size="small" /> : t('common.noResults')}
      filterOption={false} // Desabilita filtro interno (fazemos manualmente)
      style={{ width: '100%' }}
    />
  );
}
