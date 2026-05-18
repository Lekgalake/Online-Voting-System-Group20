import React from 'react';
import { useData } from '../context/DataContext';
import { UserPlus, Key } from 'lucide-react';

const Admin: React.FC = () => {
  const { systemUsers, roles, currentUser } = useData();
  const roleDescriptions: Record<string, string> = {
    'System Administrator': 'Main admin. Can access all management areas including voters, candidates, audit logs, and system users.',
    'Election Administrator': 'Manages election setup, candidates, and election operations.',
    'IT Support Team': 'Supports technical operations and user access issues.',
    'Auditor': 'Reviews audit logs and election activity for compliance.'
  };

  if (!currentUser || currentUser.roleName !== 'System Administrator') return null;

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">⚙️ System Administration</h1>
        <p className="page-subtitle">Manage system users, roles, and global configurations.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>System Users</h3>
            <button className="btn btn-primary btn-sm"><UserPlus size={16} /> New User</button>
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {systemUsers.map(u => {
                    const role = roles.find(r => r.role_id === u.role_id);
                    return (
                      <tr key={u.user_id}>
                        <td>#{u.user_id}</td>
                        <td><strong>{u.username}</strong></td>
                        <td>{role?.role_name}</td>
                        <td>
                          <button className="btn btn-outline btn-sm"><Key size={14} /> Reset PW</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Role Definitions</h3>
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Role ID</th>
                    <th>Role Name</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(r => (
                    <tr key={r.role_id}>
                      <td>#{r.role_id}</td>
                      <td><strong>{r.role_name}</strong></td>
                      <td>{roleDescriptions[r.role_name] || 'System role'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
