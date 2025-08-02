import { type Control } from "react-hook-form"
import { useTableStructure } from "../../core/api/Shared"
import { RenderFormField } from "./RenderFormField"
import type { RecordData } from "./DefineRecordDialog";


export function DefineRecordForm({
    connectionName,
    schemaName,
    tableName,
    recordData,
    control,
}: {
    connectionName: string,
    schemaName: string,
    tableName: string,
    recordData: RecordData,
    control: Control<RecordData['columns']>,
}) {
    const struct = useTableStructure(connectionName, schemaName, tableName);

    return (
        <form >
            <div className="p-fluid">
                {struct?.columns?.map((column) => RenderFormField({
                    connectionName,
                    control,
                    column,
                    recordData
                }))}
            </div>
        </form>
    );
}

