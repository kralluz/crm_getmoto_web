import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts';
import { DashboardFinanceiro } from '../pages/DashboardFinanceiro';
import { TransactionForm } from '../pages/TransactionForm';
import { ProductList } from '../pages/ProductList';
import { ProductDetail } from '../pages/ProductDetail';
import { ServiceList } from '../pages/ServiceList';
import { ServiceOrderDetail } from '../pages/ServiceOrderDetail';
import { ClientDetail } from '../pages/ClientDetail';
import { VehicleDetail } from '../pages/VehicleDetail';
import { SearchResults } from '../pages/SearchResults';
import { Settings } from '../pages/Settings';
import { UserList } from '../pages/UserList';
import { UserForm } from '../pages/UserForm';
import { UserDetail } from '../pages/UserDetail';
import { UserChangePassword } from '../pages/UserChangePassword';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
        path: 'usuarios',
        element: <UserList />,
      },
      {
        path: 'usuarios/novo',
        element: <UserForm />,
      },
      {
        path: 'usuarios/:id',
        element: <UserDetail />,
      },
      {
        path: 'usuarios/:id/editar',
        element: <UserForm />,
      },
      {
        path: 'usuarios/:id/alterar-senha',
        element: <UserChangePassword />,
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
        path: 'servicos',
        element: <ServiceList />,
      },
      {
        path: 'servicos/:id',
        element: <ServiceOrderDetail />,
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
