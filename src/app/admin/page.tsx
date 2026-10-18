import { auth } from '@clerk/nextjs/server';

export default async function AdminDashboard() {
  // 1. Await the Clerk auth object
  const { userId, redirectToSignIn } = await auth();

  // 2. If no user is logged in, instantly kick them to the secure portal
  if (!userId) {
    return redirectToSignIn();
  }

  // 3. If authorized, render the commissioner tools
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-10">
      <h1 className="text-3xl font-bold text-[#FF1E27]">VFSN Commissioner Dashboard</h1>
      <p className="mt-4 text-gray-400">
        Database connection established. Select a league namespace to manage.
      </p>
      
      <div className="mt-8 grid grid-cols-4 gap-4">
        <div className="p-6 bg-[#1E1E24] rounded border border-gray-800 hover:border-[#FF1E27] cursor-pointer">VFFL Tools</div>
        <div className="p-6 bg-[#1E1E24] rounded border border-gray-800 hover:border-[#FF1E27] cursor-pointer">NCAA Tools</div>
        <div className="p-6 bg-[#1E1E24] rounded border border-gray-800 hover:border-[#FF1E27] cursor-pointer">VFGL Tools</div>
        <div className="p-6 bg-[#1E1E24] rounded border border-gray-800 hover:border-[#FF1E27] cursor-pointer">VFCF Tools</div>
      </div>
    </div>
  );
}