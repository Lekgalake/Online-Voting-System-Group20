import React from 'react';
import { useData } from '../context/DataContext';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';

const Voters: React.FC = () => {
  const { voters, toggleVoterStatus, currentUser } = useData();

  if (!currentUser || currentUser.type === 'voter') return null;

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">👥 Voter Management</h1>
        <p className="page-subtitle">Verify qualifications and manage voter access.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Registered Voters</h3>
          <button className="btn btn-primary btn-sm" onClick={() => alert('Feature coming soon: Manual Registration')}>
            + Register New Voter
          </button>
        </div>
        <div className="card-body">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Full Name</th>
                  <th>Surname</th>
                  <th>Status</th>
                  <th>Qualification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {voters.map(v => (
                  <tr key={v.voter_id}>
                    <td><code>{v.voter_id}</code></td>
                    <td>{v.full_name}</td>
                    <td>{v.surname}</td>
                    <td>
                      <span className={`table-badge ${v.voter_status === 'active' ? 'badge-active' : 'badge-suspended'}`}>
                        {v.voter_status}
                      </span>
                    </td>
                    <td>
                      <span className={`table-badge ${v.qualification_status ? 'badge-verified' : 'badge-pending'}`}>
                        {v.qualification_status ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => toggleVoterStatus(v.voter_id)}
                      >
                        {v.voter_status === 'active' ? 'Suspend' : 'Activate'}
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

export default Voters;
