// Keyset pagination continues through short server-capped pages to an explicit empty page.
export async function readBuyerPages<T extends Record<string, unknown>>(
  readPage: (after?: string) => Promise<T[] | null>
): Promise<{available:boolean;rows:T[]}> {
  const rows:T[] = [];
  let after:string | undefined;
  for (;;) {
    const page = await readPage(after);
    if (!Array.isArray(page)) return {available:false,rows:[]};
    if (page.length === 0) return {available:true,rows};
    for (const row of page) {
      if (typeof row?.id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(row.id) ||
          (after !== undefined && row.id <= after)) return {available:false,rows:[]};
      after = row.id;
      rows.push(row);
    }
  }
}
