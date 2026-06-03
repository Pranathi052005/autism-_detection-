import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Stars, LayoutDashboard, UserCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    checkUser();
    window.addEventListener('auth_change', checkUser);
    return () => window.removeEventListener('auth_change', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth_change'));
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bio-glass border-b border-bio-glass-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-bio-glass-100 p-2.5 rounded-bio-lg group-hover:scale-105 transition-transform animate-float bio-glow-rose">
                <Heart className="h-7 w-7 text-bio-rose" />
              </div>
              <span className="font-display font-bold text-2xl tracking-wide text-bio-text-primary bio-stagger-1">
                Early<span className="text-bio-rose text-shadow-glow-rose">Bloom</span>
              </span>
            </Link>
            <div className="hidden sm:ml-12 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 text-sm font-display font-medium transition-all bio-glass-hover rounded-bio ${
                  isActive('/dashboard')
                    ? 'text-bio-teal bio-glow-teal'
                    : 'text-bio-text-secondary hover:text-bio-text-primary'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Family Dashboard
              </Link>
              <Link
                to="/session/new"
                className={`inline-flex items-center px-4 py-2 text-sm font-display font-medium transition-all bio-glass-hover rounded-bio ${
                  isActive('/session/new')
                    ? 'text-bio-rose bio-glow-rose'
                    : 'text-bio-text-secondary hover:text-bio-text-primary'
                }`}
              >
                <Stars className="w-4 h-4 mr-2" />
                Start Assessment
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden lg:flex items-center gap-4 border-r border-bio-glass-100 pr-4 mr-2">
                <div className="flex items-center gap-2 text-bio-text-primary font-body text-sm bio-glass px-3 py-1.5 rounded-full border border-bio-glass-100">
                  <UserCircle className="w-4 h-4 text-bio-teal" />
                  {user.fullName || user.name || 'User'}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-bio-text-secondary hover:text-bio-rose font-body text-sm flex items-center gap-1 transition-colors bio-focus-ring"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium text-bio-text-secondary hover:text-bio-text-primary transition-colors bio-glass-hover rounded-bio bio-focus-ring"
              >
                <UserCircle className="h-5 w-5" />
                Sign In
              </Link>
            )}

            <Link
              to="/session/new"
              className="bio-gradient-border bio-shimmer relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-display font-bold text-bio-text-primary transition-all hover:shadow-bio-glow-rose bio-focus-ring"
            >
              <Stars className="h-5 w-5" />
              <span className="hidden sm:inline">New Assessment</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
