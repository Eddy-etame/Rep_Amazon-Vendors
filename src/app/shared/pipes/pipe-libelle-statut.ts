import { Pipe, PipeTransform } from '@angular/core';

const LABELS_COMMANDE: Record<string, string> = {
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée'
};

const LABELS_RETOUR: Record<string, string> = {
  open: 'Ouvert',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  received: 'Reçu',
  refunded: 'Remboursé'
};

@Pipe({ name: 'libelleStatut', standalone: true })
export class PipeLibelleStatut implements PipeTransform {
  transform(value: string | null | undefined, type: 'commande' | 'retour' = 'commande'): string {
    if (!value) return '';
    const map = type === 'retour' ? LABELS_RETOUR : LABELS_COMMANDE;
    return map[value] ?? value;
  }
}
