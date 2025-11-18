import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FolderOpen, Users, Calendar } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectWithDetails extends Project {
  profiles?: { full_name: string };
  project_members?: unknown[];
}

interface ProjectCardProps {
  project: ProjectWithDetails;
  onClick?: () => void;
}

const statusConfig = {
  active: { variant: 'success' as const, label: 'Active' },
  completed: { variant: 'info' as const, label: 'Completed' },
  archived: { variant: 'default' as const, label: 'Archived' },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const createdAt = new Date(project.created_at).toLocaleDateString();
  const memberCount = project.project_members?.length || 0;

  return (
    <Card hover onClick={onClick} className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
          </div>
          <Badge variant={statusConfig[project.status].variant} size="sm">
            {statusConfig[project.status].label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
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
