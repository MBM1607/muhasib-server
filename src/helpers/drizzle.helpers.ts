// ? Helper functions for drizzle, taken from
// * https://github.com/drizzle-team/drizzle-orm/blob/main/examples/libsql/src/utils.ts

// TODO look into using this instead of disabling eslint rules
export const aggregateOneToMany = <
	TRow extends Record<string, any>,
	TOne extends keyof TRow,
	TMany extends keyof TRow,
>(
	rows: TRow[],
	one: TOne,
	many: TMany,
): {
	// eslint-disable-next-line @typescript-eslint/no-shadow
	[K in TOne]: TRow[TOne] & { [K in TMany]: NonNullable<TRow[TMany]>[] };
}[] => {
	const map: Record<string, { one: TRow[TOne]; many: TRow[TMany][] }> = {};
	for (const row of rows) {
		const id = row[one];
		if (!map[id]) map[id] = { one: row[one], many: [] };

		if (row[many] !== null) map[id]?.many.push(row[many]);
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return Object.values(map).map((r) => ({ ...r.one, [many]: r.many }));
};
