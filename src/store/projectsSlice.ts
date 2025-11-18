import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'];

interface ProjectWithMembers extends Project {
  project_members?: (ProjectMember & { profiles: { id: string; full_name: string; email: string } })[];
  profiles?: { id: string; full_name: string; email: string };
}

interface ProjectsState {
  projects: ProjectWithMembers[];
  currentProject: ProjectWithMembers | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_owner_id_fkey(id, full_name, email),
        project_members(*, profiles(id, full_name, email))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ProjectWithMembers[];
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_owner_id_fkey(id, full_name, email),
        project_members(*, profiles(id, full_name, email))
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data as ProjectWithMembers;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async ({ name, description, ownerId }: { name: string; description: string; ownerId: string }) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: ownerId })
      .select(`
        *,
        profiles!projects_owner_id_fkey(id, full_name, email),
        project_members(*, profiles(id, full_name, email))
      `)
      .single();

    if (error) throw error;
    return data as ProjectWithMembers;
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, name, description, status }: { id: string; name?: string; description?: string; status?: 'active' | 'archived' | 'completed' }) => {
    const { data, error } = await supabase
      .from('projects')
      .update({ name, description, status })
      .eq('id', id)
      .select(`
        *,
        profiles!projects_owner_id_fkey(id, full_name, email),
        project_members(*, profiles(id, full_name, email))
      `)
      .single();

    if (error) throw error;
    return data as ProjectWithMembers;
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return projectId;
  }
);

export const addProjectMember = createAsyncThunk(
  'projects/addProjectMember',
  async ({ projectId, userId, role }: { projectId: string; userId: string; role: 'manager' | 'member' }) => {
    const { data, error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role })
      .select('*, profiles(id, full_name, email)')
      .single();

    if (error) throw error;
    return { projectId, member: data };
  }
);

export const removeProjectMember = createAsyncThunk(
  'projects/removeProjectMember',
  async ({ projectId, memberId }: { projectId: string; memberId: string }) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    return { projectId, memberId };
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.loading = false;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch project';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
        state.currentProject = action.payload;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      });
  },
});

export const { clearCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
