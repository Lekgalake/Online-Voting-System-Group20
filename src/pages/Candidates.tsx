import React from 'react';
import { useData } from '../context/DataContext';
import { Landmark, Users2, Plus } from 'lucide-react';

const Candidates: React.FC = () => {
  const { candidates, parties, elections, currentUser } = useData();

  if (!currentUser || currentUser.type === 'voter') return null;

  return (
    <div className="page-section active">
      <div className="section-header">
        <h1 className="page-title">🏛️ Candidates & Parties</h1>
        <p className="page-subtitle">Manage political parties and their candidates.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Registered Candidates</h3>
            <button className="btn btn-primary btn-sm"><Plus size={16} /> Add</button>
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Party</th>
                    <th>Election</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => {
                    const party = parties.find(p => p.party_id === c.party_id);
                    const election = elections.find(e => e.election_id === c.election_id);
                    return (
                      <tr key={c.candidate_id}>
                        <td><strong>{c.candidate_name}</strong></td>
                        <td>{party?.party_name}</td>
                        <td>{election?.election_name}</td>
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
            <h3>Political Parties</h3>
            <button className="btn btn-primary btn-sm"><Plus size={16} /> Add</button>
          </div>
          <div className="card-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Party Name</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map(p => (
                    <tr key={p.party_id}>
                      <td>#{p.party_id}</td>
                      <td><strong>{p.party_name}</strong></td>
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

export default Candidates;
