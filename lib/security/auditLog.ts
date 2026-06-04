type AuditEvent = {
  actor?: string;
  action: string;
  target: string;
  metadata?: Record<string, unknown>;
};

export async function auditLog(event: AuditEvent) {
  console.info("[AUDIT]", {
    ...event,
    at: new Date().toISOString()
  });
}
