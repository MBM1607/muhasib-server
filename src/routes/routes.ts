import { initContract } from "@ts-rest/core";
import { initServer } from "@ts-rest/express";

import { generalContract, generalRouter } from "./general.routes.js";
import { prayerContract, prayerRouter } from "./prayer.routes.js";
import { sessionContract, sessionRouter } from "./session.routes.js";
import { userContract, userRouter } from "./user.routes.js";

const c = initContract();
const s = initServer();

export const contract = c.router({
	user: userContract,
	session: sessionContract,
	general: generalContract,
	prayer: prayerContract,
});

export const router = s.router(contract, {
	general: generalRouter,
	user: userRouter,
	session: sessionRouter,
	prayer: prayerRouter,
});
