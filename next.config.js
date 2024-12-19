/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    API_URL: process.env.API_URL,
    CRUX_API: process.env.CRUX_API,
    ERGOPAD_API: process.env.ERGOPAD_API,
    BLITZ_SALE: process.env.BLITZ_SALE,
  },
  images: {
    domains: [
      "ergopad-public.s3.us-west-2.amazonaws.com",
      "cloudflare-ipfs.com",
    ],
  },
  swcMinify: true,
  webpack: (config, { isServer }) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    config.ignoreWarnings = [{ module: /sidan-csl-rs-browser/ }];

    return config;
  },
};

module.exports = nextConfig;
