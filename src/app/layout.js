import "./globals.css";

export const metadata = {
  title: "Trikart Demand Capture",
  description: "Customer demand capture system for Trikart Kuwait",
  manifest: "/manifest.json",
  themeColor: "#1d4ed8",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
