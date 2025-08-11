import { paginationTableStore, databaseStructureStore } from "../api/Shared";

export type TRepresentation = {
    schemaName: string;
    tableName: string;
    identifier: string;
    representation: string[];
    dependencies: TRepresentation[];
};

export type TTableRepresentation = {
    connectionName: string;
    schemaName: string;
    tableName: string;
    prefix?: string;
    value: string;
    perPage?: number;
    visited?: number[];
    onReady?: (representation: TRepresentation, done: boolean) => void;
    onTableLoaded?: () => void;
};

export function getTableRepresentation({
    connectionName,
    schemaName,
    tableName,
    prefix = "",
    value,
    perPage = 1000,
    visited = [],
    onReady,
    onTableLoaded,
}: TTableRepresentation): { representation: TRepresentation; done: boolean } {
    const struct = databaseStructureStore
        .getState()
        .data?.find((t) => t.table === tableName && t.schema === schemaName);
    const tableStore = paginationTableStore.getOrCreate(`${prefix}${connectionName}:${schemaName}:${tableName}`).store;
    const ukcolumns = struct?.columns?.filter((c) => c.isUK);

    tableStore
        .getState()
        .initialize({
            query: {
                connectionName,
                schema: schemaName,
                table: tableName,
                page: 1,
                perPage,
            },
        });

    const onTableLoadedInternal = () => {
        onTableLoaded?.();
        if (onReady) {
            const res = process();
            console.log(
                "onTableLoadedInternal",
                tableName,
                res.representation,
                res.done
            );
            if (res.done) {
                onReady(res.representation, res.done);
            }
        }
    };

    const process = () => {
        const table = tableStore.getState();
        let representation: TRepresentation = {
            schemaName,
            tableName,
            identifier: value,
            representation: [],
            dependencies: [],
        };

        if (!table.done) {
            return { representation, done: false };
        }

        const row = table.data?.items?.find((e) => e.__id == value);

        if (value == null || ukcolumns == null) {
            representation.representation = [];
            return { representation, done: true };
        }

        if (ukcolumns.length == 1 && ukcolumns[0].isPK) {
            representation.representation = [value];
            return { representation, done: true };
        }

        let done = true;
        for (const ukcol of ukcolumns.filter((c) => !c.isIdentity)) {
            if (ukcol.isFK) {
                const res = getTableRepresentation({
                    connectionName,
                    schemaName: ukcol.schemaFK,
                    tableName: ukcol.tableFK,
                    prefix,
                    value: row?.[ukcol.columnName],
                    perPage,
                    visited,
                    onTableLoaded: onTableLoadedInternal,
                });
                representation.dependencies.push(res.representation);
                done = done && res.done;
            } else {
                representation.representation.push(row?.[ukcol.columnName] as string);
            }
        }

        if (!done) {
            return { representation, done: false };
        }

        return { representation, done };
    };

    if (!tableStore.getState().done) {
        const unsubscribe = tableStore.subscribe((state) => {
            if (state.done) {
                unsubscribe();
                onTableLoadedInternal?.();
            }
        });
        return {
            representation: {
                schemaName,
                tableName,
                identifier: value,
                representation: [],
                dependencies: [],
            },
            done: false,
        };
    }

    var res = process();
    if (res.done && onReady) {
        onReady(res.representation, res.done);
    }
    return res;
}
