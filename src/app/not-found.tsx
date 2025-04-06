'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Wrapper component to safely use hooks that need Suspense
function NotFoundContent() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-gray-200 mb-6">Page not found</h2>
          <p className="text-gray-400 mb-8">
            We couldn't find the page you were looking for: {pathname}
          </p>
        </div>
        
        <div className="flex justify-center">
          <Link 
            href="/" 
            className="px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-md"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400">Page not found</p>
        </div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
} 