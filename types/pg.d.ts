declare module "pg" {
  export type QueryResultRow = Record<string, unknown>;

  export type QueryResult<T extends QueryResultRow = QueryResultRow> = {
    rows: T[];
    rowCount: number | null;
  };

  export class Pool {
    constructor(config?: Record<string, unknown>);
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }
}
