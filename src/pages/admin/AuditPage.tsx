import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, Shield, MoreHorizontal, Loader2, Eye, SlidersHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useBanking } from '../../contexts';

const AuditPage = () => {
  const { auditLogs } = useBanking();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.includes(searchTerm);

    const matchesAction = actionFilter === 'all' || log.action.toLowerCase() === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeClass = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'update':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'delete':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'view':
        return 'border-gray-200 bg-gray-50 text-gray-600';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-600';
    }
  };

  const statCards = [
    {
      label: 'Total Activities',
      value: auditLogs.length,
      icon: Shield,
    },
    {
      label: "Today's Activities",
      value: auditLogs.filter(log =>
        new Date(log.timestamp).toDateString() === new Date().toDateString()
      ).length,
      icon: Shield,
    },
    {
      label: 'Unique Users',
      value: new Set(auditLogs.map(log => log.userId)).size,
      icon: Shield,
    },
    {
      label: 'Resources Accessed',
      value: new Set(auditLogs.map(log => log.resource)).size,
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor all system activities and user actions
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-muted-foreground/10 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by user, action, resource..."
              className="h-9 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 w-full gap-1.5 border-dashed sm:w-[140px]">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredLogs.length} of {auditLogs.length} logs
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Shield className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No audit logs found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || actionFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No activities recorded yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Resource</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">IP Address</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="group border-b transition-colors last:border-b-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">{log.userId}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`font-normal ${getActionBadgeClass(log.action)}`}
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="text-sm capitalize">{log.resource}</div>
                    <div className="font-mono text-xs text-muted-foreground">{log.resourceId}</div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                    {log.ipAddress}
                  </td>
                  <td className="px-2 py-3">
                    {(Boolean(log.oldValues) || Boolean(log.newValues)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 size-4" />
                            View Changes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditPage;