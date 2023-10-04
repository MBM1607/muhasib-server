import type { Config } from "drizzle-kit";

// eslint-disable-next-line import/no-default-export
export default {
	out: "./migrations",
	schema: "./src/schema.ts",
	breakpoints: true,
} satisfies Config;
