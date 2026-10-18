import React from 'react';

export function KanbanCard({ companyName, roleTitle }: { companyName: string; roleTitle: string }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 shadow-sm transition hover:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-100">{companyName}</h3>
      <p className="mt-1 text-xs text-zinc-400">{roleTitle}</p>
    </div>
  );
}
