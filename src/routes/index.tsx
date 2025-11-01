import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts';
import { ProtectedRoute } from '../components/auth';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

import { DashboardFinanceiro } from '../pages/DashboardFinanceiro';
import { TransactionForm } from '../pages/TransactionForm';
import { MovimentacoesList } from '../pages/MovimentacoesList';
import { MovimentacaoDetail } from '../pages/MovimentacaoDetail';
import { ProductList } from '../pages/ProductList';
import { ProductForm } from '../pages/ProductForm';
import { ProductDetail } from '../pages/ProductDetail';
import { StockReport } from '../pages/StockReport';
import { ProductCategoryList } from '../pages/ProductCategoryList';
import { ProductCategoryForm } from '../pages/ProductCategoryForm';
import { ProductCategoryDetail } from '../pages/ProductCategoryDetail';
import { ServiceList } from '../pages/ServiceList';
import { ServiceForm } from '../pages/ServiceForm';
import { ServiceOrderDetail } from '../pages/ServiceOrderDetail';
import { ServiceOrdersReport } from '../pages/ServiceOrdersReport';
import { ServiceCategoryList } from '../pages/ServiceCategoryList';
import { ServiceCategoryForm } from '../pages/ServiceCategoryForm';
import { ServiceCategoryDetail } from '../pages/ServiceCategoryDetail';
import { ClientDetail } from '../pages/ClientDetail';
import { VehicleDetail } from '../pages/VehicleDetail';
import { SearchResults } from '../pages/SearchResults';
import { Settings } from '../pages/Settings';

export const router = createBrowserRouter([
  // Rotas públicas (login e registro)
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
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
        path: 'transacao',
        element: <TransactionForm />,
      },
      {
        path: 'movimentacoes',
        element: <MovimentacoesList />,
      },
      {
        path: 'movimentacoes/:id',
        element: <MovimentacaoDetail />,
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
        path: 'produtos/novo',
        element: <ProductForm />,
      },
      {
        path: 'produtos/:id',
        element: <ProductDetail />,
      },
      {
        path: 'produtos/:id/editar',
        element: <ProductForm />,
      },
      {
        path: 'categorias-produtos',
        element: <ProductCategoryList />,
      },
      {
        path: 'categorias-produtos/novo',
        element: <ProductCategoryForm />,
      },
      {
        path: 'categorias-produtos/:id',
        element: <ProductCategoryDetail />,
      },
      {
        path: 'categorias-produtos/:id/editar',
        element: <ProductCategoryForm />,
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
        path: 'servicos/novo',
        element: <ServiceForm />,
      },
      {
        path: 'servicos/:id',
        element: <ServiceOrderDetail />,
      },
      {
        path: 'servicos/:id/editar',
        element: <ServiceForm />,
      },
      {
        path: 'categorias-servicos',
        element: <ServiceCategoryList />,
      },
      {
        path: 'categorias-servicos/novo',
        element: <ServiceCategoryForm />,
      },
      {
        path: 'categorias-servicos/:id',
        element: <ServiceCategoryDetail />,
      },
      {
        path: 'categorias-servicos/:id/editar',
        element: <ServiceCategoryForm />,
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
