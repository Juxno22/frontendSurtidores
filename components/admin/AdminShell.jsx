'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  PackageCheck,
  ShieldCheck,
  Store,
  Users,
  UsersRound,
  UserCheck,
  Warehouse,
  Download,
  Activity,
  UserCheck2,
} from 'lucide-react';
import UserAccountMenu from '@/components/UserAccountMenu';
import AuthGuard from '@/components/AuthGuard';

const NAV_ADMIN = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Prod. surtidores',
    href: '/admin/productividad/surtidores',
    icon: Activity
  },
  {
    label: 'Prod. checadores',
    href: '/admin/productividad/checadores',
    icon: UserCheck
  },
  {
    label: 'Prod. integral',
    href: '/admin/productividad/integral',
    icon: UsersRound
  },
  {
    label: 'Exportaciones',
    href: '/admin/exportaciones',
    icon: Download
  },
  {
    label: 'Sesiones',
    href: '/admin/sesiones',
    icon: ClipboardList
  },
  {
    label: 'Reporte grupal',
    href: '/admin/reporte-grupal',
    icon: FileSpreadsheet
  },
  {
    label: 'Surtidores',
    href: '/admin/surtidores',
    icon: Warehouse
  },
  {
    label: 'Checadores',
    href: '/admin/checadores',
    icon: UserCheck
  },
  {
    label: 'Sucursales',
    href: '/admin/sucursales',
    icon: Store
  },
  {
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users
  },
  {
    label: 'Auditoría',
    href: '/admin/auditoria',
    icon: ShieldCheck
  }
];

const NAV_SUPERVISOR = [
  {
    label: 'Dashboard',
    href: '/supervisor/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Prod. surtidores',
    href: '/supervisor/productividad/surtidores',
    icon: Activity
  },
  {
    label: 'Prod. checadores',
    href: '/supervisor/productividad/checadores',
    icon: UserCheck
  },
  {
    label: 'Prod. integral',
    href: '/supervisor/productividad/integral',
    icon: UsersRound
  },
  {
    label: 'Sesiones',
    href: '/supervisor/sesiones',
    icon: ClipboardList
  },
  {
    label: 'Reporte grupal',
    href: '/supervisor/reporte-grupal',
    icon: FileSpreadsheet
  },
  {
    label: 'Surtidores',
    href: '/supervisor/surtidores',
    icon: Warehouse
  },
  {
    label: 'Checadores',
    href: '/supervisor/checadores',
    icon: UserCheck
  },
  {
    label: 'Exportaciones',
    href: '/supervisor/exportaciones',
    icon: Download
  }
];

function SidebarItem({ item, active }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-400 opacity-60">
        <Icon size={18} />
        <span>{item.label}</span>
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className={[
        'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
        active
          ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-red-500/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
      ].join(' ')}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </a>
  );
}

function AdminShellContent({ children, title, subtitle, role }) {
  const pathname = usePathname();
  const navItems = useMemo(() => {
    return role === 'ADMIN' ? NAV_ADMIN : NAV_SUPERVISOR;
  }, [role]);

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-slate-200 bg-white xl:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-lg">
                <PackageCheck size={25} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Productividad
                </p>
                <h1 className="text-lg font-black leading-tight text-slate-950">
                  Surtidores
                </h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            {navItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                active={pathname === item.href}
              />
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <UserAccountMenu />
          </div>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm xl:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Panel {role === 'ADMIN' ? 'Administrador' : 'Supervisor'}
                </p>
                <h2 className="text-xl font-black text-slate-950">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="xl:hidden">
              <UserAccountMenu compact />
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({
  children,
  title = 'Dashboard',
  subtitle = '',
  role = 'ADMIN'
}) {
  const roles = role === 'ADMIN'
    ? ['ADMIN']
    : ['SUPERVISOR'];

  return (
    <AuthGuard roles={roles}>
      <AdminShellContent title={title} subtitle={subtitle} role={role}>
        {children}
      </AdminShellContent>
    </AuthGuard>
  );
}