import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TicketWithDetails extends Ticket {
  reporter?: { id: string; full_name: string; email: string };
  assignee?: { id: string; full_name: string; email: string } | null;
  projects?: { id: string; name: string };
}

interface TicketsState {
  tickets: TicketWithDetails[];
  currentTicket: TicketWithDetails | null;
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    status: string[];
    priority: string[];
    type: string[];
    assigneeId: string | null;
  };
}

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: [],
    priority: [],
    type: [],
    assigneeId: null,
  },
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (projectId?: string) => {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        reporter:profiles!tickets_reporter_id_fkey(id, full_name, email),
        assignee:profiles!tickets_assignee_id_fkey(id, full_name, email),
        projects(id, name)
      `)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TicketWithDetails[];
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId: string) => {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        reporter:profiles!tickets_reporter_id_fkey(id, full_name, email),
        assignee:profiles!tickets_assignee_id_fkey(id, full_name, email),
        projects(id, name)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data as TicketWithDetails;
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticket: {
    project_id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    type: 'bug' | 'feature' | 'task';
    reporter_id: string;
    assignee_id?: string;
  }) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select(`
        *,
        reporter:profiles!tickets_reporter_id_fkey(id, full_name, email),
        assignee:profiles!tickets_assignee_id_fkey(id, full_name, email),
        projects(id, name)
      `)
      .single();

    if (error) throw error;
    return data as TicketWithDetails;
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ id, ...updates }: Partial<Ticket> & { id: string }) => {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        reporter:profiles!tickets_reporter_id_fkey(id, full_name, email),
        assignee:profiles!tickets_assignee_id_fkey(id, full_name, email),
        projects(id, name)
      `)
      .single();

    if (error) throw error;
    return data as TicketWithDetails;
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/deleteTicket',
  async (ticketId: string) => {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
    return ticketId;
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TicketsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        status: [],
        priority: [],
        type: [],
        assigneeId: null,
      };
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.tickets = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
      })
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
        state.loading = false;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ticket';
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload);
        state.currentTicket = action.payload;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter(t => t.id !== action.payload);
        if (state.currentTicket?.id === action.payload) {
          state.currentTicket = null;
        }
      });
  },
});

export const { setFilters, clearFilters, clearCurrentTicket, clearError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
