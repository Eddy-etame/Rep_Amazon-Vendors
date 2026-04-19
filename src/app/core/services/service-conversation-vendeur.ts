import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ConversationMessage, VendorConversation } from '../models/modele-conversation';
import {
  VendorConversationDto,
  VendorMessageDto,
  ServiceApiMessagerieVendeur
} from './service-api-messagerie-vendeur';
import { DepotSessionVendeur } from './depot-session-vendeur';

export interface IncomingSocketMessage {
  id?: string;
  conversationId?: string;
  userId: string;
  userName: string;
  vendorId?: string;
  vendorName?: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'vendor';
  content: string;
  subject: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
  sentAt?: string;
}

function normalizeApiError(error: unknown, fallbackMessage: string): Error {
  const message =
    (error as { error?: { error?: { message?: string }; message?: string } })?.error?.error?.message ||
    (error as { error?: { message?: string } })?.error?.message ||
    (error as { message?: string })?.message ||
    fallbackMessage;
  return new Error(message);
}

function sortConversations(a: VendorConversation, b: VendorConversation): number {
  return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
}

function sortMessages(a: ConversationMessage, b: ConversationMessage): number {
  return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
}

function mapConversation(dto: VendorConversationDto): VendorConversation {
  return {
    id: String(dto.id || '').trim(),
    userId: String(dto.userId || '').trim(),
    userName: String(dto.userName || 'Client').trim(),
    vendorId: String(dto.vendorId || '').trim(),
    vendorName: String(dto.vendorName || 'Vendeur').trim(),
    subject: String(dto.subject || 'Conversation client').trim(),
    productId: dto.productId ? String(dto.productId).trim() : undefined,
    productTitle: dto.productTitle ? String(dto.productTitle).trim() : undefined,
    orderId: dto.orderId ? String(dto.orderId).trim() : undefined,
    lastMessageAt: String(dto.lastMessageAt || new Date().toISOString()),
    unreadCount: Math.max(0, Number(dto.unreadByVendor || 0)),
    updatedAt: dto.updatedAt ? String(dto.updatedAt) : undefined,
    messagesLoaded: false,
    messages: []
  };
}

function mapMessage(dto: VendorMessageDto): ConversationMessage {
  return {
    id: String(dto.id || '').trim(),
    senderId: String(dto.senderId || '').trim(),
    senderName: String(dto.senderName || 'Client').trim(),
    senderRole: dto.senderRole,
    content: String(dto.content || '').trim(),
    sentAt: String(dto.sentAt || new Date().toISOString()),
    readByVendor: dto.senderRole === 'vendor' ? true : Boolean(dto.readByVendor)
  };
}

function messageMatchesConversation(dto: VendorMessageDto, conversation: VendorConversation): boolean {
  if (dto.conversationId && dto.conversationId === conversation.id) {
    return true;
  }
  if (String(dto.userId || '').trim() !== conversation.userId) {
    return false;
  }
  if (String(dto.vendorId || '').trim() !== conversation.vendorId) {
    return false;
  }
  if (String(dto.orderId || '').trim() !== String(conversation.orderId || '').trim()) {
    return false;
  }
  return String(dto.productId || '').trim() === String(conversation.productId || '').trim();
}

@Injectable({ providedIn: 'root' })
export class ServiceConversationVendeur {
  private conversations: VendorConversation[] = [];

  constructor(
    private readonly vendorSession: DepotSessionVendeur,
    private readonly messagingApi: ServiceApiMessagerieVendeur
  ) {}

  getAll(): VendorConversation[] {
    return [...this.conversations].sort(sortConversations);
  }

  getById(conversationId: string): VendorConversation | undefined {
    return this.conversations.find((conversation) => conversation.id === conversationId);
  }

  countUnread(): number {
    return this.conversations.reduce((sum, conversation) => sum + Math.max(0, conversation.unreadCount || 0), 0);
  }

  async loadAll(): Promise<VendorConversation[]> {
    try {
      const response = await firstValueFrom(this.messagingApi.listConversations());
      const items = Array.isArray(response.data?.items) ? response.data.items.map(mapConversation) : [];
      this.conversations = items.sort(sortConversations);
      return this.getAll();
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de charger les conversations vendeur.');
    }
  }

  async loadMessages(conversationId: string): Promise<VendorConversation | undefined> {
    const conversation = this.getById(conversationId);
    if (!conversation) {
      return undefined;
    }

    if (!conversation.productId) {
      return this.replaceConversation({
        ...conversation,
        messagesLoaded: true,
        unreadCount: conversation.messages.filter((message) => message.senderRole === 'user' && !message.readByVendor).length
      });
    }

    try {
      const response = await firstValueFrom(this.messagingApi.listByProduct(conversation.productId));
      const messages = Array.isArray(response.data?.items)
        ? response.data.items
            .filter((item) => messageMatchesConversation(item, conversation))
            .map(mapMessage)
            .sort(sortMessages)
        : [];

      return this.replaceConversation({
        ...conversation,
        messages,
        messagesLoaded: true,
        lastMessageAt: messages[messages.length - 1]?.sentAt || conversation.lastMessageAt,
        unreadCount: messages.filter((message) => message.senderRole === 'user' && !message.readByVendor).length
      });
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de charger le fil de messages.');
    }
  }

