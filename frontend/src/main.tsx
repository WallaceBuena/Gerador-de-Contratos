// frontend/src/main.tsx
// (FICHIRO MODIFICADO)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Nossos componentes
import { AuthProvider } from './context/AuthContext.tsx';
import Root from './Root.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Dashboard from './pages/Dashboard.tsx';
import LoginPage from './pages/LoginPage.tsx';
import App from './App.tsx';
import Biblioteca from './pages/Biblioteca.tsx';
import EditorClausula from './pages/EditorClausula.tsx';
import Clientes from './pages/Clientes.tsx';
import EditorCliente from './pages/EditorCliente.tsx';
import Configuracoes from './pages/Configuracoes.tsx';
// 1. IMPORTAR O NOVO EDITOR
import EditorQualificacao from './pages/EditorQualificacao.tsx'; 

import './index.css';

// Roteador completo
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

          // 2. ADICIONAR AS NOVAS ROTAS AQUI
          { path: '/editor-qualificacao', element: <EditorQualificacao /> },
          { path: '/editor-qualificacao/:id', element: <EditorQualificacao /> },

          // Rota Curinga (sempre por último)
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