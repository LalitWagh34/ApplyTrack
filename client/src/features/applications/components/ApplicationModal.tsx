import React from 'react';

export function ApplicationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div>
      {/* Detailed Application Modal with Timeline and Notes */}
    </div>
  );
}
