'use client';

import { useState } from 'react';
import { Sidebar } from '../../components/app-shell/sidebar';
import { Topbar } from '../../components/app-shell/topbar';
import { AuthGuard } from '../../components/auth/auth-guard';
import { Sheet, SheetContent, SheetTitle } from '../../components/ui/sheet';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-3 py-3 sm:px-4 lg:px-5"
        style={{ background: '#0B1020', minHeight: '100vh' }}
      >
        <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1900px] gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <Sidebar className="sticky top-3 h-[calc(100vh-1.5rem)]" />
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent className="p-3" style={{ background: '#121A2F', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-col gap-3">
            <Topbar onOpenSidebar={() => setMobileOpen(true)} />
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
