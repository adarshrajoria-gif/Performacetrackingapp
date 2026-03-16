import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PenLine, Flag, Settings, Zap, Cloud, HardDrive } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/log', label: 'Smart Log', icon: PenLine },
  { to: '/initiatives', label: 'Initiatives', icon: Flag },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Layout({ sheetsConnected }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Topbar */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Zap size={14} className="text-cyan-400" />
            </div>
            <span className="font-semibold text-gray-100 text-sm tracking-tight">InitiativeTracker</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'tab-active' : 'tab-inactive'
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Connection status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {sheetsConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                <Cloud size={11} />
                <span className="hidden sm:inline">Sheets</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-full">
                <HardDrive size={11} />
                <span className="hidden sm:inline">Local</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-3 text-center">
        <p className="text-xs text-gray-600">InitiativeTracker — {sheetsConnected ? 'synced with Google Sheets' : 'data stored locally'}</p>
      </footer>
    </div>
  );
}
