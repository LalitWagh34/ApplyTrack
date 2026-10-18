import React from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950">
      {/* Top Navbar / Navigation Header */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
