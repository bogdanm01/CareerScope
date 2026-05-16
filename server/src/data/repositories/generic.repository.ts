import { and, count, eq, SQL } from 'drizzle-orm';
import { DbClient } from '../../config/db-client.ts';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

type FindPaginationOptions = {
  page?: number;
  pageSize?: number;
};

export type FindResult<TData> = {
  data: TData[];
  totalItems: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GenericRepository<TSelect, TInsert extends Record<string, any>, TId> {
  constructor(
    protected db: DbClient,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly table: PgTableWithColumns<any>,
    private readonly idColumn: string = 'id',
  ) {}

  public async insert(obj: TInsert): Promise<TSelect> {
    const [row] = await this.db.insert(this.table).values(obj).returning();

    if (!row) {
      throw new Error('Database insert failed.');
    }

    return row as TSelect;
  }

  public async find<TColumns extends Partial<Record<keyof TSelect, never>>>(
    select?: { [K in keyof TColumns]: (typeof this.table)[K] },
    filter?: SQL,
    pagination: FindPaginationOptions = {},
  ): Promise<FindResult<TSelect | Partial<TSelect>>> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const selectQuery = select ? this.db.select(select as never) : this.db.select();
    const query = filter ? selectQuery.from(this.table).where(filter) : selectQuery.from(this.table);
    const countQuery = filter
      ? this.db.select({ totalItems: count() }).from(this.table).where(filter)
      : this.db.select({ totalItems: count() }).from(this.table);

    const [rows, [countResult]] = await Promise.all([query.limit(pageSize).offset(offset), countQuery]);

    return {
      data: rows as Array<TSelect | Partial<TSelect>>,
      totalItems: countResult?.totalItems ?? 0,
    };
  }

  public async findOne<TColumns extends Partial<Record<keyof TSelect, never>>>(
    id: TId,
    select?: { [K in keyof TColumns]: (typeof this.table)[K] },
    filter?: SQL,
  ): Promise<TSelect | Partial<TSelect> | null> {
    const selectQuery = select ? this.db.select(select as never) : this.db.select();
    const whereClause = filter ? and(eq(this.table[this.idColumn], id), filter) : eq(this.table[this.idColumn], id);

    const rows = await selectQuery.from(this.table).where(whereClause).limit(1);
    return rows[0] ?? null;
  }

  public async softDelete(id: TId): Promise<{ id: TId }> {
    const result = await this.db
      .update(this.table)
      .set({ isDeleted: true })
      .where(and(eq(this.table[this.idColumn], id), eq(this.table.isDeleted, false)))
      .returning({ id: this.table[this.idColumn] });

    return result[0] ?? null;
  }
}
