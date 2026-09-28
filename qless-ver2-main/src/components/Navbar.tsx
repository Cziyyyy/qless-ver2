'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ticket, LogOut, FileText, QrCode } from 'lucide-react';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Role-aware home destination
  const getHomeHref = () => {
    if (!user) return '/';
    if (user.role === 'SERVICE_STAFF') return '/service';
    if (user.role === 'DEPARTMENT_STAFF') return '/department';
    if (user.role === 'STUDENT') return '/student/dashboard';
    return '/';
  };

  const handleLogout = async () => {
    const currentRole = user?.role;
    await fetch('/api/auth/logout', { method: 'POST' });
    
    if (currentRole === 'SERVICE_STAFF') {
      router.push('/service/login');
    } else if (currentRole === 'DEPARTMENT_STAFF') {
      router.push('/department/login');
    } else {
      router.push('/student/login');
    }
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href={getHomeHref()} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center font-black text-lg shadow-xs">
                Q
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg font-bold text-gray-900 tracking-tight">Q-Less</span>
                <span className="text-xs font-semibold text-red-700">Mapúa</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold">
            <Link
              href="/kiosk"
              className="text-gray-600 hover:text-red-700 transition-colors flex items-center space-x-1.5"
            >
              <Ticket className="w-4 h-4 text-gray-400" />
              <span>Kiosk</span>
            </Link>

            {user && user.role === 'STUDENT' && (
              <>
                <Link
                  href="/student/dashboard"
                  className={`py-5 transition-colors flex items-center space-x-1.5 border-b-2 ${
                    pathname === '/student/dashboard'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/student/consultation"
                  className={`py-5 transition-colors flex items-center space-x-1 border-b-2 ${
                    pathname === '/student/consultation'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Consultation Form</span>
                </Link>

                <Link
                  href="/student/queue"
                  className={`py-5 transition-colors flex items-center space-x-1.5 border-b-2 ${
                    pathname === '/student/queue'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>My Queue</span>
                </Link>

                <Link
                  href="/student/appointments"
                  className={`py-5 transition-colors flex items-center space-x-1.5 border-b-2 ${
                    pathname === '/student/appointments'
                      ? 'border-red-700 text-red-700 font-bold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Appointments</span>
                </Link>
              </>
            )}

            {user && user.role === 'SERVICE_STAFF' && (
              <Link
                href="/service"
                className="py-5 text-red-700 font-bold border-b-2 border-red-700"
              >
                <span>Service Desk</span>
              </Link>
            )}

            {user && user.role === 'DEPARTMENT_STAFF' && (
              <Link
                href="/department"
                className="py-5 text-red-700 font-bold border-b-2 border-red-700"
              >
                <span>Department Portal</span>
              </Link>
            )}
          </nav>

          {/* User Profile / Portal Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-gray-900">{user.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-700 hover:bg-gray-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-xs font-bold">
                <Link
                  href="/student/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/student/register"
                  className="text-white bg-red-700 hover:bg-red-800 px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
