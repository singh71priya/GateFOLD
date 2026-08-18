import React from 'react';

export default function LoadingOverlay({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
}
