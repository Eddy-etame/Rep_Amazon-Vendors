import { Injectable } from '@angular/core';

import { ConversationMessage, VendorConversation } from '../models/conversation.model';
import { VendorSessionStore } from './vendor-session.store';

const KEY = 'vendor_conversations';
const FALLBACK_VENDOR_ID = 'vendor_demo_01';
const FALLBACK_VENDOR_NAME = 'Amaz Vendor';

export interface IncomingUserMessageInput {
  conversationId?: string;
  userId: string;
  userName: string;
  content: string;
  subject: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
}

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

@Injectable({ providedIn: 'root' })
export class VendorConversationService {
  constructor(private readonly vendorSession: VendorSessionStore) {}

  private get vendorId(): string {
    return this.vendorSession.vendorId || FALLBACK_VENDOR_ID;
  }

  private get vendorName(): string {
    return this.vendorSession.vendorName || FALLBACK_VENDOR_NAME;
  }

  private read(): VendorConversation[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as VendorConversation[];
    } catch {
      return [];
    }
  }

  private write(conversations: VendorConversation[]): void {
    localStorage.setItem(KEY, JSON.stringify(conversations));
  }

  private buildMessageId(): string {
    return `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  private buildConversationId(): string {
    return `conv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  seedIfEmpty(vendorIdOverride?: string, vendorNameOverride?: string): void {
    if (this.read().length > 0) {
      return;
    }

    const vId = vendorIdOverride ?? this.vendorId;
    const vName = vendorNameOverride ?? this.vendorName;
    const now = Date.now();
    const seeded: VendorConversation[] = [
      {
        id: `conv_seed_${now}`,
        userId: 'usr_amy_001',
        userName: 'Amy',
        vendorId: vId,
        vendorName: vName,
        subject: 'Question sur la livraison',
        orderId: 'cmd-1036',
        productId: 'prd-casque-01',
        productTitle: 'Casque Bluetooth Premium',
        lastMessageAt: new Date(now - 1000 * 60 * 20).toISOString(),
        messages: [
          {
            id: `msg_seed_${now}_1`,
            senderId: 'usr_amy_001',
            senderName: 'Amy',
            senderRole: 'user',
            content: 'Bonjour, la commande cmd-1036 sera livrée quand ?',
            sentAt: new Date(now - 1000 * 60 * 35).toISOString(),
            readByVendor: false
          },
          {
            id: `msg_seed_${now}_2`,
            senderId: vId,
            senderName: vName,
            senderRole: 'vendor',
            content: 'Bonjour Amy, livraison prévue entre 3 et 5 jours ouvrés.',
            sentAt: new Date(now - 1000 * 60 * 20).toISOString(),
            readByVendor: true
          }
        ]
      },
      {
        id: `conv_seed_${now + 1}`,
        userId: 'usr_lina_002',
        userName: 'Lina',
        vendorId: vId,
        vendorName: vName,
        subject: 'Compatibilité produit',
        productId: 'prd-watch-02',
        productTitle: 'Montre Connectée Sport',
        lastMessageAt: new Date(now - 1000 * 60 * 90).toISOString(),
        messages: [
          {
            id: `msg_seed_${now}_3`,
            senderId: 'usr_lina_002',
            senderName: 'Lina',
            senderRole: 'user',
            content: 'Est-ce compatible iOS 17 ?',
            sentAt: new Date(now - 1000 * 60 * 95).toISOString(),
            readByVendor: false
          }
        ]
      }
    ];

    this.write(seeded);
  }

  getAll(): VendorConversation[] {
    return this.read().sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  getById(conversationId: string): VendorConversation | undefined {
    return this.read().find((c) => c.id === conversationId);
  }

  countUnread(): number {
    return this.read().reduce((sum, conv) => {
      const unread = conv.messages.filter((m) => m.senderRole === 'user' && !m.readByVendor).length;
      return sum + unread;
    }, 0);
  }

  markConversationRead(conversationId: string): void {
    const conversations = this.read();
    const index = conversations.findIndex((c) => c.id === conversationId);
    if (index < 0) {
      return;
    }
    conversations[index] = {
      ...conversations[index],
      messages: conversations[index].messages.map((m) =>
        m.senderRole === 'user' ? { ...m, readByVendor: true } : m
      )
    };
    this.write(conversations);
  }

  sendReply(conversationId: string, content: string): VendorConversation | undefined {
    const trimmed = content.trim();
    if (!trimmed) {
      return undefined;
    }

    const conversations = this.read();
    const index = conversations.findIndex((c) => c.id === conversationId);
    if (index < 0) {
      return undefined;
    }

    const message: ConversationMessage = {
      id: this.buildMessageId(),
      senderId: this.vendorId,
      senderName: this.vendorName,
      senderRole: 'vendor',
      content: trimmed,
      sentAt: new Date().toISOString(),
      readByVendor: true
    };

    const updated: VendorConversation = {
      ...conversations[index],
      lastMessageAt: message.sentAt,
      messages: [...conversations[index].messages, message]
    };

    conversations[index] = updated;
    this.write(conversations);
    return updated;
  }

  pushUserMessage(input: IncomingUserMessageInput): VendorConversation {
    const trimmed = input.content.trim();
    const conversations = this.read();
    const nowIso = new Date().toISOString();

    if (input.conversationId) {
      const existingIndex = conversations.findIndex((c) => c.id === input.conversationId);
      if (existingIndex >= 0) {
        const message: ConversationMessage = {
          id: this.buildMessageId(),
          senderId: input.userId,
          senderName: input.userName,
          senderRole: 'user',
          content: trimmed,
          sentAt: nowIso,
          readByVendor: false
        };
        const updated: VendorConversation = {
          ...conversations[existingIndex],
          lastMessageAt: nowIso,
          messages: [...conversations[existingIndex].messages, message]
        };
        conversations[existingIndex] = updated;
        this.write(conversations);
        return updated;
      }
    }

    const created: VendorConversation = {
      id: this.buildConversationId(),
      userId: input.userId,
      userName: input.userName,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      subject: input.subject,
      productId: input.productId,
      productTitle: input.productTitle,
      orderId: input.orderId,
      lastMessageAt: nowIso,
      messages: [
        {
          id: this.buildMessageId(),
          senderId: input.userId,
          senderName: input.userName,
          senderRole: 'user',
          content: trimmed,
          sentAt: nowIso,
          readByVendor: false
        }
      ]
    };

    conversations.unshift(created);
    this.write(conversations);
    return created;
  }

  upsertIncomingSocketMessage(payload: IncomingSocketMessage): VendorConversation {
    const nowIso = payload.sentAt ?? new Date().toISOString();
    const conversations = this.read();
    const conversationId = payload.conversationId?.trim() || this.buildConversationId();
    const index = conversations.findIndex((c) => c.id === conversationId);

    const message: ConversationMessage = {
      id: payload.id ?? this.buildMessageId(),
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      content: payload.content.trim(),
      sentAt: nowIso,
      readByVendor: payload.senderRole === 'vendor'
    };

    if (index >= 0) {
      const updated: VendorConversation = {
        ...conversations[index],
        lastMessageAt: nowIso,
        messages: [...conversations[index].messages, message]
      };
      conversations[index] = updated;
      this.write(conversations);
      return updated;
    }

    const created: VendorConversation = {
      id: conversationId,
      userId: payload.userId,
      userName: payload.userName,
      vendorId: payload.vendorId ?? this.vendorId,
      vendorName: payload.vendorName ?? this.vendorName,
      subject: payload.subject,
      productId: payload.productId,
      productTitle: payload.productTitle,
      orderId: payload.orderId,
      lastMessageAt: nowIso,
      messages: [message]
    };

    conversations.unshift(created);
    this.write(conversations);
    return created;
  }
}
