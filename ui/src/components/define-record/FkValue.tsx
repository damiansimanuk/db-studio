import type { TRepresentation } from "../../core/hooks/getTableRepresentation";
import { useTableRepresentation } from "../../core/hooks/useTableRepresentation";


function plainRepresentation(representation: TRepresentation, separator = " ", maxDepth = 2, deepSeparator = ", ", showTableIdentifier = true, useTableIdentifier = false): string {
    if (maxDepth <= 0) {
        return showTableIdentifier && useTableIdentifier
            ? representation.tableName + ":" + representation.identifier
            : representation.identifier;
    }
    const prefix = useTableIdentifier ? representation.tableName + "(" : "";
    const suffix = useTableIdentifier ? ")" : "";
    const res = representation?.representation?.join(deepSeparator);
    const depRes = representation?.dependencies?.flatMap(d => plainRepresentation(d, deepSeparator, maxDepth - 1, deepSeparator, showTableIdentifier, showTableIdentifier));
    return prefix + [...depRes, res].join(separator) + suffix;
}

export function FkValue({
    connectionName,
    schemaName,
    tableName,
    value,
}: {
    connectionName: string;
    schemaName: string;
    tableName: string;
    value: any;
}) {
    const { representation, isLoading } = useTableRepresentation({ connectionName, schemaName, tableName, recordId: value });

    if (isLoading) {
        return <span>...</span>
    }

    let representationValue = plainRepresentation(representation, " ", 2, ", ", true);

    return <span>{representationValue}</span>
}
