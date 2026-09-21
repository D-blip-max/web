export interface AuditLog {
  id: string;
  created_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
  action: string;
  module: string;
}
