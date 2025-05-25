import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useState } from "react";
import { useElementSize } from "../core/hooks/useElementSize";
import { storeEntryPointMemo } from "../core/api/Store";
import { useTable, useTableStructure } from "../core/api/Shared";
import { Button } from "primereact/button";
import { DefineRecordDialog } from "./define-record/DefineRecordDialog";
import type { RecordData } from "./define-record/DefineRecord";
import { ConfigTableDialog } from "./config-table/ConfigTableDialog";
import { FkValue } from "./FkValue";

const paginationTableStore = storeEntryPointMemo("/api/Database/tablePaginationRecords", "get");


export function TableList({
    connectionName,
    schema,
    table,
}: {
    connectionName: string;
    schema: string;
    table: string;
}) {
    const struct = useTableStructure(connectionName, schema, table);
    const [recordData, setRecordData] = useState<RecordData>(null);
    const rows = useTable(connectionName, schema, table, "", 25);
    const elementSize = useElementSize<HTMLDivElement>({ minHeight: 200, minWidth: 200 });
    const [configTableVisible, setConfigTableVisible] = useState(false);

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2 p-2 py-0 h-3rem">
            <span className="text-xl text-900 font-bold">{struct?.schema}.{struct?.table} </span>
            <div className="flex gap-1 p-1">
                <Button icon="pi pi-plus text-xl" rounded text className="m-0 p-0 shadow-none" onClick={() => configRecord({})} />
                <Button icon="pi pi-cog text-xl" rounded text className="m-0 p-0 shadow-none text-blue-500" onClick={() => configTable()} />
            </div>
        </div>
    );

    const configTable = () => {
        setConfigTableVisible(true)
    }

    const configRecord = (record: any) => {
        setRecordData({
            tableId: struct.tableId,
            columns: { ...record },
            dependencies: []
        })
    }

    const onCloseDialog = (success: boolean) => {
        setRecordData(null)
        if (success) {
            rows.setPage(rows.page, rows.perPage);
        }
    }

    return (
        <div className="h-full w-full relative" ref={elementSize.ref}>

            {configTableVisible && <ConfigTableDialog
                connectionName={connectionName}
                schema={schema}
                table={table}
                onHide={() => setConfigTableVisible(false)}
            />}

            <DefineRecordDialog
                connectionName={connectionName}
                schemaName={schema}
                tableName={table}
                recordData={recordData}
                isRoot={true}
                onSuccess={() => onCloseDialog(true)}
                onHide={() => onCloseDialog(false)}
                onError={() => onCloseDialog(false)}
            />

            <div>
                <DataTable
                    header={header}
                    paginator
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    className="top-0 left-0 absolute w-full p-0 m-0 border border-1 border-gray-600"
                    value={rows?.items ?? []}
                    scrollable
                    scrollHeight={elementSize.height}
                    showGridlines
                    lazy
                    totalRecords={rows?.totalCount ?? 0}
                    rows={rows?.perPage ?? 10}
                    first={((rows?.page ?? 1) - 1) * (rows?.perPage ?? 10)}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    onPage={(e) => rows.setPage(Math.floor(e.first / e.rows) + 1, e.rows)}
                >

                    {struct?.columns?.map((column) => (column.isFK
                        ? <Column
                            header={column.columnName}
                            className="nowrap p-1 px-2"
                            body={(row) => <FkValue
                                connectionName={connectionName}
                                schemaName={column.schemaFK}
                                tableName={column.tableFK}
                                value={row?.[column.columnName]}
                                visited={[]}
                            />}
                        />
                        : <Column
                            header={column.columnName}
                            className="nowrap p-1 px-2"
                            field={column.columnName}
                        />
                    ))}
                    <Column frozen alignFrozen="right" align="center"
                        style={{ minWidth: '4rem', width: '4rem' }}
                        className="m-0 p-1 bg-gray-800"
                        headerClassName="bg-gray-800 m-0"
                        header="Actions"
                        body={(r: any) => <>
                            <Button icon="pi pi-pencil text-xl" rounded text className="m-0 p-0 shadow-none" onClick={() => configRecord(r)} />
                        </>}
                    />
                </DataTable>
            </div>
        </div >
    );
}