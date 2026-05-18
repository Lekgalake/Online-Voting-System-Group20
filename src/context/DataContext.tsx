import React, { createContext, useContext, useEffect, useState } from 'react';
import type { 
  Voter, Election, Party, Candidate, Participation, 
  AnonymousVote, SystemUser, Role, AuditLog, AppUser, VoterStatus 
} from '../types';
import { supabase } from '../lib/supabaseClient';

const getSupabaseErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback;

  const details = error as { message?: string; details?: string; hint?: string; code?: string };
  if (details.message === 'Election cannot be modified after voting has started') {
    return 'Your Supabase election trigger is still blocking status changes. Run supabase-fix-election-status-trigger.sql in the Supabase SQL editor, then try again.';
  }

  return [details.message, details.details, details.hint, details.code ? `Code: ${details.code}` : '']
    .filter(Boolean)
    .join(' ');
};

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
  refreshData: () => Promise<void>;
  addVote: (electionId: number, candidateId: number) => Promise<void>;
  addAuditLog: (action: string, userId?: number, voterId?: string) => void;
  createElection: (election: Omit<Election, 'election_id'>) => Promise<void>;
  updateElectionStatus: (electionId: number, status: Election['status']) => Promise<void>;
  createParty: (partyName: string) => Promise<void>;
  updateParty: (partyId: number, partyName: string) => Promise<void>;
  deleteParty: (partyId: number) => Promise<void>;
  createCandidate: (candidateName: string, partyId: number, electionId: number) => Promise<void>;
  toggleVoterStatus: (voterId: string) => void;
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

  const refreshData = async () => {
    const [
      votersResponse,
      electionsResponse,
      partiesResponse,
      candidatesResponse,
      participationsResponse,
      votesResponse,
      systemUsersResponse,
      rolesResponse,
      auditLogsResponse
    ] = await Promise.all([
      supabase.from('voter').select('*').order('created_at', { ascending: false }),
      supabase.from('election').select('*').order('election_id'),
      supabase.from('party').select('*').order('party_id'),
      supabase.from('candidate').select('*').order('candidate_id'),
      supabase.from('participation').select('*').order('participation_id'),
      supabase.from('anonymous_vote').select('*').order('vote_receipt_id'),
      supabase.from('admin_user').select('*').order('user_id'),
      supabase.from('role').select('*').order('role_id'),
      supabase.from('audit_log').select('*').order('log_time', { ascending: false })
    ]);

    if (!votersResponse.error) setVoters(votersResponse.data || []);
    if (!electionsResponse.error) setElections(electionsResponse.data || []);
    if (!partiesResponse.error) setParties(partiesResponse.data || []);
    if (!candidatesResponse.error) setCandidates(candidatesResponse.data || []);
    if (!participationsResponse.error) setParticipations(participationsResponse.data || []);
    if (!votesResponse.error) setAnonymousVotes(votesResponse.data || []);
    if (!systemUsersResponse.error) setSystemUsers(systemUsersResponse.data || []);
    if (!rolesResponse.error) setRoles(rolesResponse.data || []);
    if (!auditLogsResponse.error) setAuditLogs(auditLogsResponse.data || []);
  };

  useEffect(() => {
    refreshData();
  }, []);

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

  const addVote = async (electionId: number, candidateId: number) => {
    if (!currentUser) return;

    const { data: candidate, error: candidateError } = await supabase
      .from('candidate')
      .select('candidate_id, election_id')
      .eq('candidate_id', candidateId)
      .single();

    if (candidateError) {
      throw new Error(getSupabaseErrorMessage(candidateError, 'Unable to verify selected candidate.'));
    }

    if (!candidate || candidate.election_id !== electionId) {
      throw new Error('The selected candidate does not belong to this election.');
    }

    const { error: participationError } = await supabase
      .from('participation')
      .insert({
        voter_id: currentUser.id,
        election_id: electionId
      });

    if (participationError) {
      throw new Error(getSupabaseErrorMessage(participationError, 'Unable to record voter participation.'));
    }

    const { error: voteError } = await supabase
      .from('anonymous_vote')
      .insert({
        candidate_id: candidateId,
        election_id: electionId
      });

    if (voteError) {
      await supabase
        .from('participation')
        .delete()
        .eq('voter_id', currentUser.id)
        .eq('election_id', electionId);

      throw new Error(getSupabaseErrorMessage(voteError, 'Unable to record vote.'));
    }

    await refreshData();
    addAuditLog(`Vote cast in Election #${electionId}`, undefined, currentUser.id);
  };

  const createElection = async (electionData: Omit<Election, 'election_id'>) => {
    const { data, error } = await supabase
      .from('election')
      .insert(electionData)
      .select()
      .single();

    if (error) throw new Error(getSupabaseErrorMessage(error, 'Unable to create election.'));

    await refreshData();
    if (currentUser) {
      addAuditLog(`Created new election: ${data.election_name}`, parseInt(currentUser.id));
    }
  };

  const updateElectionStatus = async (electionId: number, status: Election['status']) => {
    const { error } = await supabase
      .from('election')
      .update({ status })
      .eq('election_id', electionId);

    if (error) throw new Error(getSupabaseErrorMessage(error, 'Unable to update election status.'));

    await refreshData();
    if (currentUser) {
      addAuditLog(`Changed election #${electionId} status to ${status}`, parseInt(currentUser.id));
    }
  };

  const createParty = async (partyName: string) => {
    const { error } = await supabase
      .from('party')
      .insert({ party_name: partyName });

    if (error) throw new Error(getSupabaseErrorMessage(error, 'Unable to create political party.'));

    await refreshData();
    if (currentUser) {
      addAuditLog(`Created political party: ${partyName}`, parseInt(currentUser.id));
    }
  };

  const updateParty = async (partyId: number, partyName: string) => {
    const { error } = await supabase
      .from('party')
      .update({ party_name: partyName })
      .eq('party_id', partyId);

    if (error) throw new Error(getSupabaseErrorMessage(error, 'Unable to update political party.'));

    await refreshData();
    if (currentUser) {
      addAuditLog(`Updated political party #${partyId}: ${partyName}`, parseInt(currentUser.id));
    }
  };

  const deleteParty = async (partyId: number) => {
    const { error } = await supabase
      .from('party')
      .delete()
      .eq('party_id', partyId);

    if (error) throw new Error(getSupabaseErrorMessage(error, 'Unable to delete political party.'));

    await refreshData();
    if (currentUser) {
      addAuditLog(`Deleted political party #${partyId}`, parseInt(currentUser.id));
    }
  };

  const createCandidate = async (candidateName: string, partyId: number, electionId: number) => {
    const { error } = await supabase
      .from('candidate')
      .insert({
        candidate_name: candidateName,
        party_id: partyId,
        election_id: electionId
      });

    if (error) throw new Error(getSupabaseErrorMessage(error, 'Unable to create candidate.'));

    await refreshData();
    if (currentUser) {
      addAuditLog(`Created candidate: ${candidateName}`, parseInt(currentUser.id));
    }
  };

  const toggleVoterStatus = (voterId: string) => {
    const voter = voters.find(v => v.voter_id === voterId);
    if (!voter) return;

    const newStatus: VoterStatus = voter.voter_status === 'active' ? 'suspended' : 'active';

    setVoters(prev => prev.map(v => {
      if (v.voter_id === voterId) {
        return { ...v, voter_status: newStatus };
      }
      return v;
    }));

    supabase
      .from('voter')
      .update({ voter_status: newStatus })
      .eq('voter_id', voterId)
      .then(({ error }) => {
        if (error) {
          setVoters(prev => prev.map(v => v.voter_id === voterId ? voter : v));
          return;
        }
        addAuditLog(`Changed voter ${voterId} status to ${newStatus}`, currentUser ? parseInt(currentUser.id) : undefined);
      });
  };

  return (
    <DataContext.Provider value={{
      voters, elections, parties, candidates, participations,
      anonymousVotes, systemUsers, roles, auditLogs,
      currentUser, setCurrentUser, refreshData, addVote, addAuditLog,
      createElection, updateElectionStatus, createParty, updateParty, deleteParty, createCandidate, toggleVoterStatus
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
