import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const routes = [
  { to: '/search', label: 'Search', icon: Search },
  { to: '/favorites', label: 'Favorites', icon: Heart },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsMenuOpen(false);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <NavLink to="/search" className="text-lg font-semibold">
          Events Around
        </NavLink>
        <nav className="hidden gap-2 md:flex">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.to}
                to={route.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {route.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {isMenuOpen ? (
        <div className="border-t border-border bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <NavLink
                  key={route.to}
                  to={route.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-muted',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {route.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
