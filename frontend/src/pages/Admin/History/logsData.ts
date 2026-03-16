export interface LogEntry {
    id: number;
    type: string;
    user: string;
    action: string;
    date: string;
    status: 'success' | 'warning' | 'info';
    details?: string;
    ip?: string;
}

export const logs: LogEntry[] = [
    { id: 1, type: 'submission', user: 'Julius Caesar', action: 'Submitted new application', date: '2 mins ago', status: 'success', details: 'Applicant ID: APP-2026-001. Course: BSIT. Status: Pending Verification.', ip: '192.168.1.45' },
    { id: 2, type: 'auth', user: 'Admin System', action: 'Failed login attempt detected', date: '45 mins ago', status: 'warning', details: 'Multiple failed attempts from unknown IP address. Account: superadmin.', ip: '45.12.8.122' },
    { id: 3, type: 'system', user: 'Database', action: 'Automatic backup completed', date: '2 hours ago', status: 'info', details: 'Storage: 1.2GB. Integrity Check: Verified. Cloud Sync: Scheduled.', ip: 'Internal' },
    { id: 4, type: 'report', user: 'Admin User', action: 'Exported department statistics', date: '5 hours ago', status: 'success', details: 'Target: All Departments. Format: CSV. Rows: 1,240.', ip: '192.168.1.10' },
    { id: 5, type: 'submission', user: 'Marcus Brutus', action: 'Updated profile details', date: '1 day ago', status: 'success', details: 'Field changed: address_current. Old value: Rome. New value: Pompeii.', ip: '192.168.1.52' },
    { id: 6, type: 'system', user: 'System', action: 'Application deployed to production', date: '1 day ago', status: 'info', details: 'Version: v2.4.1. Server: node-auth-01. Build: Success.', ip: 'Internal' },
];
