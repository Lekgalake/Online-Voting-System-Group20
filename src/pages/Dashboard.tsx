import React from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Vote, CheckCircle, Zap, ShieldCheck, Users, Calendar, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser, elections, anonymousVotes, participations, voters } = useData();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const isVoter = currentUser.type === 'voter';
  
  // Stats calculation
  const totalElections = elections.length;
  const activeElectionsCount = elections.filter(e => e.status === 'Active').length;

  let stats = [];

  if (isVoter) {
    const votedCount = participations.filter(p => p.voter_id === currentUser.id).length;
    stats = [
      { label: 'Total Elections', value: totalElections, icon: <Vote className="stat-icon green" />, color: 'green' },
      { label: 'Votes Cast', value: votedCount, icon: <CheckCircle className="stat-icon gold" />, color: 'gold' },
      { label: 'Active Elections', value: activeElectionsCount, icon: <Zap className="stat-icon green" />, color: 'green' },
      { label: 'Status', value: currentUser.data.qualification_status ? 'Verified' : 'Pending', icon: <ShieldCheck className="stat-icon gold" />, color: 'gold' },
    ];
  } else {
    stats = [
      { label: 'Registered Voters', value: voters.length, icon: <Users className="stat-icon green" />, color: 'green' },
      { label: 'Total Elections', value: totalElections, icon: <Calendar className="stat-icon gold" />, color: 'gold' },
      { label: 'Votes Cast', value: anonymousVotes.length, icon: <BarChart3 className="stat-icon green" />, color: 'green' },
      { label: 'Active Now', value: activeElectionsCount, icon: <Zap className="stat-icon gold" />, color: 'gold' },
    ];
  }

  const activeElection = elections.find(e => {
    const hasAlreadyVoted = participations.some(p => p.voter_id === currentUser.id && p.election_id === e.election_id);
    return e.status === 'Active' && !hasAlreadyVoted;
  });

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {currentUser.displayName}! Here's your voting overview.</p>
      </div>

      <div className="grid-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {isVoter && activeElection && (
        <div className="card quick-vote-card dashboard-card-spaced">
          <div className="card-header">
            <h3>Quick Vote</h3>
            <span className="table-badge badge-active">Active Now</span>
          </div>
          <div className="card-body">
            <span className="quick-vote-eyebrow">Your ballot is ready</span>
            <h2>{activeElection.election_name}</h2>
            <p>Review the candidates and securely submit your vote before the election closes.</p>
            <button className="btn btn-gold btn-lg quick-vote-button" onClick={() => navigate('/elections')}>
              Cast Your Vote Now
            </button>
          </div>
        </div>
      )}

      <div className="card dashboard-card-spaced">
        <div className="card-header">
          <h3>📅 Recent Elections</h3>
          <button className="btn btn-gold btn-sm" onClick={() => navigate('/elections')}>View All</button>
        </div>
        <div className="card-body">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Election</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {elections.slice(0, 5).map(el => (
                  <tr key={el.election_id}>
                    <td><strong>{el.election_name}</strong></td>
                    <td>{el.election_type}</td>
                    <td>
                      <span className={`table-badge ${
                        el.status === 'Active' ? 'badge-active' : 
                        el.status === 'Closed' ? 'badge-closed' : 'badge-upcoming'
                      }`}>
                        {el.status}
                      </span>
                    </td>
                    <td>
                      <button className={isVoter && el.status === 'Active' ? 'btn btn-gold btn-sm' : 'btn btn-outline btn-sm'} onClick={() => navigate('/elections')}>
                        {isVoter && el.status === 'Active' ? 'Vote' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
