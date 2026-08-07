import { redirect } from "next/navigation";

// Next.js otomatis menampilkan halaman ini untuk semua URL yang tidak
// dikenali (404). Alih-alih menampilkan halaman "Not Found", kita
// arahkan pengguna kembali ke Dasbor. Jika pengguna belum login, layout
// halaman terproteksi (app/(app)/layout.js) akan otomatis mengarahkan
// mereka ke /login.
export default function NotFound() {
  redirect("/dashboard");
}
