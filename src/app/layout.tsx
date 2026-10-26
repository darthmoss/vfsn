import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VFFL Hub',
  description: 'Victra Fantasy Football League',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} w-full min-h-screen m-0 p-0 antialiased flex flex-col bg-[var(--vfsn-bg)] text-[var(--vfsn-text)]`}>
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}