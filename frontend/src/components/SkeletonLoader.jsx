import React from 'react';

export default function SkeletonLoader({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-xl animate-pulse"
        >
          {/* Header pill & benefit placeholder */}
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 rounded-full bg-slate-800"></div>
            <div className="h-6 w-20 rounded-md bg-slate-800"></div>
          </div>

          {/* Title and description lines */}
          <div className="mt-4 space-y-2.5">
            <div className="h-5 w-3/4 rounded-md bg-slate-800"></div>
            <div className="h-3.5 w-full rounded-md bg-slate-800/60"></div>
            <div className="h-3.5 w-5/6 rounded-md bg-slate-800/60"></div>
          </div>

          {/* Document list box placeholder */}
          <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-950/60 p-3 space-y-2">
            <div className="h-4 w-1/3 rounded-md bg-slate-800"></div>
            <div className="h-3 w-4/5 rounded-md bg-slate-800/40"></div>
            <div className="h-3 w-2/3 rounded-md bg-slate-800/40"></div>
          </div>

          {/* Bottom actions placeholder */}
          <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/60">
            <div className="h-4 w-28 rounded-md bg-slate-800/60"></div>
            <div className="h-6 w-24 rounded-lg bg-slate-800"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
