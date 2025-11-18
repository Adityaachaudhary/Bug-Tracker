import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeAuth, setUser } from './store/authSlice';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/auth/AuthForm';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { TicketsPage } from './pages/TicketsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

type View = 'dashboard' | 'projects' | 'tickets' | 'project-detail';

function AppContent() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    dispatch(initializeAuth());

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          dispatch(setUser({ user: session.user, profile }));
        } else {
          dispatch(setUser({ user: null, profile: null }));
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  };

  const handleNavigate = (view: 'dashboard' | 'projects' | 'tickets') => {
    setCurrentView(view);
    setSelectedProjectId('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={handleNavigate} currentView={currentView === 'project-detail' ? 'projects' : currentView} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'projects' && <ProjectsPage onSelectProject={handleSelectProject} />}
        {currentView === 'tickets' && <TicketsPage />}
        {currentView === 'project-detail' && selectedProjectId && (
          <ProjectDetailPage
            projectId={selectedProjectId}
            onBack={() => setCurrentView('projects')}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
