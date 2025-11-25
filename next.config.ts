import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	outputFileTracingExcludes: {
		"*": [
			"node_modules/@swc/core-linux-x64-gnu",
			"node_modules/@swc/core-linux-x64-musl",
			"node_modules/@esbuild/linux-x64",
		],
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
