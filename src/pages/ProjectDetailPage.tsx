import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProjectById } from '../store/projectsSlice';
import { fetchTickets } from '../store/ticketsSlice';
import { TicketCard } from '../components/tickets/TicketCard';
import { TicketForm } from '../components/tickets/TicketForm';
import { ProjectForm } from '../components/projects/ProjectForm';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, Plus, Users, Settings } from 'lucide-react';

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const dispatch = useAppDispatch();
  const currentProject = useAppSelector((state) => state.projects.currentProject);
  const tickets = useAppSelector((state) => state.tickets.tickets);
  const profile = useAppSelector((state) => state.auth.profile);
  const loading = useAppSelector((state) => state.projects.loading);

  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectById(projectId));
    dispatch(fetchTickets(projectId));
  }, [dispatch, projectId]);

  const projectMembers = useMemo(() => {
    if (!currentProject?.project_members) return [];

    return currentProject.project_members.map((member) => ({
      id: member.profiles?.id || '',
      full_name: member.profiles?.full_name || '',
      email: member.profiles?.email || '',
      role: member.role,
    }));
  }, [currentProject]);

  const projectTickets = useMemo(() => {
    return tickets.filter(t => t.project_id === projectId);
  }, [tickets, projectId]);

  const ticketStats = useMemo(() => {
    return {
      open: projectTickets.filter(t => t.status === 'open').length,
      inProgress: projectTickets.filter(t => t.status === 'in_progress').length,
      resolved: projectTickets.filter(t => t.status === 'resolved').length,
      closed: projectTickets.filter(t => t.status === 'closed').length,
    };
  }, [projectTickets]);

  const canEdit = profile?.role === 'admin' ||
    currentProject?.owner_id === profile?.id ||
    projectMembers.some(m => m.id === profile?.id && m.role === 'manager');

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
              <Badge
                variant={
                  currentProject.status === 'active' ? 'success' :
                  currentProject.status === 'completed' ? 'info' : 'default'
                }
              >
                {currentProject.status}
              </Badge>
            </div>
            {currentProject.description && (
              <p className="text-gray-600 mt-1">{currentProject.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <Button variant="secondary" onClick={() => setIsProjectFormOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
          <Button onClick={() => setIsTicketFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{ticketStats.open}</p>
              <p className="text-sm text-gray-600 mt-1">Open</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{ticketStats.inProgress}</p>
              <p className="text-sm text-gray-600 mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{ticketStats.resolved}</p>
              <p className="text-sm text-gray-600 mt-1">Resolved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{ticketStats.closed}</p>
              <p className="text-sm text-gray-600 mt-1">Closed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Team Members</h2>
              </div>

              {projectMembers.length === 0 ? (
                <p className="text-sm text-gray-500">No team members yet</p>
              ) : (
                <div className="space-y-2">
                  {projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <Badge size="sm" variant={member.role === 'manager' ? 'info' : 'default'}>
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
          </div>

          {projectTickets.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No tickets yet</p>
                  <Button onClick={() => setIsTicketFormOpen(true)}>
                    Create your first ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>

      <TicketForm
        isOpen={isTicketFormOpen}
        onClose={() => setIsTicketFormOpen(false)}
        projectId={projectId}
        projectMembers={projectMembers}
      />

      {canEdit && (
        <ProjectForm
          isOpen={isProjectFormOpen}
          onClose={() => setIsProjectFormOpen(false)}
          project={currentProject}
        />
      )}
    </div>
  );
}
