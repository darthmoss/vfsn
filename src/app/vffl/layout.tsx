import Link from 'next/link'
import Image from 'next/image'
import { currentUser } from '@clerk/nextjs/server'
import { SignInButton, UserButton, Show } from '@clerk/nextjs'
import ThemeSelector from '@/components/ThemeSelector'
import NavigationLinks from '@/components/NavigationLinks'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

const COMMISSIONER_EMAILS = [
  'mattm@victra.com', 
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
    // Changed to min-h-screen and removed overflow-hidden to allow native document scrolling
    <div className={`min-h-screen w-full flex transition-colors duration-300 ${inter.className}`} style={{ backgroundColor: 'var(--vfsn-bg)', color: 'var(--vfsn-text)' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .vfsn-profile-btn:hover {
          background-color: var(--nav-highlight, #FF1E27);
          color: var(--nav-background, #0A0A0C) !important;
        }
      `}} />

      {/* Added sticky top-0 and h-screen so the sidebar stays pinned while the page scrolls */}
      <aside 
        className="w-[240px] flex-shrink-0 h-screen sticky top-0 overflow-y-auto transition-colors duration-300 z-10 flex flex-col p-4 shadow-[4px_0_24px_rgba(0,0,0,0.15)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-white"
        style={{ backgroundColor: 'var(--nav-background, #0A0A0C)' }}
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

        <NavigationLinks isCommissioner={isCommissioner} />

        <div className="flex flex-col items-center gap-4 mt-auto pt-6 border-t border-white/10 w-full">
          <div className="w-full flex flex-col items-center">
            <Show when="signed-in">
              <div 
                className="vfsn-profile-btn flex items-center justify-center gap-2 text-sm font-bold bg-black/20 border border-white/10 px-3 py-2.5 rounded-xl w-full transition-colors cursor-pointer"
                style={{ color: "#ffffff" }}
              >
                <UserButton /> Profile
              </div>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button 
                  className="text-sm font-bold px-4 py-2.5 w-full rounded-xl hover:opacity-90 transition-opacity tracking-wide uppercase"
                  style={{
                    backgroundColor: "var(--nav-highlight, #FF1E27)",
                    color: "var(--nav-background, #0A0A0C)"
                  }}
                >
                  Sign In
                </button>
              </SignInButton>
            </Show>
          </div>

          <div className="w-full">
            <ThemeSelector />
          </div>
        </div>

      </aside>

      {/* Removed h-full and overflow-y-auto so it relies purely on the browser's native scrollbar */}
      <main className="flex-1 py-8 pl-8 pr-0 min-w-0">
        {children}
      </main>

    </div>
  )
}