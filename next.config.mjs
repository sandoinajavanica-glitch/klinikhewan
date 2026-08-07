/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit membaca file data font (.afm) langsung dari node_modules saat
  // runtime. Kalau di-bundle oleh webpack, file .afm itu tidak ikut
  // ter-copy sehingga muncul error ENOENT saat generate PDF (invoice
  // maupun rekam medis). Menandainya sebagai "external package" membuat
  // Next.js memuatnya lewat require() Node biasa, bukan lewat webpack.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
