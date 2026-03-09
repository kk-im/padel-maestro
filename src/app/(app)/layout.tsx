import BottomNav from "@/components/ui/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      <main
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "16px",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
