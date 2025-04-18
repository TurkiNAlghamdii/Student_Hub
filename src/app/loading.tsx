import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

export default function Loading() {
  // This component will be rendered automatically by Next.js during navigation
  // It inherits the background set by the inline script in layout.tsx
  // Use a fixed overlay with flex centering + force hardware acceleration
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm translate-z-0"> 
      <LoadingSpinner size="xlarge" /> 
    </div>
  );
}
