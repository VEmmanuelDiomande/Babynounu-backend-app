export const APP_CONSTANTS = {
  MAX_CONNECTIONS_PER_USER: 5,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
  SOCKET_RECONNECT_BASE_MS: 1000,
  SOCKET_RECONNECT_MAX_MS: 30000,
  SUBSCRIPTION_DURATION_DAYS: 30,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'Utilisateur introuvable',
  USER_ALREADY_EXISTS: 'Cet email est déjà utilisé',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  ROOM_NOT_FOUND: 'Conversation introuvable',
  NOT_ROOM_MEMBER: 'Vous n\'êtes pas membre de cette conversation',
  SUBSCRIPTION_EXPIRED: 'Votre abonnement a expiré',
  INSUFFICIENT_POINTS: 'Points insuffisants',
  PROFILE_NOT_FOUND: 'Profil introuvable',
  JOB_NOT_FOUND: 'Offre introuvable',
} as const;
