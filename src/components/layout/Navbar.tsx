import { useState } from 'react';
import { Bug, LogOut, User, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signOut } from '../../store/authSlice';

interface NavbarProps {
  onNavigate: (view: 'dashboard' | 'projects' | 'tickets') => void;
  currentView: 'dashboard' | 'projects' | 'tickets';
}

export function Navbar({ onNavigate, currentView }: NavbarProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.auth.profile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await dispatch(signOut());
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'projects' as const, label: 'Projects' },
    { id: 'tickets' as const, label: 'Tickets' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Bug className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">BugTracker</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${currentView === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{profile.full_name}</span>
                <span className="text-xs text-gray-500 capitalize">({profile.role})</span>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-2 rounded-lg font-medium transition-colors
                  ${currentView === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.label}
              </button>
            ))}

            {profile && (
              <div className="pt-3 border-t border-gray-200">
                <div className="px-4 py-2 text-sm">
                  <div className="font-medium text-gray-900">{profile.full_name}</div>
                  <div className="text-gray-500 capitalize">{profile.role}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  fullWidth
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
