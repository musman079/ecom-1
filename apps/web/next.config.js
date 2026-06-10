/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
function normalizeNextAuthUrl() {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (!raw) {
    return;
  }

  const extracted = raw.match(/https?:\/\/[^\s"'`,]+/i)?.[0];
  if (extracted) {
    process.env.NEXTAUTH_URL = extracted.replace(/\/$/, "");
    return;
  }

  try {
    const parsed = new URL(raw);
    process.env.NEXTAUTH_URL = parsed.origin;
  } catch {
    delete process.env.NEXTAUTH_URL;
  }
}

normalizeNextAuthUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the "X-Powered-By: Next.js" header for security
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // External image domains allowed for next/image optimization
  images: {
    remotePatterns: [
      // Cloudinary (if used for product images)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // AWS S3 / CloudFront
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      // Unsplash (placeholder/demo images)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Placehold.co (placeholder images)
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable XSS protection in older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy — restrict sensitive browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          // HSTS — only in production (forces HTTPS)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      // Cache static assets aggressively (production only)
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
