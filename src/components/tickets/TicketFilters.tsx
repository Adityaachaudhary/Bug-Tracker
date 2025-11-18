import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Search, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFilters, clearFilters } from '../../store/ticketsSlice';

interface TicketFiltersProps {
  projectMembers?: { id: string; full_name: string }[];
}

export function TicketFilters({ projectMembers = [] }: TicketFiltersProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.tickets.filters);

  const handleSearchChange = (value: string) => {
    dispatch(setFilters({ search: value }));
  };

  const handleFilterChange = (key: string, value: string) => {
    const currentValues = filters[key as keyof typeof filters];

    if (key === 'assigneeId') {
      dispatch(setFilters({ [key]: value || null }));
    } else if (Array.isArray(currentValues)) {
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      dispatch(setFilters({ [key]: newValues }));
    }
  };

  const hasActiveFilters = filters.search || filters.status.length > 0 ||
    filters.priority.length > 0 || filters.type.length > 0 || filters.assigneeId;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(clearFilters())}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <div className="space-y-1">
            {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
              <label key={status} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleFilterChange('status', status)}
                  className="mr-2 rounded"
                />
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
          <div className="space-y-1">
            {['low', 'medium', 'high'].map((priority) => (
              <label key={priority} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.priority.includes(priority)}
                  onChange={() => handleFilterChange('priority', priority)}
                  className="mr-2 rounded"
                />
                <span className="capitalize">{priority}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <div className="space-y-1">
            {['bug', 'feature', 'task'].map((type) => (
              <label key={type} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.type.includes(type)}
                  onChange={() => handleFilterChange('type', type)}
                  className="mr-2 rounded"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Select
            label="Assignee"
            value={filters.assigneeId || ''}
            onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
            options={[
              { value: '', label: 'All' },
              ...projectMembers.map(m => ({ value: m.id, label: m.full_name })),
            ]}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
