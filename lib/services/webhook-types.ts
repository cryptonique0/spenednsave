// Webhook configuration and alert types
export type EventType =
  | 'vault.created'
  | 'vault.settings_updated'
  | 'guardian.added'
  | 'guardian.removed'
  | 'guardian.invitation_sent'
  | 'guardian.invitation_accepted'
  | 'transaction.pending_approval'
  | 'transaction.approved'
  | 'transaction.rejected'
  | 'transaction.completed'