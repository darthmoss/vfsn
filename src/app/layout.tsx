import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* Added m-0 and p-0 to kill the default browser gap */}
        <body className="m-0 p-0 bg-[var(--vfsn-bg)] text-[var(--vfsn-text)] min-h-screen flex flex-col transition-colors duration-300">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}