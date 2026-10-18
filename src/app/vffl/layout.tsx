import Link from 'next/link'
import Image from 'next/image'
import { currentUser } from '@clerk/nextjs/server'
import { SignInButton, UserButton, Show } from '@clerk/nextjs'
import ThemeSelector from '@/components/ThemeSelector'
import NavigationLinks from '@/components/NavigationLinks'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const COMMISSIONER_EMAILS = [
  'matt.mossman05@gmail.com', 
];

export default async function VFFLLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isCommissioner = Boolean(
    user && (
      COMMISSIONER_EMAILS.includes(userEmail || '') ||
      user.publicMetadata?.role === 'commissioner'
    )
  );

  return (
    <div className={`fixed inset-0 grid grid-cols-[240px_1fr] transition-colors duration-300 ${inter.className}`} style={{ backgroundColor: 'var(--vfsn-bg)', color: 'var(--vfsn-text)' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .vfsn-nav-link:hover {
          background-color: color-mix(in srgb, var(--nav-highlight, #FF1E27) 50%, transparent);
        }
        a.vfsn-nav-link:visited {
          color: var(--nav-text, #ffffff) !important;
        }
        .vfsn-profile-btn:hover {
          background-color: var(--nav-highlight, #FF1E27);
          color: var(--nav-background, #0A0A0C) !important;
        }
      `}} />

      <aside 
        className="shadow-[4px_0_24px_rgba(0,0,0,0.15)] h-screen sticky top-0 overflow-y-auto transition-colors duration-300 z-10 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ 
          backgroundColor: 'var(--nav-background, #0A0A0C)',
          color: 'var(--nav-text, #ffffff)',
          paddingTop: '16px',
          paddingBottom: '24px'
        }}
      >
        
        <div className="flex flex-col items-center mb-6">
          <Link href="/vffl" className="group block mt-2 no-underline">
            <Image 
              src="/vffl-logo.png" 
              alt="VFFL Logo" 
              width={110} 
              height={110} 
              className="w-[110px] h-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* The client component takes over the routing logic here */}
        <NavigationLinks isCommissioner={isCommissioner} />

        {/* BOTTOM: Utility Controls */}
        <div className="flex flex-col items-center gap-4 mt-auto pt-6 border-t border-white/10 w-full px-4">
          <div className="w-full flex flex-col items-center">
            <Show when="signed-in">
              <div 
                className="vfsn-profile-btn flex items-center justify-center gap-2 text-sm font-bold bg-black/20 px-3 py-2.5 rounded-xl w-full transition-colors cursor-pointer"
                style={{ color: "var(--nav-text, #ffffff)" }}
              >
                <UserButton /> Profile
              </div>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button 
                  className="group relative w-full flex items-center justify-center gap-2 px-4 py-[8px] text-[0.95rem] font-bold rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    backgroundColor: "var(--nav-highlight, #FF1E27)",
                    color: "var(--nav-text, #ffffff)"
                  }}
                >
                  Sign In
                  <svg 
                    className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </button>
              </SignInButton>
            </Show>
          </div>

          <div className="w-full">
            <ThemeSelector />
          </div>
        </div>

      </aside>

      <main className="flex-1 w-full min-w-0 p-8 md:p-12 h-screen overflow-y-auto">
        {children}
      </main>

    </div>
  )
}