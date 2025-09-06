import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center  ">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-6 py-16">
        {/* LEFT: login panel */}
        <div className=" shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
          <p className="text-sm text-slate-700 mb-6">Login to manage your gym or access your dashboard.</p>
          <Link href="/login" className="block w-full text-center py-3 bg-blue-600 text-white rounded-md">Login</Link>
          <div className="mt-4 text-sm text-slate-600">
            New here? <Link href="/signup" className="text-blue-600">Request access</Link>
          </div>
        </div>

        {/* RIGHT: welcome content */}
        <div className="p-8">
          <h1 className="text-4xl font-extrabold mb-4">A smarter way to run your gym</h1>
          <p className="text-lg  mb-6">
            Track members, workouts, diet plans, mindfulness, photos and more — all in one place.
          </p>
          <ul className="space-y-2 text-slate-600">
            <li>• Member progress & photo tracker</li>
            <li>• Trainer-assigned workouts & logs</li>
            <li>• Requests & admin approvals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
