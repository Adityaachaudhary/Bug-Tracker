import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProjects } from '../store/projectsSlice';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectForm } from '../components/projects/ProjectForm';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

interface ProjectsPageProps {
  onSelectProject: (projectId: string) => void;
}

export function ProjectsPage({ onSelectProject }: ProjectsPageProps) {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.projects.projects);
  const profile = useAppSelector((state) => state.auth.profile);
  const loading = useAppSelector((state) => state.projects.loading);

  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const canCreateProject = profile?.role === 'admin' || profile?.role === 'manager';

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your bug tracking projects</p>
        </div>

        {canCreateProject && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No projects yet</p>
          {canCreateProject && (
            <Button onClick={() => setIsFormOpen(true)}>
              Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project.id)}
            />
          ))}
        </div>
      )}

      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
