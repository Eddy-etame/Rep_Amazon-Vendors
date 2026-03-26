import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { VendorConversation } from '../../core/models/conversation.model';
import { NotificationService } from '../../core/services/notification.service';
import {
  IncomingSocketMessage,
  VendorConversationService
} from '../../core/services/vendor-conversation.service';
import { VendorMessagingApiService } from '../../core/services/vendor-messaging-api.service';
import { VendorSessionStore } from '../../core/services/vendor-session.store';
import { VendorSocketService } from '../../core/services/vendor-socket.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.scss'
})
export class Messages implements OnInit, OnDestroy {
  conversations: VendorConversation[] = [];
  selectedConversationId: string | null = null;
  replyDraft = '';

  private get vendorId(): string {
    return this.vendorSession.vendorId || 'vendor_demo_01';
  }

  private get vendorName(): string {
    return this.vendorSession.vendorName || 'Amaz Vendor';
  }

  private readonly socketHandler = (payload: unknown) => {
    const incoming = payload as Partial<IncomingSocketMessage>;
    if (!incoming?.senderRole || !incoming.senderId || !incoming.content || !incoming.userId || !incoming.userName) {
      return;
    }
    if (incoming.senderRole === 'vendor' && incoming.senderId === this.vendorId) {
      return;
    }
    this.conversationsService.upsertIncomingSocketMessage({
      id: incoming.id,
      conversationId: incoming.conversationId,
      userId: incoming.userId,
      userName: incoming.userName,
      vendorId: incoming.vendorId,
      vendorName: incoming.vendorName,
      senderId: incoming.senderId,
      senderName: incoming.senderName ?? 'Client',
      senderRole: incoming.senderRole,
      content: incoming.content,
      subject: incoming.subject ?? 'Message client',
      productId: incoming.productId,
      productTitle: incoming.productTitle,
      orderId: incoming.orderId,
      sentAt: incoming.sentAt
    });
    this.refresh();
  };

  constructor(
    private readonly conversationsService: VendorConversationService,
    private readonly notifications: NotificationService,
    private readonly socketService: VendorSocketService,
    private readonly vendorSession: VendorSessionStore,
    private readonly messagingApi: VendorMessagingApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.vendorSession.load();
    this.conversationsService.seedIfEmpty(this.vendorId, this.vendorName);
    this.refresh();
    if (!this.selectedConversationId && this.conversations.length > 0) {
      this.selectConversation(this.conversations[0].id);
    }
    void this.connectSocket();
  }

  ngOnDestroy(): void {
    this.socketService.off('message.new', this.socketHandler);
  }

  get selectedConversation(): VendorConversation | undefined {
    if (!this.selectedConversationId) {
      return undefined;
    }
    return this.conversations.find((c) => c.id === this.selectedConversationId);
  }

  trackByConversation(_: number, conversation: VendorConversation): string {
    return conversation.id;
  }

  unreadFor(conversation: VendorConversation): number {
    return conversation.messages.filter((m) => m.senderRole === 'user' && !m.readByVendor).length;
  }

  selectConversation(conversationId: string): void {
    this.selectedConversationId = conversationId;
    this.conversationsService.markConversationRead(conversationId);
    this.refresh();
    const active = this.selectedConversation;
    if (active?.productId) {
      void firstValueFrom(this.messagingApi.listByProduct(active.productId)).catch(() => undefined);
    }
  }

  async sendReply(): Promise<void> {
    const selected = this.selectedConversation;
    if (!selected) {
      return;
    }
    const content = this.replyDraft.trim();
    if (!content) {
      this.notifications.warning('Le message est vide.');
      return;
    }
    const updated = this.conversationsService.sendReply(selected.id, content);
    if (!updated) {
      this.notifications.error('Impossible d’envoyer le message.');
      return;
    }

    this.socketService.emit('message.new', {
      conversationId: selected.id,
      senderId: this.vendorId,
      senderName: this.vendorName,
      senderRole: 'vendor',
      userId: selected.userId,
      userName: selected.userName,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      content,
      subject: selected.subject,
      productId: selected.productId,
      productTitle: selected.productTitle,
      orderId: selected.orderId,
      sentAt: new Date().toISOString()
    } satisfies IncomingSocketMessage);

    void firstValueFrom(
      this.messagingApi.send({
        produitId: selected.productId,
        productId: selected.productId,
        destinataireId: selected.userId,
        userId: selected.userId,
        vendorId: this.vendorId,
        contenu: content,
        content,
        subject: selected.subject,
        productTitle: selected.productTitle,
        orderId: selected.orderId
      })
    ).catch(() => undefined);

    this.replyDraft = '';
    this.refresh();
    this.notifications.success('Réponse envoyée.');
  }

  private async connectSocket(): Promise<void> {
    const connected = await this.socketService.connect();
    if (!connected) {
      this.notifications.info('Messagerie en mode fallback (REST/local).');
      return;
    }
    this.socketService.on('message.new', this.socketHandler);
  }

  private refresh(): void {
    this.conversations = this.conversationsService.getAll();
  }
}
