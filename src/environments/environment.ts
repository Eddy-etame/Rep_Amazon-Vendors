import { hoteDevServeur } from '../../../shared-frontend/hote-dev-serveur';

const h = hoteDevServeur();

export const environment = {
  production: false,
  apiBaseUrl: `http://${h}:3000/api/v1`,
  /** Buyer storefront (users app) for “Retour au marketplace”. */
  usersAppUrl: `http://${h}:4200`,
  powDifficulty: 3,
  socketUrl: `http://${h}:3004`,
  socketNamespace: '/messages'
};
