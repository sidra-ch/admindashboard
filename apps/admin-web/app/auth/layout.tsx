export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', position: 'relative', background: '#0B1020' }}>
      {/* Animated gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="animate-float-orb absolute -left-80 -top-80 h-[700px] w-[700px] rounded-full blur-[120px]"
          style={{ background: 'rgba(77,162,255,0.10)' }}
        />
        <div
          className="animate-float-orb absolute -bottom-80 -right-40 h-[900px] w-[900px] rounded-full blur-[140px]"
          style={{ background: 'rgba(0,209,255,0.06)', animationDelay: '-5s' }}
        />
        <div
          className="animate-float-orb absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[100px]"
          style={{ background: 'rgba(167,139,250,0.05)', animationDelay: '-10s' }}
        />
      </div>

      {/* Dot grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(168,179,207,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden
      />

      {children}
    </div>
  );
}

