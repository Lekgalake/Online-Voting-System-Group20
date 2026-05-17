import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, Download } from 'lucide-react';

const AuditLog: React.FC = () => {
  const { auditLogs, currentUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser) return null;
  const roleName = currentUser.roleName;
  if (roleName !== 'Auditor' && roleName !== 'System Administrator') return (
    <div className="page-section active">
      <div className="section-header"><h1 className="page-title">📋 System Audit Log</h1></div>
      <div className="alert alert-error">Access denied. Only Auditors and System Administrators may view logs.</div>
    </div>
  );

  const filteredLogs = useMemo(() =>
    auditLogs.filter(log =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_id && String(log.user_id).includes(searchTerm)) ||
      (log.voter_id && log.voter_id.includes(searchTerm))
    ), [auditLogs, searchTerm]);

  const handleExportCSV = () => {
    const header = 'Log ID,Actor,Action,Timestamp\n';
    const rows = filteredLogs.map(log => {
      const actor = log.user_id ? `User #${log.user_id}` : (log.voter_id ? `Voter ${log.voter_id}` : 'System');
      return `${log.log_id},"${actor}","${log.action.replace(/"/g, '""')}","${log.log_time}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">📋 System Audit Log</h1>
        <p className="page-subtitle">Immutable record of all system activities and transactions.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3>Transaction History ({filteredLogs.length})</h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', width: '240px' }}
                placeholder="Search by action or ID…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
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
                {filteredLogs.map(log => {
                  const actor = log.user_id
                    ? `User #${log.user_id}`
                    : log.voter_id
                      ? `Voter ${log.voter_id.substring(0, 6)}…`
                      : 'System';
                  return (
                    <tr key={log.log_id}>
                      <td>#{log.log_id}</td>
                      <td><code>{actor}</code></td>
                      <td>{log.action}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {new Date(log.log_time).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No matching log entries.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
