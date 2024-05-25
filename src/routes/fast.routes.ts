import { initContract } from "@ts-rest/core";
import { initServer } from "@ts-rest/express";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/drizzle.js";
import { getLocalUser, validatedHandler } from "~/helpers/auth.helpers.js";
import { fasts, selectFastSchema } from "~/schema.js";

const c = initContract();
const r = initServer();

const fastResponseSchema = selectFastSchema.omit({
	id: true,
	userId: true,
});

export const fastContract = c.router({
	get: {
		method: "GET",
		path: "/fast",
		query: z.strictObject({
			dates: z
				.preprocess(
					(csv) => typeof csv === "string" && csv.split(","),
					z.array(z.coerce.date()),
				)
				.optional(),
		}),
		responses: {
			200: z.array(fastResponseSchema),
		},
	},
	post: {
		method: "POST",
		path: "/fast",
		body: z.array(z.coerce.date()),
		responses: {
			201: z.array(fastResponseSchema),
			401: z.null(),
		},
	},
});

export const fastRouter = r.router(fastContract, {
	get: validatedHandler(async ({ res, query }) => {
		const userId = getLocalUser(res).id;

		const body = await db
			.select()
			.from(fasts)
			.where(
				query.dates
					? and(
							eq(fasts.userId, userId),
							inArray(fasts.date, query.dates ?? []),
						)
					: eq(fasts.userId, userId),
			)
			.all();

		return {
			status: 200,
			body,
		};
	}),
	post: validatedHandler(async ({ res, body }) => {
		const userId = getLocalUser(res).id;

		const response = await Promise.all(
			body.map(async (date) => {
				const existingFast = await db
					.select()
					.from(fasts)
					.where(and(eq(fasts.userId, userId), eq(fasts.date, date)))
					.get();

				if (existingFast) return existingFast;

				const newFast = await db
					.insert(fasts)
					.values({
						userId,
						date,
					})
					.returning()
					.get();

				return newFast;
			}),
		);

		return {
			status: 201,
			body: response,
		};
	}),
});
