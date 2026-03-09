import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

type SocketEventHandler = (payload: unknown) => void;

interface SocketClientLike {
  connected?: boolean;
  on(event: string, handler: SocketEventHandler): void;
  off(event: string, handler?: SocketEventHandler): void;
  emit(event: string, payload?: unknown): void;
  disconnect(): void;
}

type IoFactory = (url: string, opts?: Record<string, unknown>) => SocketClientLike;

@Injectable({ providedIn: 'root' })
export class VendorSocketService {
  private socket: SocketClientLike | null = null;
  private loaderPromise: Promise<IoFactory | null> | null = null;

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
    const vendorUserId = environment.vendorSocketUserId?.trim() || 'vendor_demo_01';
    try {
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

  on(event: string, handler: SocketEventHandler): void {
    this.socket?.on(event, handler);
  }

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
