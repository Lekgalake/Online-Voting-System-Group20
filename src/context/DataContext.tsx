import React, { createContext, useContext, useState } from 'react';
import type { 
  Voter, Election, Party, Candidate, Participation, 
  AnonymousVote, SystemUser, Role, AuditLog, AppUser, VoterStatus 
} from '../types';

interface DataContextType {
  voters: Voter[];
  elections: Election[];
  parties: Party[];
  candidates: Candidate[];
  participations: Participation[];
  anonymousVotes: AnonymousVote[];
  systemUsers: SystemUser[];
  roles: Role[];
  auditLogs: AuditLog[];
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  addVote: (electionId: number, candidateId: number) => void;
  addAuditLog: (action: string, userId?: number, voterId?: string) => void;
  createElection: (election: Omit<Election, 'election_id'>) => void;
  toggleVoterStatus: (voterId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voters, setVoters] = useState<Voter[]>([
    { voter_id: '9001015009087', full_name: 'Thabo', surname: 'Molefe', password_hash: 'pass123', voter_status: 'active', qualification_status: true },
    { voter_id: '8505206018082', full_name: 'Lerato', surname: 'Dlamini', password_hash: 'pass123', voter_status: 'active', qualification_status: true },
    { voter_id: '9203156023095', full_name: 'Sipho', surname: 'Nkosi', password_hash: 'pass123', voter_status: 'suspended', qualification_status: false },
    { voter_id: '7808305034083', full_name: 'Precious', surname: 'Mahlangu', password_hash: 'pass123', voter_status: 'active', qualification_status: true },
    { voter_id: '9604125041080', full_name: 'Kagiso', surname: 'Modise', password_hash: 'pass123', voter_status: 'active', qualification_status: true },
  ]);

  const [elections, setElections] = useState<Election[]>([
    { election_id: 1, election_name: 'National General Election 2026', election_type: 'National', start_date: '2026-05-01T08:00', end_date: '2026-06-15T20:00', status: 'Active', result_locked: false },
    { election_id: 2, election_name: 'Gauteng Provincial Election', election_type: 'Provincial', start_date: '2026-07-01T08:00', end_date: '2026-07-20T20:00', status: 'Upcoming', result_locked: false },
    { election_id: 3, election_name: 'Cape Town Municipal Election', election_type: 'Local', start_date: '2025-11-01T08:00', end_date: '2025-11-15T20:00', status: 'Closed', result_locked: true },
  ]);

  const [parties] = useState<Party[]>([
    { party_id: 1, party_name: 'African National Congress' },
    { party_id: 2, party_name: 'Democratic Alliance' },
    { party_id: 3, party_name: 'Economic Freedom Fighters' },
    { party_id: 4, party_name: 'Inkatha Freedom Party' },
    { party_id: 5, party_name: 'Freedom Front Plus' },
  ]);

  const [candidates] = useState<Candidate[]>([
    { candidate_id: 1, candidate_name: 'Cyril Ramaphosa', party_id: 1, election_id: 1 },
    { candidate_id: 2, candidate_name: 'John Steenhuisen', party_id: 2, election_id: 1 },
    { candidate_id: 3, candidate_name: 'Julius Malema', party_id: 3, election_id: 1 },
    { candidate_id: 4, candidate_name: 'Velenkosini Hlabisa', party_id: 4, election_id: 1 },
    { candidate_id: 5, candidate_name: 'Pieter Groenewald', party_id: 5, election_id: 1 },
    { candidate_id: 6, candidate_name: 'Panyaza Lesufi', party_id: 1, election_id: 2 },
    { candidate_id: 7, candidate_name: 'Solly Msimanga', party_id: 2, election_id: 2 },
    { candidate_id: 8, candidate_name: 'Geordin Hill-Lewis', party_id: 2, election_id: 3 },
    { candidate_id: 9, candidate_name: 'Cameron Dugmore', party_id: 1, election_id: 3 },
  ]);

  const [participations, setParticipations] = useState<Participation[]>([
    { participation_id: 1, voter_id: '8505206018082', election_id: 1, participation_time: '2026-05-02T10:30:00' },
  ]);

