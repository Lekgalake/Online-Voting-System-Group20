import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { LayoutDashboard, Vote, Users, Landmark, FileText, Settings, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, setCurrentUser } = useData();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (!currentUser) return null;

  const isVoter = currentUser.type === 'voter';
  const roleName = currentUser.roleName;

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, visible: true },
    { path: '/elections', label: 'Elections', icon: <Vote size={18} />, visible: true },
    { path: '/voters', label: 'Voters', icon: <Users size={18} />, visible: !isVoter },
    { path: '/candidates', label: 'Candidates', icon: <Landmark size={18} />, visible: !isVoter },
    { path: '/audit', label: 'Audit Log', icon: <FileText size={18} />, visible: roleName === 'Auditor' || roleName === 'System Administrator' },
    { path: '/admin', label: 'Admin', icon: <Settings size={18} />, visible: roleName === 'System Administrator' },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">EVC</div>
        <span>E-Vote Commission</span>
      </Link>

      <button 
        className="hamburger" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        <span></span><span></span><span></span>
      </button>

      <ul className={`navbar-nav ${isMenuOpen ? 'open' : ''}`}>
        {navItems.filter(item => item.visible).map(item => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon} {item.label}
            </Link>
          </li>
        ))}
        <li>
          <button className="nav-link nav-gold" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </li>
      </ul>

      <div className="nav-user-info">
        <div className="nav-avatar">{currentUser.displayName[0].toUpperCase()}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{currentUser.displayName}</span>
          <span className="badge-role">{currentUser.roleName}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
