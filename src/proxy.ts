import { clerkMiddleware } from '@clerk/nextjs/server'

// This simply initializes Clerk for the Next.js app
export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}