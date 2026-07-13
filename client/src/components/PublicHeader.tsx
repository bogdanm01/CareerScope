import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { Moon, Sun } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAppTheme } from './ThemeContext';

type PublicHeaderProps = {
  actions: ReactNode;
  sticky?: boolean;
};

const navItems = [
  { to: '/jobs', label: 'Jobs' },
  { to: '/companies', label: 'Companies' },
];

export const PublicHeader = ({ actions, sticky = false }: PublicHeaderProps) => {
  const { theme, setTheme } = useAppTheme();
  const isDark = theme === 'dark';

  return (
    <header className={`${sticky ? 'sticky top-0 z-30 ' : ''}border-b border-divider bg-content1`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link className="text-lg font-medium tracking-[-0.01em] text-foreground" to="/">
          CareerScope
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand text-brand-foreground'
                    : 'text-foreground-500 hover:bg-content2 hover:text-foreground',
                ].join(' ')
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-9 w-9 min-w-9 border border-divider bg-content1 text-foreground-500 hover:bg-content2 hover:text-foreground"
            variant="ghost"
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
          </Button>
          {actions}
        </div>
      </div>
    </header>
  );
};
