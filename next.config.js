/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        outputFileTracingIncludes: {
          "/api/chat": ["./node_modules/tiktoken/tiktoken_bg.wasm"],
        },
    },
    reactStrictMode: false,
}

module.exports = nextConfig