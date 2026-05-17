import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
  loading: boolean;
  setCurrentUser: (user: AppUser | null) => void;
  addVote: (electionId: number, candidateId: number) => Promise<void>;
  addAuditLog: (action: string, userId?: number, voterId?: string) => Promise<void>;
  createElection: (election: Omit<Election, 'election_id'>) => Promise<void>;
  toggleVoterStatus: (voterId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [anonymousVotes, setAnonymousVotes] = useState<AnonymousVote[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: voterData },
        { data: electionData },
        { data: partyData },
        { data: candidateData },
        { data: participationData },
        { data: voteData },
        { data: sysUserData },
        { data: roleData },
        { data: auditData },
      ] = await Promise.all([
        supabase.from('voter').select('*'),
        supabase.from('election').select('*').order('election_id'),
        supabase.from('party').select('*').order('party_id'),
        supabase.from('candidate').select('*').order('candidate_id'),
        supabase.from('participation').select('*').order('participation_time', { ascending: false }),
        supabase.from('anonymous_vote').select('*').order('vote_timestamp', { ascending: false }),
        supabase.from('admin_user').select('*').order('user_id'),
        supabase.from('role').select('*').order('role_id'),
        supabase.from('audit_log').select('*').order('log_time', { ascending: false }).limit(200),
      ]);

      if (voterData) setVoters(voterData as Voter[]);
      if (electionData) setElections(electionData as Election[]);
      if (partyData) setParties(partyData as Party[]);
      if (candidateData) setCandidates(candidateData as Candidate[]);
      if (participationData) setParticipations(participationData as Participation[]);
      if (voteData) setAnonymousVotes(voteData as AnonymousVote[]);
      if (sysUserData) setSystemUsers(sysUserData as SystemUser[]);
      if (roleData) setRoles(roleData as Role[]);
      if (auditData) setAuditLogs(auditData as AuditLog[]);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addAuditLog = useCallback(async (action: string, userId?: number, voterId?: string) => {
    const { data } = await supabase
      .from('audit_log')
      .insert({ user_id: userId ?? null, voter_id: voterId ?? null, action })
      .select()
      .single();
    if (data) setAuditLogs(prev => [data as AuditLog, ...prev]);
  }, []);

  const addVote = useCallback(async (electionId: number, candidateId: number) => {
    if (!currentUser) return;

    const { error: pErr } = await supabase.from('participation').insert({
      voter_id: currentUser.id,
      election_id: electionId,
    });
    if (pErr) throw new Error(pErr.message);

    const { error: vErr } = await supabase.from('anonymous_vote').insert({
      candidate_id: candidateId,
      election_id: electionId,
    });
    if (vErr) throw new Error(vErr.message);

    const [{ data: pData }, { data: vData }] = await Promise.all([
      supabase.from('participation').select('*').order('participation_time', { ascending: false }),
      supabase.from('anonymous_vote').select('*').order('vote_timestamp', { ascending: false }),
    ]);
    if (pData) setParticipations(pData as Participation[]);
    if (vData) setAnonymousVotes(vData as AnonymousVote[]);

    await addAuditLog(`Vote cast anonymously in Election #${electionId}`, undefined, currentUser.id);
  }, [currentUser, addAuditLog]);

  const createElection = useCallback(async (electionData: Omit<Election, 'election_id'>) => {
    const { data, error } = await supabase
      .from('election')
      .insert(electionData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data) {
      setElections(prev => [...prev, data as Election]);
      if (currentUser) {
        await addAuditLog(`Created new election: ${electionData.election_name}`, parseInt(currentUser.id));
      }
    }
  }, [currentUser, addAuditLog]);

  const toggleVoterStatus = useCallback(async (voterId: string) => {
    const voter = voters.find(v => v.voter_id === voterId);
    if (!voter) return;
    const newStatus: VoterStatus = voter.voter_status === 'active' ? 'suspended' : 'active';

    const { error } = await supabase
      .from('voter')
      .update({ voter_status: newStatus })
      .eq('voter_id', voterId);
    if (error) throw new Error(error.message);

    setVoters(prev => prev.map(v => v.voter_id === voterId ? { ...v, voter_status: newStatus } : v));
    await addAuditLog(
      `Changed voter ${voterId} status to ${newStatus}`,
      currentUser ? parseInt(currentUser.id) : undefined
    );
  }, [voters, currentUser, addAuditLog]);

  return (
    <DataContext.Provider value={{
      voters, elections, parties, candidates, participations,
      anonymousVotes, systemUsers, roles, auditLogs,
      currentUser, loading,
      setCurrentUser, addVote, addAuditLog,
      createElection, toggleVoterStatus,
      refreshData: fetchAll,
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
