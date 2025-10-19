/**
 * Hook para usar validações
 * Facilita o uso do ValidationService em formulários
 */

import { useMemo } from 'react';
import { ValidationService } from '../services';
import { useTranslation } from 'react-i18next';

/**
 * Hook para validações com i18n
 */
export function useValidation() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      required: (message?: string) =>
        ValidationService.required(message || t('validation.required')),

      email: (message?: string) =>
        ValidationService.email(message || t('validation.email')),

      minLength: (min: number, message?: string) =>
        ValidationService.minLength(
          min,
          message || t('validation.minLength', { min })
        ),

      maxLength: (max: number, message?: string) =>
        ValidationService.maxLength(
          max,
          message || t('validation.maxLength', { max })
        ),

      lengthRange: (min: number, max: number, message?: string) =>
        ValidationService.lengthRange(
          min,
          max,
          message || t('validation.lengthRange', { min, max })
        ),

      number: (message?: string) =>
        ValidationService.number(message || t('validation.number')),

      positiveNumber: (message?: string) =>
        ValidationService.positiveNumber(
          message || t('validation.positiveNumber')
        ),

      cpf: (message?: string) =>
        ValidationService.cpf(message || t('validation.cpf')),

      cnpj: (message?: string) =>
        ValidationService.cnpj(message || t('validation.cnpj')),

      phone: (message?: string) =>
        ValidationService.phone(message || t('validation.phone')),

      url: (message?: string) =>
        ValidationService.url(message || t('validation.url')),

      custom: ValidationService.custom,

      match: (fieldName: string, message?: string) =>
        ValidationService.match(
          fieldName,
          message || t('validation.match')
        ),
    }),
    [t]
  );
}
