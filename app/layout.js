import "./globals.css";

export const metadata = {
  title: "MeetPoint — Table Ordering",
  description: "Browse the menu, order from your table, and track it live.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
