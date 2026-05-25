export default function DashboardLoading() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="glass-panel h-28 animate-pulse rounded-[1.35rem] border" />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <div className="glass-panel h-72 animate-pulse rounded-[1.35rem] border" />
        <div className="glass-panel h-72 animate-pulse rounded-[1.35rem] border" />
      </div>
      <div className="glass-panel h-56 animate-pulse rounded-[1.35rem] border" />
    </div>
  );
}
