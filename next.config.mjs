/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [],
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/rapier"],
};

export default nextConfig;
