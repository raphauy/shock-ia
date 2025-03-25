/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        outputFileTracingIncludes: {
          "/api/chat": ["./node_modules/tiktoken/tiktoken_bg.wasm"],
        },
    },
    reactStrictMode: false,
    images: {
        domains: ['f.fcdn.app'],
    },
}

module.exports = nextConfig