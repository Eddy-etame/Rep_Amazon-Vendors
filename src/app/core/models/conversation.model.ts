export type ParticipantRole = 'user' | 'vendor';

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  content: string;
  sentAt: string;
  readByVendor: boolean;
}

export interface VendorConversation {
  id: string;
  userId: string;
  userName: string;
  vendorId: string;
  vendorName: string;
  subject: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
  lastMessageAt: string;
  messages: ConversationMessage[];
}
