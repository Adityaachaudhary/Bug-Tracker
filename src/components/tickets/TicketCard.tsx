import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Bug, Zap, CheckCircle, User, Calendar } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TicketWithDetails extends Ticket {
  assignee?: { id: string; full_name: string } | null;
  reporter?: { id: string; full_name: string };
}

interface TicketCardProps {
  ticket: TicketWithDetails;
  onClick?: () => void;
}

const priorityConfig = {
  low: { variant: 'default' as const, label: 'Low' },
  medium: { variant: 'warning' as const, label: 'Medium' },
  high: { variant: 'danger' as const, label: 'High' },
};

const statusConfig = {
  open: { variant: 'info' as const, label: 'Open' },
  in_progress: { variant: 'warning' as const, label: 'In Progress' },
  resolved: { variant: 'success' as const, label: 'Resolved' },
  closed: { variant: 'default' as const, label: 'Closed' },
};

const typeIcons = {
  bug: Bug,
  feature: Zap,
  task: CheckCircle,
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const TypeIcon = typeIcons[ticket.type];
  const createdAt = new Date(ticket.created_at).toLocaleDateString();

  return (
    <Card hover onClick={onClick} className="transition-all">
      <CardContent>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900 line-clamp-1">{ticket.title}</h3>
          </div>
          <Badge variant={priorityConfig[ticket.priority].variant} size="sm">
            {priorityConfig[ticket.priority].label}
          </Badge>
        </div>

        {ticket.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <Badge variant={statusConfig[ticket.status].variant} size="sm">
              {statusConfig[ticket.status].label}
            </Badge>

            {ticket.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{ticket.assignee.full_name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{createdAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
