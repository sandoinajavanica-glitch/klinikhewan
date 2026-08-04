import "./globals.css";

export const metadata = {
  title: "Lareangon",
  description: "Aplikasi internal manajemen klinik hewan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
