import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = "/EnglishAgentHub";

const nextConfig: NextConfig = {
  ...(isProd && { output: "export" }),
  ...(isGithubPages && {
    basePath: githubPagesBasePath,
    assetPrefix: githubPagesBasePath,
  }),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
