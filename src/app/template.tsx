export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen transition-colors duration-300">
      {children}
    </div>
  );
}
