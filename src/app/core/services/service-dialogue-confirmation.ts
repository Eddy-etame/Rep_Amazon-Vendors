import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServiceDialogueConfirmation {
  private confirmCallback: ((result: boolean) => void) | null = null;
  private isOpen = false;

  private _title = '';
  private _message = '';

  get title(): string {
    return this._title;
  }

  get message(): string {
    return this._message;
  }

  get dialogOpen(): boolean {
    return this.isOpen;
  }

  openDialog(title: string, message: string): Promise<boolean> {
    return new Promise(resolve => {
      this._title = title;
      this._message = message;
      this.isOpen = true;
      this.confirmCallback = (result) => {
        this.isOpen = false;
        resolve(result);
      };
    });
  }

  confirm(): void {
    if (this.confirmCallback) {
      this.confirmCallback(true);
    }
  }

  cancel(): void {
    if (this.confirmCallback) {
      this.confirmCallback(false);
    }
  }
}
