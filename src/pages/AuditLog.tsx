import React from 'react';
import { useData } from '../context/DataContext';
import { FileText, Search, Download } from 'lucide-react';

const AuditLog: React.FC = () => {
  const { auditLogs, currentUser } = useData();

  if (!currentUser) return null;
  const roleName = currentUser.roleName;
  if (roleName !== 'Auditor' && roleName !== 'System Administrator') return null;

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">📋 System Audit Log</h1>
        <p className="page-subtitle">Transparent record of all system activities and voting transactions.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3>Transaction History</h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input className="form-input" style={{ paddingLeft: '32px', height: '36px', width: '240px' }} placeholder="Search logs..." />
            </div>
          </div>
          <button className="btn btn-outline btn-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="card-body">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Actor</th>
                  <th>Action Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => {
                  const actor = log.user_id ? `User #${log.user_id}` : (log.voter_id ? `Voter ${log.voter_id.substring(0, 5)}...` : 'System');
                  return (
                    <tr key={log.log_id}>
                      <td>#{log.log_id}</td>
                      <td><code>{actor}</code></td>
                      <td>{log.action}</td>
                      <td>{log.log_time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
