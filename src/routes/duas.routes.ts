import { initContract } from "@ts-rest/core";
import { initServer } from "@ts-rest/express";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/drizzle.js";
import { dbIdSchema } from "~/helpers/schema.helpers.js";
import { duas, selectDuaSchema } from "~/schema.js";

const c = initContract();
const r = initServer();

export const duaContract = c.router({
	getAll: {
		method: "GET",
		path: "/duas",
		responses: {
			200: z.array(selectDuaSchema),
		},
	},
	getOne: {
		method: "GET",
		path: "/dua/:id",
		pathParams: z.strictObject({ id: dbIdSchema }),
		responses: {
			200: selectDuaSchema,
			404: z.null(),
		},
	},
});

export const duaRouter = r.router(duaContract, {
	getAll: async () => {
		const duasData = await db.select().from(duas).all();
		return { status: 200, body: duasData };
	},
	getOne: async ({ params }) => {
		const dua = await db
			.select()
			.from(duas)
			.where(eq(duas.id, params.id))
			.get();

		if (!dua) return { status: 404, body: null };

		return { status: 200, body: dua };
	},
});
