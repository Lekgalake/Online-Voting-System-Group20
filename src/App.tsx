import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Elections from './pages/Elections';
import Voters from './pages/Voters';
import Candidates from './pages/Candidates';
import AuditLog from './pages/AuditLog';
import Admin from './pages/Admin';
import Login from './pages/Login';

const AppContent: React.FC = () => {
  const { currentUser } = useData();

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
