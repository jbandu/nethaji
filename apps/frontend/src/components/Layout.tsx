import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavItems = () => {
    const commonItems = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ];

    if (user?.role === 'admin') {
      return [
        ...commonItems,
        { path: '/students', label: 'Students', icon: '👨‍🎓' },
        { path: '/teachers', label: 'Teachers', icon: '👩‍🏫' },
        { path: '/attendance', label: 'Attendance', icon: '📝' },
        { path: '/assessments', label: 'Assessments', icon: '📈' },
        { path: '/incentives', label: 'Incentives', icon: '💰' },
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...commonItems,
        { path: '/my-students', label: 'My Students', icon: '👨‍🎓' },
        { path: '/attendance', label: 'Mark Attendance', icon: '📝' },
        { path: '/assessments', label: 'Assessments', icon: '📈' },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-700">
                Nethaji
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
