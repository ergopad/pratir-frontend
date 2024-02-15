/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    API_URL: process.env.API_URL,
    ERGOPAD_API: process.env.ERGOPAD_API,
    BLITZ_SALE: process.env.BLITZ_SALE
  },
  images: {
    domains: ['ergopad-public.s3.us-west-2.amazonaws.com', 'cloudflare-ipfs.com'],
  },
  swcMinify: true,
};

module.exports = nextConfig;
