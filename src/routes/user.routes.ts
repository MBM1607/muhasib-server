import { initContract } from "@ts-rest/core";
import { initServer } from "@ts-rest/express";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/drizzle.js";
import { validatedHandler } from "~/helpers/auth.helpers.js";
import { getHashedPassword } from "~/helpers/crypto.helpers.js";
import { omit } from "~/helpers/object.helpers.js";
import { dbIdSchema } from "~/helpers/schema.helpers.js";
import { insertUserSchema, selectUserSchema, users } from "~/schema.js";

const c = initContract();
const r = initServer();

export const userContract = c.router(
	{
		get: {
			method: "GET",
			path: "/user",
			responses: {
				200: z.array(selectUserSchema),
			},
		},
		getOne: {
			method: "GET",
			path: "/user/:id",
			pathParams: z.strictObject({ id: dbIdSchema }),
			responses: {
				200: selectUserSchema,
				404: z.null(),
			},
		},
		post: {
			method: "POST",
			path: "/user",
			body: insertUserSchema,
			responses: {
				201: selectUserSchema,
			},
		},
	},
	{ strictStatusCodes: true },
);

export const userRouter = r.router(userContract, {
	get: validatedHandler(async () => {
		const selectedUsers = await db.select().from(users).all();
		const body = selectedUsers.map((user) => omit(user, "password"));
		return { status: 200, body };
	}),
	getOne: validatedHandler(async ({ params }) => {
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, params.id))
			.get();

		if (!user) return { status: 404, body: null };

		const body = omit(user, "password");
		return { status: 200, body };
	}),
	post: async ({ body }) => {
		const user = await db
			.insert(users)
			.values({
				...omit(body, "password"),
				password: getHashedPassword(body.password),
			})
			.returning()
			.get();

		const res = omit(user, "password");
		return { status: 201, body: res };
	},
});
