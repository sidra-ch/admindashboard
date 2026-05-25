'use client';

import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AuditLog = {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

export default function AuditLogsPage() {
  const auditQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiClient<AuditLog[]>('/audit-logs'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Security and operational activity with exact date and time.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {auditQuery.isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading audit logs...</div>
          ) : auditQuery.isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              {auditQuery.error instanceof Error ? auditQuery.error.message : 'Unable to load audit logs.'}
            </div>
          ) : !auditQuery.data?.length ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <History className="h-10 w-10 opacity-30" />
              <p>No audit activity yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditQuery.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-medium">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{getUserName(log)}</TableCell>
                    <TableCell>
                      <Badge variant="info">{log.actionType.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{log.entityType}</p>
                        {log.entityId ? <p className="text-xs text-muted-foreground">{log.entityId}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.ipAddress ?? 'Not captured'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getUserName(log: AuditLog) {
  if (!log.user) return 'System';
  const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ');
  return name || log.user.email;
}
