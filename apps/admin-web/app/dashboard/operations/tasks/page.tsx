'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Check, Clock, AlertCircle } from 'lucide-react';

type Task = {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
};

export default function TasksPage() {
  const session = getStoredSession();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => {
      const params = new URLSearchParams({ tenantId: session?.user.tenantId || '' });
      if (filter !== 'all') params.append('status', filter);
      return apiClient<Task[]>(`/tasks?${params.toString()}`);
    },
    enabled: !!session?.user.tenantId,
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/tasks/${id}/complete?tenantId=${session?.user.tenantId}`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 5) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (priority >= 3) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const pendingCount = tasks?.filter((t) => t.status === 'PENDING').length ?? 0;
  const inProgressCount = tasks?.filter((t) => t.status === 'IN_PROGRESS').length ?? 0;
  const completedCount = tasks?.filter((t) => t.status === 'COMPLETED').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage operational tasks and assignments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Check className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PENDING')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'IN_PROGRESS' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('IN_PROGRESS')}
        >
          In Progress
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('COMPLETED')}
        >
          Completed
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
              <ClipboardList className="h-10 w-10 opacity-30" />
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(task.priority)}
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="info">{task.type.replace(/_/g, ' ')}</Badge>
                      </div>
                      <h3 className="font-medium mb-1">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                        {task.dueAt && (
                          <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>
                        )}
                        {task.completedAt && (
                          <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => completeTaskMutation.mutate(task.id)}
                        disabled={completeTaskMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
