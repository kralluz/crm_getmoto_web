# Getmoto LTD - Frontend

Sistema de CRM para gestão de oficina de motos - Interface Frontend desenvolvida com React, TypeScript e Ant Design.

## 🚀 Tecnologias

- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool e dev server
- **Ant Design** - Biblioteca de componentes UI
- **Zustand** - Gerenciamento de estado global
- **TanStack Query (React Query)** - Gerenciamento de estado assíncrono
- **Orval** - Geração automática de cliente API TypeScript a partir do OpenAPI
- **Axios** - Cliente HTTP com interceptors customizados

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- API Backend rodando (crm_getmoto_api)

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente da API com Orval
npm run generate:api

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── api/                          # Configurações de API
│   ├── axios-instance.ts         # Instância customizada do Axios
│   ├── error-handler.ts          # Tratamento centralizado de erros
│   ├── request-queue.ts          # Fila de requisições com retry
│   └── generated/                # Código gerado pelo Orval
│       ├── models/               # Types/Interfaces dos modelos
│       └── default/              # Hooks React Query gerados
├── pages/                        # Páginas da aplicação
│   └── Dashboard.tsx            # Dashboard principal
├── providers/                    # Context Providers
│   └── QueryProvider.tsx        # Provider do React Query
├── store/                        # Stores Zustand
│   └── auth-store.ts            # Store de autenticação
├── App.tsx                       # Componente raiz
└── main.tsx                      # Entry point

```

## 🔄 Orval - Geração Automática de Cliente API

### Como funciona

O Orval lê o arquivo `swagger-output.json` da API e gera automaticamente:

- ✅ Types TypeScript para todos os modelos
- ✅ Hooks React Query para todas as rotas (useGetXxx, usePostXxx, etc.)
- ✅ Funções de API tipadas
- ✅ Query keys automáticas para cache

### Configuração (orval.config.ts)

```typescript
export default defineConfig({
  'crm-api': {
    output: {
      mode: 'tags-split',               // Separa por tags
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',            // Gera hooks React Query
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customAxiosInstance',  // Usa nosso Axios customizado
        },
      },
    },
    input: {
      target: '../crm_getmoto_api/src/swagger-output.json',
    },
  },
});
```

### Usar hooks gerados

```typescript
import { useGetSummary, usePostLogin } from './api/generated/default/default';

function MyComponent() {
  // Query (GET)
  const { data, isLoading, error } = useGetSummary();

  // Mutation (POST/PUT/DELETE)
  const { mutate: login } = usePostLogin();

  return <div>{/* ... */}</div>;
}
```

### Regenerar após alterações na API

```bash
npm run generate:api
```

## 🛡️ Tratamento Robusto de Erros

### Características

- ✅ **Interceptors centralizados** - Todos os erros passam pelo ApiErrorHandler
- ✅ **Notificações automáticas** - Erros exibidos com Ant Design Message
- ✅ **Logging estruturado** - Erros logados com contexto completo
- ✅ **Retry automático** - Erros 5xx e de rede são retentados
- ✅ **Logout automático em 401** - Redireciona para login quando não autorizado
- ✅ **Rate limiting** - Detecta status 429 e exibe retry-after

### Exemplo de uso

```typescript
import { ApiErrorHandler } from './api/error-handler';

try {
  const data = await customAxiosInstance({ url: '/api/data' });
} catch (error) {
  const apiError = ApiErrorHandler.handle(error);

  // Verificar tipo de erro
  if (ApiErrorHandler.isCritical(apiError)) {
    // Erro crítico (401)
  }

  if (ApiErrorHandler.shouldRetry(apiError)) {
    // Pode retentar
  }
}
```

## 🔄 Fila de Requisições

### Características

- ✅ **Limite de concorrência** - Máximo de 5 requisições simultâneas
- ✅ **Retry com exponential backoff** - 3 tentativas com delay crescente
- ✅ **Gerenciamento automático** - Enfileira requisições quando limite atingido
- ✅ **Cancelamento** - Limpa fila em logout ou navegação

### Monitoramento

```typescript
import { getQueueInfo } from './api/axios-instance';

const { queueSize, activeRequests } = getQueueInfo();
console.log(`Fila: ${queueSize}, Ativas: ${activeRequests}`);
```

## 🗃️ Gerenciamento de Estado (Zustand)

### Store de Autenticação

```typescript
import { useAuthStore } from './store/auth-store';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = () => {
    login({ id: '1', name: 'João', email: 'joao@email.com' }, 'token123');
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Olá, {user?.name}</p>
          <button onClick={logout}>Sair</button>
        </>
      ) : (
        <button onClick={handleLogin}>Entrar</button>
      )}
    </div>
  );
}
```

### Características

- ✅ **Persistência automática** - Estado salvo no localStorage
- ✅ **TypeScript completo** - Tipagem forte em todo o estado
- ✅ **Middleware de persist** - Sincroniza automaticamente

## 🎨 Ant Design

### Componentes utilizados

- Layout, Header, Content
- Card, Row, Col
- Statistic, Button, Space
- Typography, Spin, Alert
- Message (notificações)
- ConfigProvider (i18n pt-BR)

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint

# Gerar cliente API
npm run generate:api
```

## 🌐 Integração com a API

O frontend está configurado para se conectar com a API backend em `http://localhost:3000` por padrão.

### Autenticação

O token JWT é armazenado no localStorage e automaticamente incluído em todas as requisições via interceptor do Axios:

```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🚀 Deploy

```bash
# Build de produção
npm run build

# Arquivos gerados em /dist
```

Os arquivos estáticos podem ser servidos por qualquer servidor web (Nginx, Apache, Vercel, Netlify, etc.).

## 📚 Documentação Adicional

- [React Query Docs](https://tanstack.com/query/latest)
- [Orval Docs](https://orval.dev/)
- [Ant Design Docs](https://ant.design/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)

## 🤝 Contribuindo

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Desenvolvido por

Sistema desenvolvido para gestão de oficina de motos GetMoto.

---

**Nota:** Este projeto foi gerado com Vite + React + TypeScript e utiliza as melhores práticas de desenvolvimento frontend moderno.
