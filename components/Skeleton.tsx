export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-parchment/10 ${className}`} />;
}

/** A dashboard character card's loading placeholder, matching the real card's
 * layout so the page doesn't visually jump once data arrives. */
export function CharacterCardSkeleton() {
  return (
    <div className="stitched rounded-2xl bg-plum/60 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-1.5" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="mt-auto flex gap-2 pt-4">
        <Skeleton className="h-9 flex-1 rounded-full" />
        <Skeleton className="h-9 w-11 rounded-full" />
        <Skeleton className="h-9 w-11 rounded-full" />
      </div>
    </div>
  );
}
