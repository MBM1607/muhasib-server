import { initContract } from "@ts-rest/core";
import { initServer } from "@ts-rest/express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { config } from "~/config.js";
import { db } from "~/drizzle.js";
import {
	createJwt,
	getLocalUser,
	validatedHandler,
} from "~/helpers/auth.helpers.js";
import { comparePassword } from "~/helpers/crypto.helpers.js";
import { httpStatus } from "~/helpers/http.helpers.js";
import { omit } from "~/helpers/object.helpers.js";
import { selectSessionSchema, sessions, users } from "~/schema.js";

import type { JwtPayload } from "~/helpers/auth.helpers.js";

const c = initContract();
const r = initServer();

export const sessionContract = c.router({
	get: {
		method: "GET",
		path: "/session",
		responses: {
			200: z.array(selectSessionSchema),
		},
	},
	delete: {
		method: "DELETE",
		path: "/session",
		body: z.strictObject({}),
		responses: {
			200: z.strictObject({ accessToken: z.null(), refreshToken: z.null() }),
		},
	},
	post: {
		method: "POST",
		path: "/session",
		body: z.strictObject({
			email: z.string().email(),
			password: z.string(),
		}),
		responses: {
			201: z.strictObject({
				accessToken: z.string(),
				refreshToken: z.string(),
			}),
			401: z.null(),
		},
	},
});

export const sessionRouter = r.router(sessionContract, {
	get: validatedHandler(async ({ res }) => {
		const userId = getLocalUser(res).id;

		const body = await db
			.select()
			.from(sessions)
			.where(and(eq(sessions.userId, userId), eq(sessions.valid, 1)))
			.all();

		return { status: 200, body };
	}),
	delete: validatedHandler(async ({ res }) => {
		const id = getLocalUser(res).session_id;
		await db
			.update(sessions)
			.set({
				valid: 0,
			})
			.where(eq(sessions.id, id))
			.run();

		return { status: 200, body: { accessToken: null, refreshToken: null } };
	}),
	post: async ({ body, headers }) => {
		const user = await db
			.select()
			.from(users)
			.where(eq(users.email, body.email))
			.get();

		if (!user || !comparePassword(body.password, user.password))
			return { status: httpStatus.unauthorized, body: null };

		const session = await db
			.insert(sessions)
			.values({
				userId: user.id,
				userAgent: headers["user-agent"],
			})
			.returning()
			.get();

		const payload: JwtPayload = {
			...omit(user, "password"),
			session_id: session.id,
		};

		const accessToken = createJwt(payload);
		const refreshToken = createJwt(payload, {
			expiresIn: config.refreshTokenAge,
		});

		return {
			status: 201,
			body: { accessToken, refreshToken },
		};
	},
});
