import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts';
import { ProtectedRoute } from '../components/auth';
import { Login } from '../pages/Login';

import { DashboardFinanceiro } from '../pages/DashboardFinanceiro';
import { MovimentacaoDetail } from '../pages/MovimentacaoDetail';
import { ExpensesList } from '../pages/ExpensesList';
import { ExpenseDetail } from '../pages/ExpenseDetail';
import { PurchaseOrderDetail } from '../pages/PurchaseOrderDetail';
import { ProductList } from '../pages/ProductList';
import { ProductDetail } from '../pages/ProductDetail';
import { StockReport } from '../pages/StockReport';
import { ProductCategoryList } from '../pages/ProductCategoryList';
import { ProductCategoryDetail } from '../pages/ProductCategoryDetail';
import { ServiceList } from '../pages/ServiceList';
import { ServiceOrderDetail } from '../pages/ServiceOrderDetail';
import { ServiceOrdersReport } from '../pages/ServiceOrdersReport';
import { ServiceCategoryList } from '../pages/ServiceCategoryList';
import { ServiceCategoryDetail } from '../pages/ServiceCategoryDetail';
import { ClientDetail } from '../pages/ClientDetail';
import { VehicleList } from '../pages/VehicleList';
import { VehicleDetail } from '../pages/VehicleDetail';
import { SearchResults } from '../pages/SearchResults';
import { Settings } from '../pages/Settings';

export const router = createBrowserRouter([
  // Rota pública (apenas login)
  {
    path: '/login',
    element: <Login />,
  },
  // Rotas privadas (protegidas)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardFinanceiro />,
      },
      {
        path: 'movimentacoes/:id',
        element: <MovimentacaoDetail />,
      },
      {
        path: 'despesas',
        element: <ExpensesList />,
      },
      {
        path: 'despesas/:id',
        element: <ExpenseDetail />,
      },
      {
        path: 'compras/:id',
        element: <PurchaseOrderDetail />,
      },
      {
        path: 'clientes',
        element: (
          <div>
            <h2>Clientes</h2>
            <p>Módulo em desenvolvimento</p>
          </div>
        ),
      },
      {
        path: 'clientes/:id',
        element: <ClientDetail />,
      },
      {
        path: 'produtos',
        element: <ProductList />,
      },
      {
        path: 'produtos/:id',
        element: <ProductDetail />,
      },
      {
        path: 'categorias-produtos',
        element: <ProductCategoryList />,
      },
      {
        path: 'categorias-produtos/:id',
        element: <ProductCategoryDetail />,
      },
      {
        path: 'estoque',
        element: <StockReport />,
      },
      {
        path: 'relatorios/servicos',
        element: <ServiceOrdersReport />,
      },
      {
        path: 'servicos',
        element: <ServiceList />,
      },
      {
        path: 'servicos/:id',
        element: <ServiceOrderDetail />,
      },
      {
        path: 'categorias-servicos',
        element: <ServiceCategoryList />,
      },
      {
        path: 'categorias-servicos/:id',
        element: <ServiceCategoryDetail />,
      },
      {
        path: 'veiculos',
        element: <VehicleList />,
      },
      {
        path: 'veiculos/:id',
        element: <VehicleDetail />,
      },
      {
        path: 'busca',
        element: <SearchResults />,
      },
      {
        path: 'configuracoes',
        element: <Settings />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
