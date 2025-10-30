import { Input } from 'antd';
import { useEffect, useState } from 'react';

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

/**
 * Input de valor monetário que funciona como apps de banco.
 * O usuário digita e o valor começa pelos centavos, aumentando conforme digita.
 *
 * Exemplo de comportamento:
 * - Digita "1" → R$ 0,01
 * - Digita "2" → R$ 0,12
 * - Digita "3" → R$ 1,23
 * - Digita "4" → R$ 12,34
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  disabled,
  style,
  prefix,
  suffix,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Converte número para string formatada
  const formatValue = (numValue: number | undefined): string => {
    if (numValue === undefined || numValue === null || isNaN(numValue)) {
      return '';
    }

    const valueInCents = Math.round(numValue * 100);
    const formatted = (valueInCents / 100).toFixed(2).replace('.', ',');
    return formatted;
  };

  // Atualiza o display quando o value externo muda
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatValue(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Remove tudo que não é número
    const numbersOnly = input.replace(/\D/g, '');

    if (numbersOnly === '') {
      setDisplayValue('');
      onChange?.(undefined);
      return;
    }

    // Converte para número em centavos e depois para reais
    const valueInCents = parseInt(numbersOnly, 10);
    const valueInReais = valueInCents / 100;

    // Formata para exibição
    const formatted = valueInReais.toFixed(2).replace('.', ',');
    setDisplayValue(formatted);

    // Notifica o valor numérico
    onChange?.(valueInReais);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas: números, backspace, delete, tab, escape, enter e setas
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];

    const isNumber = /^[0-9]$/.test(e.key);
    const isAllowedKey = allowedKeys.includes(e.key);
    const isCtrlCmd = e.ctrlKey || e.metaKey;

    if (!isNumber && !isAllowedKey && !isCtrlCmd) {
      e.preventDefault();
    }
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      prefix={prefix || 'R$'}
      suffix={suffix}
      inputMode="numeric"
    />
  );
}