  const [anonymousVotes, setAnonymousVotes] = useState<AnonymousVote[]>([
    { vote_receipt_id: 1, candidate_id: 2, election_id: 1, vote_timestamp: '2026-05-02T10:30:05' },
    { vote_receipt_id: 2, candidate_id: 8, election_id: 3, vote_timestamp: '2025-11-10T09:00:00' },
    { vote_receipt_id: 3, candidate_id: 8, election_id: 3, vote_timestamp: '2025-11-10T10:30:00' },
    { vote_receipt_id: 4, candidate_id: 9, election_id: 3, vote_timestamp: '2025-11-10T11:45:00' },
  ]);

  const [systemUsers] = useState<SystemUser[]>([
    { user_id: 1, username: 'admin', password_hash: 'admin123', role_id: 1, log_time: '2026-05-10T08:00:00' },
    { user_id: 2, username: 'election_admin', password_hash: 'admin123', role_id: 2, log_time: '2026-05-10T08:30:00' },
    { user_id: 3, username: 'auditor1', password_hash: 'audit123', role_id: 4, log_time: '2026-05-10T09:00:00' },
    { user_id: 4, username: 'itsupport', password_hash: 'it123', role_id: 3, log_time: '2026-05-10T07:00:00' },
  ]);

  const [roles] = useState<Role[]>([
    { role_id: 1, role_name: 'System Administrator' },
    { role_id: 2, role_name: 'Election Administrator' },
    { role_id: 3, role_name: 'IT Support Team' },
    { role_id: 4, role_name: 'Auditor' },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { log_id: 1, user_id: 1, voter_id: null, action: 'System Administrator logged in', log_time: '2026-05-10T08:00:00' },
    { log_id: 2, user_id: null, voter_id: '9001015009087', action: 'Voter registered successfully', log_time: '2026-05-09T14:20:00' },
    { log_id: 3, user_id: null, voter_id: '8505206018082', action: 'Vote cast in Election #1', log_time: '2026-05-02T10:30:05' },
    { log_id: 4, user_id: 2, voter_id: null, action: 'Election Administrator created Election #2', log_time: '2026-05-08T11:00:00' },
    { log_id: 5, user_id: 3, voter_id: null, action: 'Auditor reviewed activity logs', log_time: '2026-05-10T09:15:00' },
  ]);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const addAuditLog = (action: string, userId?: number, voterId?: string) => {
    const newLog: AuditLog = {
      log_id: auditLogs.length + 1,
      user_id: userId || null,
      voter_id: voterId || null,
      action,
      log_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addVote = (electionId: number, candidateId: number) => {
    if (!currentUser) return;
    
    const participationId = participations.length + 1;
    const newParticipation: Participation = {
      participation_id: participationId,
      voter_id: currentUser.id,
      election_id: electionId,
      participation_time: new Date().toISOString(),
    };

    const newVote: AnonymousVote = {
      vote_receipt_id: anonymousVotes.length + 1,
      candidate_id: candidateId,
      election_id: electionId,
      vote_timestamp: new Date().toISOString(),
    };

    setParticipations(prev => [...prev, newParticipation]);
    setAnonymousVotes(prev => [...prev, newVote]);
    addAuditLog(`Vote cast anonymously in Election #${electionId}`, undefined, currentUser.id);
  };

  const createElection = (electionData: Omit<Election, 'election_id'>) => {
    const newElection: Election = {
      ...electionData,
      election_id: elections.length + 1,
    };
    setElections(prev => [...prev, newElection]);
    if (currentUser) {
      addAuditLog(`Created new election: ${newElection.election_name}`, parseInt(currentUser.id));
    }
  };

  const toggleVoterStatus = (voterId: string) => {
    setVoters(prev => prev.map(v => {
      if (v.voter_id === voterId) {
        const newStatus: VoterStatus = v.voter_status === 'active' ? 'suspended' : 'active';
        addAuditLog(`Changed voter ${voterId} status to ${newStatus}`, currentUser ? parseInt(currentUser.id) : undefined);
        return { ...v, voter_status: newStatus };
      }
      return v;
    }));
  };

  return (
    <DataContext.Provider value={{
      voters, elections, parties, candidates, participations,
      anonymousVotes, systemUsers, roles, auditLogs,
      currentUser, setCurrentUser, addVote, addAuditLog,
      createElection, toggleVoterStatus
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
