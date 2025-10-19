/**
 * Constantes de rotas da aplicação
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: 'dashboard',
  TRANSACTION: 'transacao',
  CLIENTS: 'clientes',
  PRODUCTS: 'produtos',
  SERVICES: 'servicos',
  SETTINGS: 'configuracoes',
  SEARCH: 'search',
  PRODUCT_DETAIL: 'product',
  CLIENT_DETAIL: 'client',
  VEHICLE_DETAIL: 'vehicle',
  SERVICE_ORDER_DETAIL: 'serviceOrder',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];
