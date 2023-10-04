import { eq } from "drizzle-orm";
import { default as jwt } from "jsonwebtoken";
import { z } from "zod";

import { config } from "~/config.js";
import { db } from "~/drizzle.js";
import { getCatchMessage } from "~/errors.js";
import { httpStatus } from "~/helpers/http.helpers.js";
import { dbIdSchema } from "~/helpers/schema.helpers.js";
import { sessions, users } from "~/schema.js";

import type { AppRoute } from "@ts-rest/core";
import type { AppRouteOptions } from "@ts-rest/express";
import type { Request, RequestHandler, Response } from "express";
import type { SignOptions } from "jsonwebtoken";

export const jwtPayloadSchema = z.strictObject({
	id: dbIdSchema,
	name: z.string(),
	email: z.string().email(),
	session_id: dbIdSchema,
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

export const createJwt = (payload: JwtPayload, options?: SignOptions) => {
	return jwt.sign(payload, config.privateKey, {
		algorithm: "RS256",
		expiresIn: config.accessTokenAge,
		...options,
	});
};

export type JwtVerification =
	| { valid: false; expired: boolean }
	| { valid: true; payload: JwtPayload };

export const verifyJwt = (token: string): JwtVerification => {
	try {
		const decoded = jwt.verify(token, config.publicKey);
		const payload = jwtPayloadSchema.strip().parse(decoded);
		return { payload, valid: true };
	} catch (error) {
		return {
			expired: error instanceof Error && error.message === "jwt expired",
			valid: false,
		};
	}
};

const reIssueAccessToken = async (
	{ headers }: Request,
	response: Response,
): Promise<JwtPayload> => {
	const refreshHeader = headers["x-refresh"];
	const refreshToken = verifyJwt(
		(Array.isArray(refreshHeader) ? refreshHeader[0] : refreshHeader) ?? "",
	);
	if (!refreshToken.valid && refreshToken.expired)
		throw new Error("Refresh token expired");
	if (!refreshToken.valid) throw new Error("Invalid refresh token");

	const session = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, refreshToken.payload.session_id))
		.get();

	if (!session) throw new Error("Session not found");
	if (!session.valid) throw new Error("Session is no longer valid");

	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, session.userId))
		.get();

	if (!user) throw new Error("User not found");

	const payload: JwtPayload = {
		id: user.id,
		name: user.name,
		email: user.email,
		session_id: session.id,
	};
	const accessToken = createJwt(payload, { expiresIn: config.refreshTokenAge });
	response.setHeader("x-access-token", accessToken);
	return payload;
};

export const validateAuth = (): RequestHandler => {
	return async (request, response, next) => {
		try {
			const verification = verifyJwt(
				request.headers.authorization?.replace(/^Bearer\s/u, "") ?? "",
			);
			if (!verification.valid && !verification.expired)
				throw new Error("Invalid or missing access token");

			const user = !verification.valid
				? await reIssueAccessToken(request, response)
				: verification.payload;

			response.locals.user = user;

			next();
		} catch (error) {
			return response
				.status(httpStatus.unauthorized)
				.json(getCatchMessage(error));
		}
	};
};

export const validatedHandler = <T extends AppRoute>(
	handler: AppRouteOptions<T>["handler"],
): AppRouteOptions<T> => {
	return { middleware: [validateAuth()], handler };
};

export const getLocalUser = (response: Response) => {
	if (!response.locals.user) throw new Error("No user found");
	return response.locals.user;
};
