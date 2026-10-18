import React from 'react';

export function KanbanColumn({ title }: { title: string }) {
  return (
    <div className="flex w-80 flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-zinc-400">
        <span>{title}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
        {/* Kanban Cards Container */}
      </div>
    </div>
  );
}
