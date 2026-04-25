import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VendorConversation } from '../../core/models/modele-conversation';
import { ServiceNotification } from '../../core/services/service-notification';
import {
  IncomingSocketMessage,
  ServiceConversationVendeur
} from '../../core/services/service-conversation-vendeur';
import { DepotSessionVendeur } from '../../core/services/depot-session-vendeur';
import { ServiceSocketVendeur } from '../../core/services/service-socket-vendeur';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messagerie.html',
  styleUrl: './messagerie.scss'
})
export class Messagerie implements OnInit, OnDestroy {
  conversations: VendorConversation[] = [];
  selectedConversationId: string | null = null;
  replyDraft = '';
  loading = false;
  loadError: string | null = null;
  threadLoading = false;
  threadError: string | null = null;
  sendPending = false;

  private readonly socketHandler = (payload: unknown) => {
    const incoming = payload as Partial<IncomingSocketMessage>;
    if (!incoming?.senderRole || !incoming.senderId || !incoming.content || !incoming.userId || !incoming.userName) {
      return;
    }
    if (incoming.senderRole === 'vendor' && incoming.senderId === this.vendorSession.vendorId) {
      return;
    }
    const updated = this.conversationsService.mergeIncomingSocketMessage({
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
    if (updated.id === this.selectedConversationId) {
      this.conversationsService.markConversationRead(updated.id);
    }
    this.refresh();
    this.syncView();
  };

  constructor(
    private readonly conversationsService: ServiceConversationVendeur,
    private readonly notifications: ServiceNotification,
    private readonly socketService: ServiceSocketVendeur,
    private readonly vendorSession: DepotSessionVendeur,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.vendorSession.load();
    if (!this.vendorSession.vendorId) {
      this.loadError = 'Session vendeur introuvable. Reconnectez-vous pour charger la messagerie.';
      this.notifications.warning(this.loadError);
      this.syncView();
      return;
    }
    await this.loadConversations();
    void this.connectSocket();
    this.syncView();
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
    return conversation.unreadCount;
  }

  async selectConversation(conversationId: string): Promise<void> {
    this.selectedConversationId = conversationId;
    this.threadLoading = true;
    this.threadError = null;
    this.syncView();
    try {
      await this.conversationsService.loadMessages(conversationId);
      this.conversationsService.markConversationRead(conversationId);
    } catch (e) {
      this.threadError = e instanceof Error ? e.message : 'Impossible de charger ce fil.';
      this.notifications.error(this.threadError);
    } finally {
      this.threadLoading = false;
      this.refresh();
      this.syncView();
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
    this.sendPending = true;
    this.syncView();
    try {
      await this.conversationsService.sendReply(selected.id, content);
      this.replyDraft = '';
      this.refresh();
      this.notifications.success('Réponse envoyée.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible d\'envoyer le message.';
      this.notifications.error(msg);
    } finally {
      this.sendPending = false;
      this.syncView();
    }
  }

  private async connectSocket(): Promise<void> {
    const connected = await this.socketService.connect();
    if (!connected) {
      this.notifications.info('Socket vendeur indisponible. Les conversations restent chargées via API.');
      this.syncView();
      return;
    }
    this.socketService.on('message.new', this.socketHandler);
    this.syncView();
  }

  private async loadConversations(): Promise<void> {
    this.loading = true;
    this.loadError = null;
    this.syncView();
    try {
      this.conversations = await this.conversationsService.loadAll();
      const preferred = this.selectedConversationId || this.conversations[0]?.id || null;
      this.selectedConversationId = preferred;
      if (preferred) {
        await this.selectConversation(preferred);
        return;
      }
    } catch (e) {
      this.conversations = this.conversationsService.getAll();
      this.loadError = e instanceof Error ? e.message : 'Impossible de charger les conversations.';
      this.notifications.error(this.loadError);
    } finally {
      this.loading = false;
    }
    this.refresh();
    this.syncView();
  }

  private refresh(): void {
    this.conversations = this.conversationsService.getAll();
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
