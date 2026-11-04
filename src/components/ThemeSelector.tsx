'use client';

import { useState, useEffect, useRef } from 'react';
import { nflThemes, type TeamTheme } from '@/lib/nflColors'; 

const VFSN_DEFAULT: TeamTheme = { 
  navBackground: { name: 'VFSN Black', hex: '#0A0A0C' }, 
  navHighlight: { name: 'VFSN Red', hex: '#FF1E27' }, 
  navText: { name: 'White', hex: '#ffffff' } 
};

const TEAM_OPTIONS: { code: string; label: string }[] = [
  { code: 'vfsn', label: 'VFSN Default' },
  { code: 'ARI', label: 'Arizona Cardinals' },
  { code: 'ATL', label: 'Atlanta Falcons' },
  { code: 'BAL', label: 'Baltimore Ravens' },
  { code: 'BUF', label: 'Buffalo Bills' },
  { code: 'CAR', label: 'Carolina Panthers' },
  { code: 'CHI', label: 'Chicago Bears' },
  { code: 'CIN', label: 'Cincinnati Bengals' },
  { code: 'CLE', label: 'Cleveland Browns' },
  { code: 'DAL', label: 'Dallas Cowboys' },
  { code: 'DEN', label: 'Denver Broncos' },
  { code: 'DET', label: 'Detroit Lions' },
  { code: 'GB', label: 'Green Bay Packers' },
  { code: 'HOU', label: 'Houston Texans' },
  { code: 'IND', label: 'Indianapolis Colts' },
  { code: 'JAX', label: 'Jacksonville Jaguars' },
  { code: 'KC', label: 'Kansas City Chiefs' },
  { code: 'LV', label: 'Las Vegas Raiders' },
  { code: 'LAC', label: 'Los Angeles Chargers' },
  { code: 'LAR', label: 'Los Angeles Rams' },
  { code: 'MIA', label: 'Miami Dolphins' },
  { code: 'MIN', label: 'Minnesota Vikings' },
  { code: 'NE', label: 'New England Patriots' },
  { code: 'NO', label: 'New Orleans Saints' },
  { code: 'NYG', label: 'New York Giants' },
  { code: 'NYJ', label: 'New York Jets' },
  { code: 'PHI', label: 'Philadelphia Eagles' },
  { code: 'PIT', label: 'Pittsburgh Steelers' },
  { code: 'SF', label: 'San Francisco 49ers' },
  { code: 'SEA', label: 'Seattle Seahawks' },
  { code: 'TB', label: 'Tampa Bay Buccaneers' },
  { code: 'TEN', label: 'Tennessee Titans' },
  { code: 'WAS', label: 'Washington Commanders' },
];

function getTeamTheme(code: string): TeamTheme {
  if (code === 'vfsn') return VFSN_DEFAULT;
  return nflThemes[code] || VFSN_DEFAULT;
}

export default function ThemeSelector() {
  const [selectedTeam, setSelectedTeam] = useState('vfsn');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const colors = getTeamTheme(selectedTeam);
    
    const backgroundStr = colors.navBackground?.hex || '#0A0A0C';
    const highlightStr = colors.navHighlight?.hex || '#FF1E27';
    const textStr = colors.navText?.hex || '#ffffff';

    document.documentElement.style.setProperty('--nav-background', backgroundStr);
    document.documentElement.style.setProperty('--nav-highlight', highlightStr);
    document.documentElement.style.setProperty('--nav-text', textStr);

    // Sync VFSN content card theme tokens with the selected NFL team
    document.documentElement.style.setProperty('--vfsn-surface', backgroundStr);
    document.documentElement.style.setProperty('--vfsn-accent-1', highlightStr);
    document.documentElement.style.setProperty('--vfsn-accent-2', textStr);
  }, [selectedTeam]); 

  const activeOption =
    TEAM_OPTIONS.find((t) => t.code === selectedTeam) || TEAM_OPTIONS[0];

  return (
    <div className="w-full flex flex-col gap-3">
      
      {/* 1. CUSTOM NFL TEAM SELECTOR (Pop-up menu showing each team's own navBackground & navHighlight) */}
      <div ref={dropdownRef} className="relative w-full">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="w-full outline-none border border-white/10 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md rounded-xl text-[0.9rem] font-bold focus:ring-2 focus:ring-white/20 py-[8px] px-3 flex items-center justify-between gap-2"
          style={{
            backgroundColor: "var(--nav-background, #0A0A0C)",
            color: "var(--nav-highlight, #FF1E27)",
          }}
        >
          <span className="w-[18px] shrink-0" />
          <span className="truncate text-center flex-1">
            {activeOption.label}
          </span>
          <svg
            className={`w-[18px] h-[18px] shrink-0 opacity-80 transition-transform duration-200 ${
              isMenuOpen ? 'rotate-180' : ''
            }`}
            style={{ color: "var(--nav-text, #ffffff)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {isMenuOpen && (
          <ul
            role="listbox"
            aria-label="Select NFL Team Theme"
            className="z-50 absolute left-0 right-0 bottom-full mb-2 max-h-72 overflow-y-auto rounded-xl border border-white/15 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col gap-1 bg-[#0A0A0C]"
          >
            {TEAM_OPTIONS.map((team) => {
              const theme = getTeamTheme(team.code);
              const isSelected = team.code === selectedTeam;
              return (
                <li key={team.code} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(team.code);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-extrabold tracking-wide transition-transform duration-150 hover:scale-[1.01] cursor-pointer flex items-center justify-between gap-2 border"
                    style={{
                      backgroundColor: theme.navBackground.hex,
                      color: theme.navHighlight.hex,
                      borderColor: isSelected
                        ? theme.navHighlight.hex
                        : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <span className="truncate text-center w-full">
                      {team.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 2. DARK MODE TOGGLE */}
      <label 
        className="w-full flex items-center justify-center rounded-xl py-[8px] px-4 shadow-sm transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-white/20 cursor-pointer border border-white/10"
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