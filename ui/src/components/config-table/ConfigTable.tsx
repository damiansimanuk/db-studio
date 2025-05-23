import { Dialog } from "primereact/dialog";
import { createStoreEntryPoint } from "../../core/api/Store";
import { databaseStructureStore, useTableStructure } from "../../core/api/Shared";
import { Controller, useForm, useController } from "react-hook-form";
import { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export type TConfigTable = {
    connectionName: string,
    schema: string,
    table: string,
    onHide?: () => void
}

const configTableStore = createStoreEntryPoint("/api/Database/columnConfig/{connectionName}", "put");

export function ConfigTable(options: TConfigTable) {
    const configTable = configTableStore.use();
    type TRow = typeof configTableStore.types.body[0] & { isEdtion: boolean, isCustom?: boolean };
    const allStruct = databaseStructureStore.use();
    const struct = useTableStructure(options.connectionName, options.schema, options.table);
    const [columns, setColumns] = useState<TRow[]>([]);

    const getSchemas = () => {
        const schemas = [...new Set((allStruct.data ?? []).map(t => t.schema))]
        return schemas;
    }

    const getTables = (schema: string) => {
        const tables = [...new Set(allStruct.data.filter(t => t.schema === schema).map(t => t.table))]
        return tables;
    }

    useEffect(() => {
        setColumns((struct.columns ?? []).map(c => ({ ...c, isEdtion: false })));
    }, [struct?.columns]);

    useEffect(() => {
        console.log('columns', JSON.stringify(columns, null, 2));
    }, [columns]);

    const onSubmit = () => {
        configTable.fetch({
            path: {
                connectionName: options.connectionName,
            },
            body: columns.filter(c => c.isEdtion).map(c => ({
                ...c,
                connectionName: options.connectionName,
                schema: options.schema,
                table: options.table,
            }))
        }).then(() => {
            allStruct.setOptions(allStruct.options);
            options.onHide?.();
        })
    }

    const setColumn = (columnName: string, fieldName: string, value: any) => {
        console.log('setColumn', columnName, fieldName, value);
        setColumns(cs => {
            return cs.map(c => {
                if (c.columnName === columnName) {
                    return {
                        ...c,
                        [fieldName]: value,
                        isEdtion: true,
                    }
                }
                return c;
            });
        });
    }

    const reloadRow = (row: TRow) => {
        const column = struct.columns?.find(c => c.columnName === row.columnName);

        setColumns(cs => {
            return cs.map(c => {
                if (c.columnName === row.columnName) {
                    return {
                        ...c,
                        ...column,
                        isEdtion: false,
                    }
                }
                return c;
            });
        });
    }

    const identityColumn = struct.identityColumn ?? columns.find(c => c.isIdentity)?.columnName;

    return <>
        <DataTable
            value={columns}
            size="small"
            scrollable
            scrollHeight={`${columns.length > 10 ? "450px" : undefined}`}
            cellClassName={() => "p-0 m-0 nowrap px-2"}
            className="nowrap"
        >
            <Column
                field="columnName"
                header="Column Name"
                className="nowrap px-2"
            />
            <Column
                field="isIdentity"
                header="Is Identity"
                body={(data: TRow) =>
                    <Checkbox
                        disabled={!!identityColumn && identityColumn !== data.columnName}
                        readOnly={struct.identityColumn === data.columnName}
                        checked={data.isIdentity}
                        onChange={(e) => setColumn(data.columnName, "isIdentity", e.checked)}
                    />}
            />
            <Column
                field="isNullable"
                header="Is Nullable"
                body={(data: TRow) =>
                    <Checkbox
                        disabled={data.isIdentity}
                        checked={data.isNullable}
                        onChange={(e) => setColumn(data.columnName, "isNullable", e.checked)}
                    />}
            />
            <Column
                field="isPK"
                header="Is PK"
                body={(data: TRow) =>
                    <Checkbox
                        checked={data.isPK}
                        onChange={(e) => setColumn(data.columnName, "isPK", e.checked)}
                    />}
            />
            <Column
                field="isFK"
                header="Is FK"
                body={(data: TRow) =>
                    <Checkbox
                        checked={data.isFK}
                        onChange={(e) => setColumn(data.columnName, "isFK", e.checked)}
                    />}
            />
            <Column
                field="isUK"
                header="Is UK"
                body={(data: TRow) =>
                    <Checkbox
                        checked={data.isUK}
                        onChange={(e) => setColumn(data.columnName, "isUK", e.checked)}
                    />}
            />
            <Column
                field="isExtension"
                header="Is Extension"
                body={(data: TRow) =>
                    <Checkbox
                        checked={data.isExtension}
                        onChange={(e) => setColumn(data.columnName, "isExtension", e.checked)}
                    />}
            />
            <Column
                field="schemaFK"
                header="Schema FK"
                body={(data: TRow) =>
                    <Dropdown
                        disabled={!data.isFK}
                        inputId="schemaFK"
                        className="w-15rem"
                        options={getSchemas()}
                        value={data.schemaFK}
                        onChange={(e) => setColumn(data.columnName, "schemaFK", e.value)}
                        showClear
                    />}
            />
            <Column
                field="tableFK"
                header="Table FK"
                body={(data: TRow) =>
                    <Dropdown
                        disabled={!data.isFK}
                        inputId="tableFK"
                        className="w-15rem"
                        options={getTables(data.schemaFK)}
                        value={data.tableFK}
                        onChange={(e) => setColumn(data.columnName, "tableFK", e.value)}
                        showClear
                    />}
            />
            <Column
                field="isEdtion"
                header=""
                className="w-5rem"
                body={(data: TRow) =>
                    <div className="flex justify-content-center align-items-center">
                        {data.isEdtion ? <Button
                            type='button'
                            text
                            rounded
                            className="m-0 p-0 shadow-none border-none"
                            icon="pi pi-refresh"
                            onClick={() => reloadRow(data)}
                        /> : data.isCustom
                            ? <i className="pi pi-user-edit text-blue-500"></i>
                            : <i className="pi pi-check"></i>
                        }
                    </div>
                }
            />
        </DataTable>
        <div className='col-12 flex pt-3 justify-content-end'>
            <div className='flex'>
                <Button type='button' label="Send" icon="pi pi-check" onClick={onSubmit} />
            </div>
        </div>
    </>
} 
