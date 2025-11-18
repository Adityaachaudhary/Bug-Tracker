import { useState, FormEvent, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTicket, updateTicket } from '../../store/ticketsSlice';
import type { Database } from '../../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TicketFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  ticket?: Ticket;
  projectMembers?: { id: string; full_name: string }[];
}

export function TicketForm({ isOpen, onClose, projectId, ticket, projectMembers = [] }: TicketFormProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'bug' as 'bug' | 'feature' | 'task',
    assignee_id: '',
    status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title,
        description: ticket.description || '',
        priority: ticket.priority,
        type: ticket.type,
        assignee_id: ticket.assignee_id || '',
        status: ticket.status,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        type: 'bug',
        assignee_id: '',
        status: 'open',
      });
    }
  }, [ticket, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (ticket) {
        await dispatch(updateTicket({
          id: ticket.id,
          ...formData,
          assignee_id: formData.assignee_id || null,
        })).unwrap();
      } else {
        await dispatch(createTicket({
          project_id: projectId,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          type: formData.type,
          reporter_id: currentUser!.id,
          assignee_id: formData.assignee_id || undefined,
        })).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticket ? 'Edit Ticket' : 'Create New Ticket'}
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          fullWidth
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          fullWidth
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'bug' | 'feature' | 'task' })}
            options={[
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: 'Feature' },
              { value: 'task', label: 'Task' },
            ]}
            fullWidth
          />

          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            fullWidth
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {ticket && (
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'in_progress' | 'resolved' | 'closed' })}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
              fullWidth
            />
          )}

          <Select
            label="Assignee"
            value={formData.assignee_id}
            onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
            options={[
              { value: '', label: 'Unassigned' },
              ...projectMembers.map(m => ({ value: m.id, label: m.full_name })),
            ]}
            fullWidth
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
