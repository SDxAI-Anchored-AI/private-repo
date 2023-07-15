/** @type {import('next').NextConfig} */
let nextConfig = {
  reactStrictMode: true,
  env: {
    // defaults to TRUE, unless API Keys are set at build time; this flag is used by the UI
    HAS_SERVER_KEY_OPENAI: !!process.env.OPENAI_API_KEY,
    HAS_SERVER_KEY_ELEVENLABS: !!process.env.ELEVENLABS_API_KEY,
    HAS_SERVER_KEY_PRODIA: !!process.env.PRODIA_API_KEY,
    HAS_SERVER_KEYS_GOOGLE_CSE: !!process.env.GOOGLE_CLOUD_API_KEY && !!process.env.GOOGLE_CSE_ID,
  },
  rewrites: async () => {
    return [
      {
        source: '/api/python/:path*',
        destination: process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000/api/python/:path*' : '/api/python/',
      },
    ];
  },
  webpack(config, { isServer, dev }) {
    // @mui/joy: anything material gets redirected to Joy
    config.resolve.alias['@mui/material'] = '@mui/joy';

    // @dqbd/tiktoken: enable asynchronous WebAssembly
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

// conditionally enable the nextjs bundle analyzer
if (process.env.ANALYZE_BUNDLE)
  nextConfig = require('@next/bundle-analyzer')()(nextConfig);

module.exports = nextConfig;
