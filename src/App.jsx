import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import WorkerRegistration from '@/pages/WorkerRegistration';
import PendingWorkers from '@/pages/admin/PendingWorkers';
import ActiveWorkers from '@/pages/admin/ActiveWorkers';
import Projects from '@/pages/admin/Projects';
import AdminLogin from '@/pages/admin/AdminLogin';
import ClientAccounts from '@/pages/admin/ClientAccounts';
import Contacts from '@/pages/admin/Contacts';
import ProductCatalogs from '@/pages/admin/ProductCatalogs';
import Training from '@/pages/admin/Training';
import WorkerLogin from '@/pages/WorkerLogin';
import WorkerDashboard from '@/pages/WorkerDashboard';
import DocumentTemplates from '@/pages/admin/DocumentTemplates';
import AdminManagement from '@/pages/admin/AdminManagement';
import AdminSettings from '@/pages/admin/AdminSettings';
import Residences from '@/pages/admin/Residences';
import Fleet from '@/pages/admin/Fleet';
import PrivacyPolicy from '@/pages/PrivacyPolicy';


import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<WorkerRegistration />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/worker/login" element={<WorkerLogin />} />
          <Route path="/worker/dashboard" element={<ProtectedRoute authKey="workerData" redirect="/worker/login"><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><Navigate to="/admin/dashboard/pending" replace /></ProtectedRoute>} />
          <Route path="/admin/dashboard/pending" element={<ProtectedRoute><PendingWorkers /></ProtectedRoute>} />
          <Route path="/admin/dashboard/active" element={<ProtectedRoute><ActiveWorkers /></ProtectedRoute>} />
          <Route path="/admin/dashboard/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/admin/dashboard/clients" element={<ProtectedRoute><ClientAccounts /></ProtectedRoute>} />
          <Route path="/admin/dashboard/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/admin/dashboard/catalogs" element={<ProtectedRoute><ProductCatalogs /></ProtectedRoute>} />
          <Route path="/admin/dashboard/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
          <Route path="/admin/dashboard/residences" element={<ProtectedRoute><Residences /></ProtectedRoute>} />
          <Route path="/admin/dashboard/fleet" element={<ProtectedRoute><Fleet /></ProtectedRoute>} />
          <Route path="/admin/dashboard/templates" element={<ProtectedRoute><DocumentTemplates /></ProtectedRoute>} />
          <Route path="/admin/dashboard/admins" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
          <Route path="/admin/dashboard/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        </Routes>

      </Router>
    </ThemeProvider>
  );
}

export default App;
