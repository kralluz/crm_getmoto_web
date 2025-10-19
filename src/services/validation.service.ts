/**
 * Serviço de validação
 * Regras de validação reutilizáveis para formulários
 */

import type { Rule } from 'antd/es/form';

export class ValidationService {
  /**
   * Validação de campo obrigatório
   */
  static required(message = 'Campo obrigatório'): Rule {
    return {
      required: true,
      message,
    };
  }

  /**
   * Validação de email
   */
  static email(message = 'Email inválido'): Rule {
    return {
      type: 'email',
      message,
    };
  }

  /**
   * Validação de tamanho mínimo
   */
  static minLength(min: number, message?: string): Rule {
    return {
      min,
      message: message || `Mínimo de ${min} caracteres`,
    };
  }

  /**
   * Validação de tamanho máximo
   */
  static maxLength(max: number, message?: string): Rule {
    return {
      max,
      message: message || `Máximo de ${max} caracteres`,
    };
  }

  /**
   * Validação de range de tamanho
   */
  static lengthRange(min: number, max: number, message?: string): Rule {
    return {
      min,
      max,
      message: message || `Deve ter entre ${min} e ${max} caracteres`,
    };
  }

  /**
   * Validação de número
   */
  static number(message = 'Deve ser um número'): Rule {
    return {
      type: 'number',
      message,
    };
  }

  /**
   * Validação de número positivo
   */
  static positiveNumber(message = 'Deve ser um número positivo'): Rule {
    return {
      validator: (_, value) => {
        if (value && value <= 0) {
          return Promise.reject(new Error(message));
        }
        return Promise.resolve();
      },
    };
  }

  /**
   * Validação de CPF
   */
  static cpf(message = 'CPF inválido'): Rule {
    return {
      validator: (_, value) => {
        if (!value) return Promise.resolve();

        const cpf = value.replace(/\D/g, '');

        if (cpf.length !== 11) {
          return Promise.reject(new Error(message));
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) {
          return Promise.reject(new Error(message));
        }

        // Validação dos dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(9))) {
          return Promise.reject(new Error(message));
        }

        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit >= 10) digit = 0;
        if (digit !== parseInt(cpf.charAt(10))) {
          return Promise.reject(new Error(message));
        }

        return Promise.resolve();
      },
    };
  }

  /**
   * Validação de CNPJ
   */
  static cnpj(message = 'CNPJ inválido'): Rule {
    return {
      validator: (_, value) => {
        if (!value) return Promise.resolve();

        const cnpj = value.replace(/\D/g, '');

        if (cnpj.length !== 14) {
          return Promise.reject(new Error(message));
        }

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{13}$/.test(cnpj)) {
          return Promise.reject(new Error(message));
        }

        // Validação dos dígitos verificadores
        let size = cnpj.length - 2;
        let numbers = cnpj.substring(0, size);
        const digits = cnpj.substring(size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
          sum += parseInt(numbers.charAt(size - i)) * pos--;
          if (pos < 2) pos = 9;
        }

        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0))) {
          return Promise.reject(new Error(message));
        }

        size = size + 1;
        numbers = cnpj.substring(0, size);
        sum = 0;
        pos = size - 7;

        for (let i = size; i >= 1; i--) {
          sum += parseInt(numbers.charAt(size - i)) * pos--;
          if (pos < 2) pos = 9;
        }

        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(1))) {
          return Promise.reject(new Error(message));
        }

        return Promise.resolve();
      },
    };
  }

  /**
   * Validação de telefone brasileiro
   */
  static phone(message = 'Telefone inválido'): Rule {
    return {
      validator: (_, value) => {
        if (!value) return Promise.resolve();

        const phone = value.replace(/\D/g, '');

        // Aceita telefone com 10 ou 11 dígitos (com ou sem 9 no celular)
        if (phone.length < 10 || phone.length > 11) {
          return Promise.reject(new Error(message));
        }

        return Promise.resolve();
      },
    };
  }

  /**
   * Validação de URL
   */
  static url(message = 'URL inválida'): Rule {
    return {
      type: 'url',
      message,
    };
  }

  /**
   * Validação customizada
   */
  static custom(
    validator: (value: any) => boolean,
    message: string
  ): Rule {
    return {
      validator: (_, value) => {
        if (!value) return Promise.resolve();
        if (validator(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error(message));
      },
    };
  }

  /**
   * Validação de confirmação (ex: confirmar senha)
   */
  static match(fieldName: string, message?: string): Rule {
    return ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue(fieldName) === value) {
          return Promise.resolve();
        }
        return Promise.reject(
          new Error(message || `Os campos não coincidem`)
        );
      },
    });
  }
}
