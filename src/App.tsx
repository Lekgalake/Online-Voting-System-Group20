import React, { useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Elections from './pages/Elections';
import Voters from './pages/Voters';
import Candidates from './pages/Candidates';
import AuditLog from './pages/AuditLog';
import Admin from './pages/Admin';
import Login from './pages/Login';
import VotingPage from "./pages/VotingPage";


const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, addAuditLog } = useData();

  const handleSessionTimeout = useCallback(async () => {
    if (!currentUser) return;
    try {
      if (currentUser.type === 'voter') {
        await addAuditLog('Session expired due to inactivity', undefined, currentUser.id);
      } else {
        await addAuditLog('Session expired due to inactivity', parseInt(currentUser.id));
      }
    } catch {
      // still log out if audit insert fails
    }
    setCurrentUser(null);
  }, [currentUser, addAuditLog, setCurrentUser]);

  useSessionTimeout(handleSessionTimeout, !!currentUser);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <Navbar />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/voters" element={<Voters />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/vote" element={<VotingPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
