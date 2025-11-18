import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProjects } from '../store/projectsSlice';
import { fetchTickets } from '../store/ticketsSlice';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FolderOpen, Bug, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.projects);
  const tickets = useAppSelector((state) => state.tickets.tickets);
  const loading = useAppSelector((state) => state.projects.loading || state.tickets.loading);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTickets());
  }, [dispatch]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const highPriorityTickets = tickets.filter(t => t.priority === 'high' && t.status !== 'closed' && t.status !== 'resolved').length;

    return {
      activeProjects,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
    };
  }, [projects, tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [tickets]);

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: Bug,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'In Progress',
      value: stats.inProgressTickets,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Resolved',
      value: stats.resolvedTickets,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'High Priority',
      value: stats.highPriorityTickets,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your projects and tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent tickets</p>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <Bug className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            ticket.priority === 'high' ? 'danger' :
                            ticket.priority === 'medium' ? 'warning' : 'default'
                          }
                          size="sm"
                        >
                          {ticket.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
              <FolderOpen className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {projects.filter(p => p.status === 'active').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active projects</p>
            ) : (
              <div className="space-y-3">
                {projects.filter(p => p.status === 'active').slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <FolderOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
