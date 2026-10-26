'use client';

import { useState } from 'react';

export default function CurrentWeekPage() {
  const [activeDivision, setActiveDivision] = useState<'Red' | 'Black'>('Red');
  
  const seasonYear = "2026";
  const currentWeekNum = "7";

  return (
    // pt-[16px] brings the top frame back to 48px (16px + layout's 32px).
    // The other sides remain doubled at 96px.
    <div className="w-full flex flex-col gap-[48px] pt-[16px] pr-[96px] pb-[64px] pl-[64px]">
      
      {/* HEADER CONTAINER */}
      <div className="relative bg-[var(--vfsn-surface)] border border-white/5 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-8 md:p-10 min-h-[165px] flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--vfsn-accent-1)] to-transparent opacity-20"></div>

        {/* Left Side: Split Season & Week Badge */}
        <div className="flex rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/10 z-10">
          <div className="bg-[#113122] px-8 py-4 flex flex-col justify-center items-center">
            <span className="text-[0.65rem] font-extrabold tracking-[0.25em] text-[#f5b82e] mb-1">SEASON</span>
            <span className="text-3xl font-black text-white tracking-tight leading-none">{seasonYear}</span>
          </div>
          <div className="bg-white px-8 py-4 flex flex-col justify-center items-center">
            <span className="text-3xl font-black text-black tracking-tight leading-none">W{currentWeekNum}</span>
            <span className="text-[0.65rem] font-extrabold tracking-[0.25em] text-gray-500 mt-1">WEEK</span>
          </div>
        </div>

        {/* Right Side: Division Toggles */}
        <div className="flex items-center bg-black/30 p-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-inner z-10">
          <button
            onClick={() => setActiveDivision('Red')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${
              activeDivision === 'Red'
                ? 'bg-[var(--vfsn-accent-1)] text-[var(--vfsn-bg)] shadow-md'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Red Division
          </button>
          <button
            onClick={() => setActiveDivision('Black')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${
              activeDivision === 'Black'
                ? 'bg-white text-[var(--vfsn-bg)] shadow-md'
                : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Black Division
          </button>
        </div>
        
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="flex flex-row gap-[48px] items-start w-full">
        
        {/* LEFT COLUMN: Matchup Cards (flex-[2]) */}
        <div className="flex-[2] flex flex-col gap-[40px]">
          {[1, 2, 3, 4, 5].map((matchupId) => (
             <div key={matchupId} className="bg-[var(--vfsn-surface)] border border-white/5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-10 min-h-[260px] flex items-center justify-center w-full">
               <span className="text-[#94a3b8] font-bold tracking-widest uppercase text-sm">
                 Matchup Card {matchupId} ({activeDivision}) Placeholder
               </span>
             </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Supporting Modules (flex-[1]) */}
        <div className="flex-[1] flex flex-col gap-[40px]">
          
          <div className="bg-[var(--vfsn-surface)] border border-white/5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-8 min-h-[200px] flex items-center justify-center w-full">
            <span className="text-[#94a3b8] font-bold tracking-widest uppercase text-xs text-center leading-relaxed">This Week In History<br/>Placeholder</span>
          </div>

          <div className="bg-[var(--vfsn-surface)] border border-white/5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-8 min-h-[200px] flex items-center justify-center w-full">
            <span className="text-[#94a3b8] font-bold tracking-widest uppercase text-xs text-center leading-relaxed">Weekly Props<br/>Placeholder</span>
          </div>

          <div className="bg-[var(--vfsn-surface)] border border-white/5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-8 min-h-[200px] flex items-center justify-center w-full">
            <span className="text-[#94a3b8] font-bold tracking-widest uppercase text-xs text-center leading-relaxed">Transaction Wire<br/>Placeholder</span>
          </div>

          <div className="bg-[var(--vfsn-surface)] border border-white/5 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] p-8 min-h-[200px] flex items-center justify-center w-full">
            <span className="text-[#94a3b8] font-bold tracking-widest uppercase text-xs text-center leading-relaxed">Injury Report<br/>Placeholder</span>
          </div>

        </div>

      </div>
    </div>
  );
}