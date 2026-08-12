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
