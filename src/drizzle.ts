import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { config } from "~/config.js";

const dbClient = createClient({
	url: config.database.url,
	authToken: config.database.authToken,
});

export const db = drizzle(dbClient);
