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

const nextConfig = {};

export default nextConfig;
