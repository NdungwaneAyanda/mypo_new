export interface CreateApplicationDto {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  poAmount: number;
  costOfDelivery: number;
  amountNeeded: number;
  customerName: string;
  paymentTerms: string;
  description?: string;
}

export interface DocumentDto {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export const APPLICATION_DOC_TYPES: { type: string; label: string; required: boolean }[] = [
  { type: 'quote_submitted',      label: 'Submitted Quote',                    required: true  },
  { type: 'company_registration',  label: 'CIPC Document',                      required: true  },
  { type: 'director_id',         label: 'Identity Document of a Director',    required: false },
  { type: 'purchase_order',        label: 'Purchase Order Document',            required: false },
  { type: 'proof_of_address',     label: 'Proof of Address',                    required: false },
];

export const REQUIRED_DOC_TYPES = APPLICATION_DOC_TYPES.filter(d => d.required).map(d => d.type);

const PROOF_OF_ADDRESS_ALIASES = ['proof_of_address', 'company_proof_of_address', 'director_proof_of_address'];

export function documentMatchesSlot(documentType: string, slotType: string): boolean {
  if (documentType === slotType) return true;
  if (slotType === 'proof_of_address') return PROOF_OF_ADDRESS_ALIASES.includes(documentType);
  return false;
}

export interface ApplicationDto {
  id: string;
  userId?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  poAmount: number;
  costOfDelivery: number;
  amountNeeded: number;
  customerName: string;
  paymentTerms: string;
  description?: string;
  status: string;
  refCode?: string;
  assignedFunderId?: string;
  assignedFunderUserId?: string;
  assignedFunderCompany?: string;
  platformFeePercent: number;
  estimatedPlatformFee: number;
  platformFeeAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  documents: DocumentDto[];
}

export interface MessageDto {
  id: string;
  applicationId: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  messageText: string;
  isRead: boolean;
  createdAt: string;
}

export interface RegisterFunderDto {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  companyWebsite?: string;
  yearsInBusiness?: number;
  fundingCapacity?: string;
  fundingDescription?: string;
  industries: string[];
  minPoAmount?: number;
  maxPoAmount?: number;
}

export interface FunderDto {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  companyWebsite?: string;
  yearsInBusiness?: number;
  fundingCapacity?: string;
  fundingDescription?: string;
  industries: string[];
  minPoAmount?: number;
  maxPoAmount?: number;
  isActive: boolean;
  refCode?: string;
  createdAt: string;
}
