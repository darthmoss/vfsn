'use client';

import { useState, useEffect } from 'react';
import { nflThemes } from '@/lib/nflColors'; 

const VFSN_DEFAULT = { 
  navBackground: { hex: '#0A0A0C' }, 
  navHighlight: { hex: '#FF1E27' }, 
  navText: { hex: '#ffffff' } 
};

export default function ThemeSelector() {
  const [selectedTeam, setSelectedTeam] = useState('vfsn');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.style.setProperty('--vfsn-bg', '#0A0A0C');
      document.documentElement.style.setProperty('--vfsn-text', '#ffffff');
    } else {
      document.documentElement.style.setProperty('--vfsn-bg', '#F4F1EA');
      document.documentElement.style.setProperty('--vfsn-text', '#0A0A0C');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const colors = (nflThemes && (nflThemes as any)[selectedTeam]) || VFSN_DEFAULT;
    
    const backgroundStr = colors.navBackground?.hex || '#0A0A0C';
    const highlightStr = colors.navHighlight?.hex || '#FF1E27';
    const textStr = colors.navText?.hex || '#ffffff';

    document.documentElement.style.setProperty('--nav-background', backgroundStr);
    document.documentElement.style.setProperty('--nav-highlight', highlightStr);
    document.documentElement.style.setProperty('--nav-text', textStr);
  }, [selectedTeam]); 

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      
      {/* 1. NFL TEAM SELECTOR */}
      <div className="relative w-full group">
        <select 
          value={selectedTeam}
          onChange={handleTeamChange}
          className="w-full appearance-none [-webkit-appearance:none] outline-none border-none cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md rounded-xl text-[0.95rem] font-bold focus:ring-2 focus:ring-white/20 py-[8px]"
          style={{
            backgroundColor: "var(--nav-background, #0A0A0C)",
            color: "var(--nav-text, #ffffff)",
            paddingLeft: "40px",
            paddingRight: "40px",
            textAlignLast: "center"
          }}
        >
          <option value="vfsn" className="bg-[#0A0A0C] text-white">VFSN Default</option>
          <option value="ARI" className="bg-[#97233F] text-white">Arizona Cardinals</option>
          <option value="ATL" className="bg-[#A71930] text-white">Atlanta Falcons</option>
          <option value="BAL" className="bg-[#241773] text-white">Baltimore Ravens</option>
          <option value="BUF" className="bg-[#00338D] text-white">Buffalo Bills</option>
          <option value="CAR" className="bg-[#0085CA] text-white">Carolina Panthers</option>
          <option value="CHI" className="bg-[#0B162A] text-white">Chicago Bears</option>
          <option value="CIN" className="bg-[#FB4F14] text-white">Cincinnati Bengals</option>
          <option value="CLE" className="bg-[#311D00] text-white">Cleveland Browns</option>
          <option value="DAL" className="bg-[#041E42] text-white">Dallas Cowboys</option>
          <option value="DEN" className="bg-[#FB4F14] text-white">Denver Broncos</option>
          <option value="DET" className="bg-[#0076B6] text-white">Detroit Lions</option>
          <option value="GB" className="bg-[#203731] text-white">Green Bay Packers</option>
          <option value="HOU" className="bg-[#03202F] text-white">Houston Texans</option>
          <option value="IND" className="bg-[#002C5F] text-white">Indianapolis Colts</option>
          <option value="JAX" className="bg-[#006778] text-white">Jacksonville Jaguars</option>
          <option value="KC" className="bg-[#E31837] text-white">Kansas City Chiefs</option>
          <option value="LV" className="bg-[#000000] text-white">Las Vegas Raiders</option>
          <option value="LAC" className="bg-[#0080C6] text-white">Los Angeles Chargers</option>
          <option value="LAR" className="bg-[#003594] text-white">Los Angeles Rams</option>
          <option value="MIA" className="bg-[#008E97] text-white">Miami Dolphins</option>
          <option value="MIN" className="bg-[#4F2683] text-white">Minnesota Vikings</option>
          <option value="NE" className="bg-[#002244] text-white">New England Patriots</option>
          <option value="NO" className="bg-[#D3BC8D] text-[#0A0A0C]">New Orleans Saints</option>
          <option value="NYG" className="bg-[#0B2265] text-white">New York Giants</option>
          <option value="NYJ" className="bg-[#125740] text-white">New York Jets</option>
          <option value="PHI" className="bg-[#004C54] text-white">Philadelphia Eagles</option>
          <option value="PIT" className="bg-[#FFB612] text-[#0A0A0C]">Pittsburgh Steelers</option>
          <option value="SF" className="bg-[#AA0000] text-white">San Francisco 49ers</option>
          <option value="SEA" className="bg-[#002244] text-white">Seattle Seahawks</option>
          <option value="TB" className="bg-[#D50A0A] text-white">Tampa Bay Buccaneers</option>
          <option value="TEN" className="bg-[#0C2340] text-white">Tennessee Titans</option>
          <option value="WAS" className="bg-[#5A1414] text-white">Washington Commanders</option>
        </select>

        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none transition-transform duration-300 group-hover:translate-y-[2px]">
          <svg className="w-[18px] h-[18px] opacity-80" style={{ color: "var(--nav-text, #ffffff)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      {/* 2. DARK MODE TOGGLE */}
      <label 
        className="w-full flex items-center justify-center rounded-xl py-[8px] px-4 shadow-sm transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-white/20 cursor-pointer"
        style={{
          backgroundColor: "var(--nav-background, #0A0A0C)",
          color: "var(--nav-text, #ffffff)"
        }}
      >
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={isDarkMode}
          onChange={() => setIsDarkMode(!isDarkMode)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsDarkMode(!isDarkMode);
            }
          }}
        />
        
        <div className="flex items-center justify-center gap-4 pointer-events-none">
          <span className="text-[0.95rem] font-bold">
            Dark Mode
          </span>
          
          <span 
            className="text-[0.75rem] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors duration-300 flex items-center justify-center"
            style={{
              backgroundColor: isDarkMode 
                ? "var(--nav-highlight, #FF1E27)" 
                : "rgba(255,255,255,0.15)",
              color: "var(--nav-text, #ffffff)",
              minWidth: "42px"
            }}
          >
            {isDarkMode ? 'ON' : 'OFF'}
          </span>
        </div>
      </label>

    </div>
  )
}