/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingIncludes: {
        "/api/chat": ["./node_modules/tiktoken/tiktoken_bg.wasm"],
    },
  reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'f.fcdn.app',
            },
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
            {
                protocol: 'https',
                hostname: 'agentes.shock.uy',
            },
        ],
    },
}

module.exports = nextConfig