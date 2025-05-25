import { useCallback, useEffect, useMemo, useState } from "react";
import { createStoreEntryPoint, storeEntryPointCache } from "./Store";

export const databaseStructureStore = createStoreEntryPoint("/api/Database/structure", "get");
export const paginationTableStore = storeEntryPointCache("/api/Database/tablePaginationRecords", "get");

export function setDatabaseStructure(connectionName: string) {
    return databaseStructureStore.getState().setOptions({ query: { connectionName } })
}

export function useTableStructure(connectionName: string, schema: string, table: string) {
    const struct = databaseStructureStore.use();

    useEffect(() => {
        struct.initialize({ query: { connectionName } })
    }, [connectionName]);

    return useMemo(() => {
        return struct.data?.find(t =>
            t.table === table &&
            t.schema === schema
        );
    }, [struct.data, schema, table, connectionName]);
}

export function useTableStructure2(connectionName: string, tableId: number) {
    const struct = databaseStructureStore.use();

    useEffect(() => {
        struct.initialize({ query: { connectionName } })
    }, [connectionName]);

    return useMemo(() => {
        return struct.data?.find(t => t.tableId === tableId);
    }, [struct.data, tableId]);
}

export function useTable(connectionName: string, schema: string, table: string, prefix = "", perPage = 1000, visited: number[] = []) {
    const rows = paginationTableStore.getOrCreate(`${prefix}${connectionName}:${schema}:${table}`).use();
    const struct = useTableStructure(connectionName, schema, table);
    const [dependencies, setDependencies] = useState<typeof struct.columns>([]);

    useEffect(() => {
        if (struct?.tableId && !visited.includes(struct.tableId)) {
            visited.push(struct.tableId);
            const deps = struct.columns.filter(c => c.isFK && !!c.tableFK);
            setDependencies(deps);
        }
    }, [struct?.tableId]);

    useEffect(() => {
        rows.initialize({ query: { connectionName, schema, table, page: 1, perPage } });
    }, [connectionName, schema, table]);

    const setPage = useCallback((page: number, perPage: number) => {
        rows.setOptions({ query: { ...rows.options.query, page, perPage } });
    }, [rows.options?.query]);

    const getRecord = useCallback((itemId: any) => {
        let record = rows.data?.items.find(e => e.__id == itemId)
        if (!record) {
            record = {}
            const columns = Object.fromEntries(
                struct.columns.map(column => [column.columnName, null as any])
            );
            Object.assign(record, columns, { __id: -(rows.data?.items.length + 1) })
            rows.data?.items?.splice(0, 0, record)
        }
        return record
    }, [rows.data, struct?.columns]);

    return useMemo(() => {
        return {
            ...rows.data,
            isLoading: rows.isLoading,
            done: rows.done,
            struct,
            dependencies,
            getRecord,
            setPage,
        };
    }, [rows.data, rows.data?.items, rows.isLoading, rows.done, struct, dependencies]);
}
