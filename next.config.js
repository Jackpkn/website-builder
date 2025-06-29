/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [],
    },
    env: {
        GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
}

module.exports = nextConfig 