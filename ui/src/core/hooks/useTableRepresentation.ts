import { useState, useEffect, useCallback } from 'react';
import { getTableRepresentation, type TRepresentation } from './getTableRepresentation';

type UseTableRepresentationProps = {
    connectionName: string;
    schemaName: string;
    tableName: string;
    recordId: string;
    enabled?: boolean;
};

export function useTableRepresentation({
    connectionName,
    schemaName,
    tableName,
    recordId,
    enabled = true
}: UseTableRepresentationProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [representation, setRepresentation] = useState<TRepresentation>(null);

    const refresh = useCallback(() => {
        if (!enabled) return;

        setIsLoading(true);

        getTableRepresentation({
            connectionName,
            schemaName,
            tableName,
            value: recordId,
            prefix: "Mem_",
            perPage: 10000,
            onReady: (representation, done) => {
                console.log("onReady", tableName, representation, done);
                if (done) {
                    setRepresentation(representation);
                    setIsLoading(false);
                }
            },
        });
    }, [connectionName, schemaName, tableName, recordId, enabled]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        representation,
        isLoading,
        refresh
    };
}