  markConversationRead(conversationId: string): void {
    const conversation = this.getById(conversationId);
    if (!conversation) {
      return;
    }

    this.replaceConversation({
      ...conversation,
      unreadCount: 0,
      messages: conversation.messages.map((message) =>
        message.senderRole === 'user' ? { ...message, readByVendor: true } : message
      )
    });
  }

  async sendReply(conversationId: string, content: string): Promise<VendorConversation> {
    const conversation = this.getById(conversationId);
    if (!conversation) {
      throw new Error('Conversation introuvable.');
    }

    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Le message est vide.');
    }

    const vendorId = this.vendorSession.vendorId;
    if (!vendorId) {
      throw new Error('Session vendeur introuvable.');
    }

    try {
      const response = await firstValueFrom(
        this.messagingApi.send({
          produitId: conversation.productId,
          productId: conversation.productId,
          destinataireId: conversation.userId,
          userId: conversation.userId,
          vendorId,
          contenu: trimmed,
          content: trimmed,
          subject: conversation.subject,
          productTitle: conversation.productTitle,
          orderId: conversation.orderId
        })
      );

      const dto = response.data;
      if (!dto?.id) {
        throw new Error('Message non confirme par le serveur.');
      }

      return this.mergeIncomingSocketMessage({
        id: dto.id,
        conversationId: dto.conversationId,
        userId: dto.userId,
        userName: conversation.userName,
        vendorId: dto.vendorId,
        vendorName: this.vendorSession.vendorName || conversation.vendorName,
        senderId: dto.senderId,
        senderName: dto.senderName,
        senderRole: dto.senderRole,
        content: dto.content,
        subject: conversation.subject,
        productId: dto.productId,
        productTitle: conversation.productTitle,
        orderId: dto.orderId,
        sentAt: dto.sentAt
      });
    } catch (error) {
      throw normalizeApiError(error, 'Impossible d\'envoyer le message.');
    }
  }

  mergeIncomingSocketMessage(payload: IncomingSocketMessage): VendorConversation {
    const sentAt = payload.sentAt || new Date().toISOString();
    const message: ConversationMessage = {
      id: String(payload.id || `${payload.senderRole}_${Date.now()}`).trim(),
      senderId: String(payload.senderId || '').trim(),
      senderName: String(payload.senderName || 'Client').trim(),
      senderRole: payload.senderRole,
      content: String(payload.content || '').trim(),
      sentAt,
      readByVendor: payload.senderRole === 'vendor'
    };

    const existing =
      this.getById(String(payload.conversationId || '').trim()) ||
      this.conversations.find(
        (conversation) =>
          conversation.userId === String(payload.userId || '').trim() &&
          conversation.vendorId === String(payload.vendorId || this.vendorSession.vendorId || '').trim() &&
          String(conversation.orderId || '').trim() === String(payload.orderId || '').trim() &&
          String(conversation.productId || '').trim() === String(payload.productId || '').trim()
      );

    const baseConversation: VendorConversation =
      existing ||
      mapConversation({
        id: String(payload.conversationId || `conv_${Date.now()}`).trim(),
        userId: String(payload.userId || '').trim(),
        userName: String(payload.userName || 'Client').trim(),
        vendorId: String(payload.vendorId || this.vendorSession.vendorId || '').trim(),
        vendorName: String(payload.vendorName || this.vendorSession.vendorName || 'Vendeur').trim(),
        subject: String(payload.subject || 'Conversation client').trim(),
        productId: payload.productId,
        productTitle: payload.productTitle,
        orderId: payload.orderId,
        lastMessageAt: sentAt,
        unreadByVendor: payload.senderRole === 'user' ? 1 : 0
      });

    const hasMessage = baseConversation.messages.some((existingMessage) => existingMessage.id === message.id);
    const nextMessages = hasMessage ? baseConversation.messages : [...baseConversation.messages, message].sort(sortMessages);

    return this.replaceConversation({
      ...baseConversation,
      lastMessageAt: sentAt,
      messagesLoaded: baseConversation.messagesLoaded || nextMessages.length > 0,
      unreadCount:
        payload.senderRole === 'user'
          ? hasMessage
            ? baseConversation.unreadCount
            : Math.max(0, baseConversation.unreadCount || 0) + 1
          : 0,
      messages: nextMessages
    });
  }

  private replaceConversation(nextConversation: VendorConversation): VendorConversation {
    const remaining = this.conversations.filter((conversation) => conversation.id !== nextConversation.id);
    remaining.push(nextConversation);
    this.conversations = remaining.sort(sortConversations);
    return nextConversation;
  }
}
