import { initContract } from "@ts-rest/core";
import { initServer } from "@ts-rest/express";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/drizzle.js";
import { getLocalUser, validatedHandler } from "~/helpers/auth.helpers.js";
import { prayers, selectPrayerSchema } from "~/schema.js";

const c = initContract();
const r = initServer();

export const prayerRequestSchema = z.strictObject({
	name: z.enum(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]),
	method: z.enum(["Infradi", "Jamat", "Qaza"]),
	date: z.coerce.date(),
});

export const prayerResponseSchema = selectPrayerSchema.omit({
	id: true,
	userId: true,
});

export const prayerContract = c.router({
	get: {
		method: "GET",
		path: "/prayer",
		query: z.strictObject({
			date: z.date().optional(),
		}),
		responses: {
			200: z.array(prayerResponseSchema),
		},
	},
	post: {
		method: "POST",
		path: "/prayer",
		body: z.array(prayerRequestSchema),
		responses: {
			201: z.array(prayerResponseSchema),
			401: z.null(),
			409: z.null(),
		},
	},
});

export const prayerRouter = r.router(prayerContract, {
	get: validatedHandler(async ({ res, query }) => {
		const userId = getLocalUser(res).id;

		// ? If date is not provided, Assume today's date is requested
		const date = query.date ?? new Date();

		const body = await db
			.select()
			.from(prayers)
			.where(
				and(
					eq(prayers.userId, userId),
					eq(prayers.date, dayjs(date).startOf("day").toDate()),
				),
			)
			.all();

		return { status: 200, body };
	}),
	post: validatedHandler(async ({ res, body }) => {
		const userId = getLocalUser(res).id;

		const response = await Promise.all(
			body.map(async (prayerRequest) => {
				const existingPrayer = await db
					.select()
					.from(prayers)
					.where(
						and(
							eq(prayers.userId, userId),
							eq(prayers.name, prayerRequest.name),
							eq(
								prayers.date,
								dayjs(prayerRequest.date).startOf("day").toDate(),
							),
						),
					)
					.get();

				const prayer = await (
					existingPrayer
						? db
								.update(prayers)
								.set({
									method: prayerRequest.method,
									date: prayerRequest.date,
								})
								.where(eq(prayers.id, existingPrayer.id))
						: db.insert(prayers).values({
								userId,
								name: prayerRequest.name as string,
								method: prayerRequest.method as string,
								date: prayerRequest.date,
							})
				)
					.returning()
					.get();

				return prayer;
			}),
		);

		return {
			status: 201,
			body: response,
		};
	}),
});
