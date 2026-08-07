import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "Lareangon Klinik Hewan",
  description: "Aplikasi internal manajemen klinik hewan",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
