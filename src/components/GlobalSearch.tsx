import { AutoComplete, Input } from 'antd';
import { SearchOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface GlobalSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 10;

export function GlobalSearch({ onSearch, placeholder }: GlobalSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Carregar histórico do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar histórico de busca:', e);
      }
    }
  }, []);

  // Salvar histórico no localStorage
  const saveToHistory = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Remover duplicatas e adicionar no início
    const newHistory = [
      trimmedQuery,
      ...searchHistory.filter((item) => item !== trimmedQuery),
    ].slice(0, MAX_HISTORY);

    setSearchHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  // Remover item do histórico
  const removeFromHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter((h) => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  // Limpar todo o histórico
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSearch = (searchValue?: string) => {
    const valueToSearch = searchValue || query;
    if (valueToSearch.trim()) {
      saveToHistory(valueToSearch);
      onSearch(valueToSearch.trim());
      setOpen(false);
      setQuery(''); // Limpar o campo após buscar
    }
  };

  const handleSelect = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  // Opções do autocomplete
  const options = searchHistory.length > 0
    ? [
        {
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>{t('search.recentSearches')}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearHistory();
                }}
                style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer' }}
              >
                {t('search.clearAll')}
              </span>
            </div>
          ),
          options: searchHistory.map((item) => ({
            value: item,
            label: (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#999' }} />
                  <span>{item}</span>
                </div>
                <CloseOutlined
                  onClick={(e) => removeFromHistory(item, e)}
                  style={{ color: '#999', fontSize: 12, cursor: 'pointer' }}
                />
              </div>
            ),
          })),
        },
      ]
    : [];

  return (
    <AutoComplete
      value={query}
      options={options}
      onSelect={handleSelect}
      onChange={setQuery}
      open={open && searchHistory.length > 0}
      onOpenChange={setOpen}
      style={{ width: '100%' }}
      popupMatchSelectWidth={false}
    >
      <Input
        placeholder={placeholder || t('search.placeholder')}
        prefix={<SearchOutlined />}
        size="large"
        allowClear
        onPressEnter={() => handleSearch()}
      />
    </AutoComplete>
  );
}
