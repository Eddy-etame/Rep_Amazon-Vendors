import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { DepotSessionVendeur } from './depot-session-vendeur';

type SocketEventHandler = (payload: unknown) => void;

// Surface minimale du client socket.io qu'on manipule (évite de dépendre des types du SDK).
interface SocketClientLike {
  connected?: boolean;
  on(event: string, handler: SocketEventHandler): void;
  off(event: string, handler?: SocketEventHandler): void;
  emit(event: string, payload?: unknown): void;
  disconnect(): void;
}

type IoFactory = (url: string, opts?: Record<string, unknown>) => SocketClientLike;

/**
 * Client WebSocket du vendeur vers le messaging-service (Socket.IO).
 * Permet de recevoir les messages en temps réel ('message.new') sans recharger la page.
 */
@Injectable({ providedIn: 'root' })
export class ServiceSocketVendeur {
  private socket: SocketClientLike | null = null;

  constructor(private readonly vendorSession: DepotSessionVendeur) {}

  // On mémorise le chargement du script pour ne télécharger le client socket.io qu'une seule fois.
  private loaderPromise: Promise<IoFactory | null> | null = null;

  // Récupère la fabrique io() : déjà sur window si le script est chargé, sinon on l'injecte depuis le CDN.
  private async resolveIoFactory(): Promise<IoFactory | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const fromWindow = (window as Window & { io?: IoFactory }).io;
    if (fromWindow) {
      return fromWindow;
    }

    if (!this.loaderPromise) {
      this.loaderPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
        script.async = true;
        script.onload = () => resolve((window as Window & { io?: IoFactory }).io ?? null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      });
    }

    return this.loaderPromise;
  }

  // Ouvre la connexion WebSocket vers le namespace messagerie en s'identifiant comme vendeur.
  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    const ioFactory = await this.resolveIoFactory();
    const baseUrl = environment.socketUrl?.trim();
    if (!ioFactory || !baseUrl) {
      return false;
    }

    const namespace = environment.socketNamespace?.trim() ?? '';
    const vendorUserId = this.vendorSession.vendorId;
    if (!vendorUserId) {
      return false;
    }
    try {
      // L'identité passée dans `auth` est vérifiée côté serveur (namespace.use) : elle range
      // le vendeur dans sa room privée 'vendor:<id>' pour ne recevoir que ses propres messages.
      this.socket = ioFactory(`${baseUrl}${namespace}`, {
        transports: ['websocket'],
        auth: {
          role: 'vendor',
          userId: vendorUserId,
          vendorId: vendorUserId
        }
      });
      return true;
    } catch {
      this.socket = null;
      return false;
    }
  }

  // Abonne un handler à un événement socket (ex. 'message.new').
  on(event: string, handler: SocketEventHandler): void {
    this.socket?.on(event, handler);
  }

  // Désabonne le handler — appelé au ngOnDestroy du composant pour éviter les fuites mémoire.
  off(event: string, handler?: SocketEventHandler): void {
    this.socket?.off(event, handler);
  }

  emit(event: string, payload?: unknown): void {
    this.socket?.emit(event, payload);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
