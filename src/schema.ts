import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = sqliteTable("users", {
	id: integer("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	password: text("password").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(strftime('%s', 'now'))`,
	),
	updateAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(strftime('%s', 'now'))`,
	),
});
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users).omit({
	password: true,
});

export const sessions = sqliteTable("sessions", {
	id: integer("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),
	valid: integer("valid").default(sql`1`),
	userAgent: text("user_agent"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(strftime('%s', 'now'))`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(strftime('%s', 'now'))`,
	),
});

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export const prayers = sqliteTable("prayers", {
	id: integer("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),
	name: text("name").notNull(), // e.g. Fajr, Dhuhr, Asr, Maghrib, Isha
	method: text("method").notNull(), // e.g. Infradi, Jamat, Qaza
	date: integer("date", { mode: "timestamp" }).notNull(),
});

export const insertPrayerSchema = createInsertSchema(prayers);
export const selectPrayerSchema = createSelectSchema(prayers);

export const fasts = sqliteTable("fasts", {
	id: integer("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),
	date: integer("date", { mode: "timestamp" }).notNull(),
});

export const insertFastSchema = createInsertSchema(fasts);
export const selectFastSchema = createSelectSchema(fasts);

export const duas = sqliteTable("duas", {
	id: integer("id").primaryKey(),
	english: text("english").notNull(),
	arabic: text("arabic").notNull(),
	urdu: text("urdu").notNull(),
	reference: text("reference").notNull(),
	category: text("category").notNull(),
});

export const selectDuaSchema = createSelectSchema(duas);
