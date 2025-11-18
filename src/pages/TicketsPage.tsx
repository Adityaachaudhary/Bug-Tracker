import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTickets } from '../store/ticketsSlice';
import { fetchProjects } from '../store/projectsSlice';
import { TicketCard } from '../components/tickets/TicketCard';
import { TicketForm } from '../components/tickets/TicketForm';
import { TicketFilters } from '../components/tickets/TicketFilters';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Plus } from 'lucide-react';

export function TicketsPage() {
  const dispatch = useAppDispatch();
  const tickets = useAppSelector((state) => state.tickets.tickets);
  const projects = useAppSelector((state) => state.projects.projects);
  const filters = useAppSelector((state) => state.tickets.filters);
  const loading = useAppSelector((state) => state.tickets.loading);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTickets());
  }, [dispatch]);

  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const projectMembers = useMemo(() => {
    if (!currentProject?.project_members) return [];

    return currentProject.project_members.map((member) => ({
      id: member.profiles?.id || '',
      full_name: member.profiles?.full_name || '',
    }));
  }, [currentProject]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.search && !ticket.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !ticket.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      if (filters.status.length > 0 && !filters.status.includes(ticket.status)) {
        return false;
      }

      if (filters.priority.length > 0 && !filters.priority.includes(ticket.priority)) {
        return false;
      }

      if (filters.type.length > 0 && !filters.type.includes(ticket.type)) {
        return false;
      }

      if (filters.assigneeId && ticket.assignee_id !== filters.assigneeId) {
        return false;
      }

      if (selectedProjectId && ticket.project_id !== selectedProjectId) {
        return false;
      }

      return true;
    });
  }, [tickets, filters, selectedProjectId]);

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">Track and manage all your bugs and tasks</p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map(p => ({ value: p.id, label: p.name })),
            ]}
          />

          {selectedProjectId && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          )}
        </div>
      </div>

      <TicketFilters projectMembers={projectMembers} />

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
          </p>
          {selectedProjectId && tickets.length === 0 && (
            <Button onClick={() => setIsFormOpen(true)}>
              Create your first ticket
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {selectedProjectId && (
        <TicketForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          projectId={selectedProjectId}
          projectMembers={projectMembers}
        />
      )}
    </div>
  );
}
