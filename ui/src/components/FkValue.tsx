import { useTable } from "../core/api/Shared";


export function FkValue({
    connectionName,
    schemaName,
    tableName,
    value,
    visited,
}: {
    connectionName: string;
    schemaName: string;
    tableName: string;
    value: any;
    visited: number[]
}) {
    const table = useTable(connectionName, schemaName, tableName, "Cache_", 10000, visited);
    const ukcolumns = table.struct?.columns?.filter(c => c.isUK);
    const row = table.items?.find(e => e.__id == value);

    if (value == null || ukcolumns == null) {
        return <span></span>
    }

    if (ukcolumns.length == 1 && (ukcolumns[0].isPK)) {
        return <span>{value}</span>
    }

    return ukcolumns.filter(c => !c.isIdentity).map((ukcol, i) => (
        ukcol.isFK ? <>
            <FkValue
                key={i}
                connectionName={connectionName}
                schemaName={ukcol.schemaFK}
                tableName={ukcol.tableFK}
                value={row?.[ukcol.columnName]}
                visited={visited}
            />
        </> : <>
            <span
                className="pr-2"
                key={i}>
                {(row?.[ukcol.columnName] as any)}
            </span>
        </>
    ))
}