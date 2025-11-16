import { useState, useRef } from 'react';
import { Select, Input, Button, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SelectProps, InputRef } from 'antd';
import { useProductCategories, useCreateProductCategory } from '../../hooks/useProductCategories';
import { useTranslation } from 'react-i18next';

interface CategorySelectProps extends Omit<SelectProps, 'options'> {
  value?: number;
  onChange?: (value: number) => void;
}

export function CategorySelect({ value, onChange, ...props }: CategorySelectProps) {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useProductCategories({ is_active: true });
  const { mutate: createCategory, isPending: isCreating } = useCreateProductCategory();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    createCategory(
      { 
        product_category_name: newCategoryName.trim(),
        is_active: true 
      },
      {
        onSuccess: (newCategory) => {
          setNewCategoryName('');
          setIsAddingNew(false);
          // Selecionar automaticamente a categoria recém-criada
          if (onChange && newCategory?.product_category_id) {
            onChange(newCategory.product_category_id);
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setIsAddingNew(false);
      setNewCategoryName('');
    }
  };

  return (
    <Select
      showSearch
      placeholder={t('products.selectCategory') || 'Selecione a categoria'}
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
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Space style={{ padding: '0 8px 4px' }}>
            {isAddingNew ? (
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={inputRef}
                  placeholder={t('products.newCategoryName') || 'Nome da categoria'}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={100}
                  autoFocus
                  disabled={isCreating}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddCategory}
                  loading={isCreating}
                  disabled={!newCategoryName.trim()}
                >
                  {t('common.add') || 'Adicionar'}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewCategoryName('');
                  }}
                  disabled={isCreating}
                >
                  {t('common.cancel') || 'Cancelar'}
                </Button>
              </Space.Compact>
            ) : (
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  setIsAddingNew(true);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                style={{ width: '100%' }}
              >
                {t('products.addNewCategory') || 'Adicionar nova categoria'}
              </Button>
            )}
          </Space>
        </>
      )}
      {...props}
    />
  );
}
