import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { useState } from "react";
import { databaseStructureStore, useTable } from "../../core/api/Shared";
import type { RecordData } from "./DefineRecord";
import { DefineRecordDialog } from "./DefineRecordDialog";
import { FkValue } from "../FkValue";

export const FkSelect = ({
    connectionName, column, field, fieldState, parentRecordData
}: {
    connectionName: string;
    column: (typeof databaseStructureStore.types.result)[0]['columns'][0];
    field: any;
    fieldState: any;
    parentRecordData: RecordData;
}) => {
    const [recordData, setRecordData] = useState<RecordData>(null);
    const table = useTable(connectionName, column.schemaFK, column.tableFK, "Cache_", 10000);

    const getAndUpdateItem = (itemId: any) => {
        field.onChange(itemId);

        let item = parentRecordData.dependencies.find(e => e.parentColumn === column.columnName);

        if (!item) {
            item = {
                tableId: table.struct.tableId,
                parentColumn: column.columnName,
                columns: {},
                dependencies: []
            };
            parentRecordData.dependencies.push(item);
        }

        const record = table.getRecord(itemId);
        Object.assign(item, { columns: record });

        return item;
    };

    const configRecord = () => {
        let item = getAndUpdateItem(field.value);
        setRecordData(item);
    };

    const onCloseDialog = () => {
        setRecordData(null);
    };

    return (
        <>
            <DefineRecordDialog
                connectionName={connectionName}
                schemaName={table.struct.schema}
                tableName={table.struct.table}
                recordData={recordData}
                onSuccess={() => onCloseDialog()}
                onHide={() => onCloseDialog()}
                onError={() => onCloseDialog()}
            />

            <div className="p-inputgroup flex-1">
                <Dropdown
                    value={field.value}
                    onChange={(e) => getAndUpdateItem(e.value)}
                    className={classNames('w-full', { 'p-invalid': fieldState.error })}
                    options={table?.items}
                    optionValue="__id"
                    placeholder="Select a item"
                    showClear
                    valueTemplate={(item) => <FkValue
                        connectionName={connectionName}
                        schemaName={column.schemaFK}
                        tableName={column.tableFK}
                        value={field.value}
                        visited={[]}
                    />}
                    itemTemplate={(item) => <>
                        <FkValue
                            connectionName={connectionName}
                            schemaName={column.schemaFK}
                            tableName={column.tableFK}
                            value={item.__id}
                            visited={[]}
                        />
                    </>}
                    appendTo={document.body} />
                <Button
                    icon="pi pi-pencil"
                    className="p-button-success"
                    type="button"
                    onClick={() => configRecord()} />
            </div>

        </>
    );
};
