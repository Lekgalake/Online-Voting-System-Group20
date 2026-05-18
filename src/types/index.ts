export type ElectionStatus = 'Active' | 'Upcoming' | 'Closed';
export type VoterStatus = 'active' | 'suspended' | 'pending';
export type UserRole = 'System Administrator' | 'Election Administrator' | 'IT Support Team' | 'Auditor' | 'Voter';

export interface Voter {
  voter_id: string;
  full_name: string;
  surname: string;
  race?: string | null;
  password_hash: string;
  voter_status: VoterStatus;
  qualification_status: boolean;
}

export interface Election {
  election_id: number;
  election_name: string;
  election_type: string;
  start_date: string;
  end_date: string;
  status: ElectionStatus;
  result_locked: boolean;
}

export interface Party {
  party_id: number;
  party_name: string;
}

export interface Candidate {
  candidate_id: number;
  candidate_name: string;
  party_id: number;
  election_id: number;
}

export interface Participation {
  participation_id: number;
  voter_id: string;
  election_id: number;
  participation_time: string;
}

export interface AnonymousVote {
  vote_receipt_id: number;
  candidate_id: number;
  election_id: number;
  vote_timestamp: string;
}

export interface SystemUser {
  user_id: number;
  username: string;
  password_hash: string;
  role_id: number;
  log_time: string;
}

export interface Role {
  role_id: number;
  role_name: UserRole;
}

export interface AuditLog {
  log_id: number;
  user_id: number | null;
  voter_id: string | null;
  action: string;
  log_time: string;
}

export interface AppUser {
  id: string;
  displayName: string;
  roleName: UserRole;
  type: 'voter' | 'system_user';
  data: any;
}
