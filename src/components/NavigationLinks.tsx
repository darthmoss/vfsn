'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationLinks({ isCommissioner }: { isCommissioner: boolean }) {
  const pathname = usePathname();

  const getLinkProps = (href: string) => {
    const isActive = pathname === href;
    
    if (isActive) {
      return {
        className: "w-full flex items-center gap-[16px] py-[8px] text-[0.95rem] font-bold rounded-xl no-underline transition-all shadow-sm",
        style: {
          backgroundColor: "var(--nav-highlight, #FF1E27)",
          color: "var(--nav-background, #0A0A0C)", 
          paddingLeft: "24px",
          paddingRight: "16px"
        }
      };
    }
    return {
      className: "vfsn-nav-link w-full flex items-center gap-[16px] py-[8px] text-[0.95rem] font-semibold rounded-xl no-underline transition-all opacity-90 hover:opacity-100",
      style: {
        color: "var(--nav-text, #ffffff)",
        paddingLeft: "24px",
        paddingRight: "16px"
      }
    };
  };

  return (
    <nav className="flex flex-col w-full flex-1 pb-6 px-2">
      
      {/* CURRENT WEEK */}
      <div className="flex flex-col gap-1 mb-6">
        <div 
          className="text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1"
          style={{ color: 'var(--nav-highlight, #FF1E27)', paddingLeft: '24px', paddingRight: '16px' }}
        >
          Current Week
        </div>
        
        <Link href="/vffl/highlights" {...getLinkProps("/vffl/highlights")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Highlights</span>
        </Link>
        <Link href="/vffl/matchup-hype" {...getLinkProps("/vffl/matchup-hype")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7 9a8.001 8.001 0 007.03 2.758s-.15-4.5 3-7c0 0 1.5 3.5 1.5 6s-1.5 5.5-1.5 5.5z"></path></svg>
          <span>Matchup Hype</span>
        </Link>
        <Link href="/vffl/news-wire" {...getLinkProps("/vffl/news-wire")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
          <span>News Wire</span>
        </Link>
        <Link href="/vffl/who-should-i-start" {...getLinkProps("/vffl/who-should-i-start")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Who Should I Start?</span>
        </Link>
        <Link href="/vffl/weekly-recaps" {...getLinkProps("/vffl/weekly-recaps")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Weekly Recaps</span>
        </Link>
      </div>

      {/* LEAGUE */}
      <div className="flex flex-col gap-1 mb-6">
        <div 
          className="text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1"
          style={{ color: 'var(--nav-highlight, #FF1E27)', paddingLeft: '24px', paddingRight: '16px' }}
        >
          League
        </div>
        <Link href="/vffl/standings" {...getLinkProps("/vffl/standings")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          <span>Standings</span>
        </Link>
        <Link href="/vffl/power-rankings" {...getLinkProps("/vffl/power-rankings")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          <span>Power Rankings</span>
        </Link>
        <Link href="/vffl/manager-profiles" {...getLinkProps("/vffl/manager-profiles")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <span>Manager Profiles</span>
        </Link>
      </div>

      {/* ANALYSIS */}
      <div className="flex flex-col gap-1 mb-6">
        <div 
          className="text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1"
          style={{ color: 'var(--nav-highlight, #FF1E27)', paddingLeft: '24px', paddingRight: '16px' }}
        >
          Analysis
        </div>
        <Link href="/vffl/teams" {...getLinkProps("/vffl/teams")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <span>Teams</span>
        </Link>
        <Link href="/vffl/players" {...getLinkProps("/vffl/players")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span>Players</span>
        </Link>
        <Link href="/vffl/defense" {...getLinkProps("/vffl/defense")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span>Defense</span>
        </Link>
      </div>

      {/* HALL OF FAME */}
      <div className="flex flex-col gap-1 mb-6">
        <div 
          className="text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1"
          style={{ color: 'var(--nav-highlight, #FF1E27)', paddingLeft: '24px', paddingRight: '16px' }}
        >
          Hall of Fame
        </div>
        <Link href="/vffl/season-results" {...getLinkProps("/vffl/season-results")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Season Results</span>
        </Link>
        <Link href="/vffl/career" {...getLinkProps("/vffl/career")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <span>Career</span>
        </Link>
        <Link href="/vffl/season" {...getLinkProps("/vffl/season")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span>Season</span>
        </Link>
        <Link href="/vffl/matchups" {...getLinkProps("/vffl/matchups")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          <span>Matchups</span>
        </Link>
        <Link href="/vffl/players-lineups" {...getLinkProps("/vffl/players-lineups")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          <span>Players & Lineups</span>
        </Link>
        <Link href="/vffl/streaks-milestones" {...getLinkProps("/vffl/streaks-milestones")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
          <span>Streaks & Milestones</span>
        </Link>
        <Link href="/vffl/front-office" {...getLinkProps("/vffl/front-office")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          <span>Front Office</span>
        </Link>
        <Link href="/vffl/league-history" {...getLinkProps("/vffl/league-history")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>League History</span>
        </Link>
      </div>

      {/* DRAFT ROOM */}
      <div className="flex flex-col gap-1 mb-6">
        <div 
          className="text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1"
          style={{ color: 'var(--nav-highlight, #FF1E27)', paddingLeft: '24px', paddingRight: '16px' }}
        >
          Draft Room
        </div>
        <Link href="/vffl/draft-recap" {...getLinkProps("/vffl/draft-recap")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>Draft Recap</span>
        </Link>
        <Link href="/vffl/draft-grades" {...getLinkProps("/vffl/draft-grades")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          <span>Draft Grades</span>
        </Link>
        <Link href="/vffl/draft-advice" {...getLinkProps("/vffl/draft-advice")}>
          <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          <span>Draft Advice</span>
        </Link>
      </div>

      {isCommissioner && (
        <div className="flex flex-col gap-1 mt-2">
          <div 
            className="text-[11px] font-extrabold uppercase tracking-[0.15em] mb-1 flex items-center gap-2"
            style={{ color: 'var(--nav-highlight, #FF1E27)', paddingLeft: '24px', paddingRight: '16px' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--nav-highlight, #FF1E27)" }}></span>
            Commissioner
          </div>
          <Link href="/vffl/league-settings" {...getLinkProps("/vffl/league-settings")}>
            <svg className="w-[20px] h-[20px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span>League Settings</span>
          </Link>
          <Link 
            href="/admin" 
            className="mt-2 rounded-xl flex items-center justify-center gap-3 py-[8px] text-[0.95rem] font-bold text-center no-underline transition-opacity w-full shadow-md hover:opacity-90"
            style={{
              backgroundColor: "var(--nav-highlight, #FF1E27)",
              color: "var(--nav-background, #0A0A0C)",
              paddingLeft: "24px",
              paddingRight: "16px"
            }}
          >
            <span>League Admin Portal</span>
          </Link>
        </div>
      )}
    </nav>
  );
}