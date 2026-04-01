import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Import from './components/Import/Import';
import Registry from './components/Registry/Registry';
import { AuthProvider } from './lib/useAuth';
import { AuthGate } from './components/Auth/AuthGate';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AuthGate>
              <Layout />
            </AuthGate>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="import" element={
              <AuthGate requiredRoles={['admin', 'management']}>
                <Import />
              </AuthGate>
            } />
            <Route path="registry" element={<Registry />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
