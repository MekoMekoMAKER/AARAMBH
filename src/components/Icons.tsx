import React from 'react';

export function Phoenix({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 21c4.418 0 8-3.582 8-8 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 4.418 3.582 8 8 8Z" opacity="0.3" />
      <path d="M12 7c-1.5 1-2.5 3-2.5 5 0 3 2.5 5.5 5.5 5.5s3.5-1.5 3.5-3c0-2-1.5-3.5-3.5-3.5" />
      <path d="M12 7c1.5 1 2.5 3 2.5 5 0 3-2.5 5.5-5.5 5.5S5.5 16 5.5 14.5c0-2 1.5-3.5 3.5-3.5" />
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="m19 12-2 0" />
      <path d="m7 12-2 0" />
      <path d="m17 17-1.5-1.5" />
      <path d="m8.5 8.5-1.5-1.5" />
      <path d="m17 7-1.5 1.5" />
      <path d="m8.5 15.5-1.5 1.5" />
    </svg>
  );
}

export function BrainCircuit({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 .32 4.94 2.5 2.5 0 0 0 1.98 3 2.5 2.5 0 0 0 4.96-.46V4.5Z"/>
      <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1-.32 4.94 2.5 2.5 0 0 1-1.98 3 2.5 2.5 0 0 1-4.96-.46V4.5Z"/>
      <path d="M12 14.5v7"/>
      <path d="M12 21.5h-.5a2.5 2.5 0 0 1 0-5"/>
      <path d="M12 21.5h.5a2.5 2.5 0 0 0 0-5"/>
    </svg>
  );
}
