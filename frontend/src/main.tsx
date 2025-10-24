import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Nossos componentes
import { AuthProvider } from './context/AuthContext.tsx'; // Adiciona .tsx
import Root from './Root.tsx'; // Adiciona .tsx
import ProtectedRoute from './components/ProtectedRoute.tsx'; // Adiciona .tsx
import Dashboard from './pages/Dashboard.tsx'; // Adiciona .tsx
import LoginPage from './pages/LoginPage.tsx'; // Adiciona .tsx
import App from './App.tsx'; // Adiciona .tsx
import Biblioteca from './pages/Biblioteca.tsx'; // Adiciona .tsx
import EditorClausula from './pages/EditorClausula.tsx'; // Adiciona .tsx
import Clientes from './pages/Clientes.tsx'; // Adiciona .tsx
import EditorCliente from './pages/EditorCliente.tsx'; // Adiciona .tsx
import Configuracoes from './pages/Configuracoes.tsx'; // Adiciona .tsx

import './index.css';

// Roteador completo (sem alterações, já estava correto)
const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/editor', element: <App /> }, 
          { path: '/editor/:rascunhoId', element: <App /> },
          { path: '/biblioteca', element: <Biblioteca /> },
          { path: '/editor-clausula', element: <EditorClausula /> },
          { path: '/editor-clausula/:id', element: <EditorClausula /> },
          { path: '/clientes', element: <Clientes /> },
          { path: '/editor-cliente', element: <EditorCliente /> },
          { path: '/editor-cliente/:id', element: <EditorCliente /> },
          { path: '/configuracoes', element: <Configuracoes /> }, 
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);