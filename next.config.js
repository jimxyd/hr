/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.linodeobjects.com' },
    ],
  },
}
module.exports = nextConfig
