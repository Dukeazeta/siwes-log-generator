export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white min-h-screen"
      style={{ backgroundColor: 'white', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}
