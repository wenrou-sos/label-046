import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/cases/CaseList';
import CaseCreate from './pages/cases/CaseCreate';
import CaseDetail from './pages/cases/CaseDetail';
import PartyList from './pages/parties/PartyList';
import PartyCreate from './pages/parties/PartyCreate';
import DocumentList from './pages/documents/DocumentList';
import MilestoneOverview from './pages/milestones/MilestoneOverview';
import ReminderRules from './pages/settings/ReminderRules';
import NotificationPage from './pages/notifications/NotificationPage';
import ProfilePage from './pages/Profile';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="cases" element={<CaseList />} />
        <Route path="cases/create" element={<CaseCreate />} />
        <Route path="cases/edit/:id" element={<CaseCreate />} />
        <Route path="cases/:id" element={<CaseDetail />} />

        <Route path="parties" element={<PartyList />} />
        <Route path="parties/create" element={<PartyCreate />} />
        <Route path="parties/edit/:id" element={<PartyCreate />} />

        <Route path="documents" element={<DocumentList />} />

        <Route path="milestones" element={<MilestoneOverview />} />

        <Route path="notifications" element={<NotificationPage />} />

        <Route path="settings/rules" element={<ReminderRules />} />

        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
