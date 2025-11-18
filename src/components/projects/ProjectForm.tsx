import { useState, FormEvent, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createProject, updateProject } from '../../store/projectsSlice';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

export function ProjectForm({ isOpen, onClose, project }: ProjectFormProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'archived' | 'completed',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'active',
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (project) {
        await dispatch(updateProject({
          id: project.id,
          ...formData,
        })).unwrap();
      } else {
        await dispatch(createProject({
          name: formData.name,
          description: formData.description,
          ownerId: currentUser!.id,
        })).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : 'Create New Project'}
      size="md"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

        {project && (
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'archived' | 'completed' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
            fullWidth
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
