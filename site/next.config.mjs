/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static: Render serves the exported HTML, no Node server required.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  poweredByHeader: false,
};

export default nextConfig;
