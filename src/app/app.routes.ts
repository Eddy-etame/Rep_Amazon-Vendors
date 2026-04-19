import { Routes } from '@angular/router';
import { TableauDeBord } from './features/tableau-de-bord/tableau-de-bord';
import { ProduitsVendeur } from './features/produits-vendeur/produits-vendeur';
import { FormulaireProduit } from './features/formulaire-produit/formulaire-produit';
import { Messagerie } from './features/messagerie/messagerie';
import { CommandesVendeur } from './features/commandes-vendeur/commandes-vendeur';
import { Retours } from './features/retours/retours';
import { ConnexionVendeur } from './features/connexion-vendeur/connexion-vendeur';
import { InscriptionVendeur } from './features/inscription-vendeur/inscription-vendeur';
import { gardeAuthVendeur } from './core/guards/garde-auth-vendeur';

export const routes: Routes = [
  { path: '', redirectTo: 'vendeur/tableau-de-bord', pathMatch: 'full' },
  { path: 'vendeur/connexion', component: ConnexionVendeur },
  { path: 'vendeur/inscription', component: InscriptionVendeur },
  { path: 'vendeur/tableau-de-bord', component: TableauDeBord, canActivate: [gardeAuthVendeur] },
  { path: 'vendeur/produits', component: ProduitsVendeur, canActivate: [gardeAuthVendeur] },
  { path: 'vendeur/commandes', component: CommandesVendeur, canActivate: [gardeAuthVendeur] },
  { path: 'vendeur/retours', component: Retours, canActivate: [gardeAuthVendeur] },
  { path: 'vendeur/messagerie', component: Messagerie, canActivate: [gardeAuthVendeur] },
  { path: 'vendeur/produit/nouveau', component: FormulaireProduit, canActivate: [gardeAuthVendeur] },
  { path: 'vendeur/produit/:id/modifier', component: FormulaireProduit, canActivate: [gardeAuthVendeur] },
  { path: '**', redirectTo: 'vendeur/tableau-de-bord' }
];
