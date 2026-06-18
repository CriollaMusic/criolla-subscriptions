export interface FamilyMember {
  id: number;
  email: string;
  /** PENDING | ACCEPTED | DECLINED */
  status: string;
  invitedDate: string;
  acceptedDate?: string;
}

export interface FamilyInviteDetails {
  found: boolean;
  ownerName: string;
  email: string;
  status: string;
}

export interface FamilyOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}
