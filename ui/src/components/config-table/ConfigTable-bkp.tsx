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
    const allStruct = databaseStructureStore.use();
    const struct = useTableStructure(options.connectionName, options.schema, options.table);
    const [selectedColumn, setSelectedColumn] = useState<typeof configTableStore.types.body>(null);
    const [columns, setColumns] = useState<typeof configTableStore.types.body[]>([]);
    const [schemaFKs, setSchemaFKs] = useState<string[]>([]);
    const [tableFKs, setTableFKs] = useState<string[]>([]);

    const { control, handleSubmit, reset } = useForm({ defaultValues: selectedColumn ?? {} });

    const isIdentity = useController({ control, name: 'isIdentity' });
    const isNullable = useController({ control, name: 'isNullable' });
    const isPK = useController({ control, name: 'isPK' });
    const isFK = useController({ control, name: 'isFK' });
    const isUK = useController({ control, name: 'isUK' });
    const isExtension = useController({ control, name: 'isExtension' });
    const schemaFK = useController({ control, name: 'schemaFK' });
    const tableFK = useController({ control, name: 'tableFK' });

    useEffect(() => {
        reset(selectedColumn);
    }, [selectedColumn]);

    useEffect(() => {
        if (allStruct?.data) {
            const schemas = [...new Set(allStruct.data.map(t => t.schema))]
            setSchemaFKs(schemas);
        }
    }, [allStruct?.data]);

    useEffect(() => {
        if (allStruct?.data) {
            const tables = [...new Set(allStruct.data.filter(t => t.schema === schemaFK.field.value).map(t => t.table))]
            setTableFKs(tables);
        }
    }, [schemaFK.field.value, allStruct?.data]);

    useEffect(() => {
        if (struct?.columns) {
            setColumns(struct.columns.map(c => ({ ...c })));
            setSelectedColumn(struct.columns[0]);
            console.log('ConfigTable struct', JSON.stringify(struct, null, 2));
        }
    }, [struct?.columns]);

    const onSubmit = (data: typeof selectedColumn) => {
        console.log('ConfigTable onSubmit', JSON.stringify(data, null, 2));

        configTable.fetch({
            path: {
                connectionName: options.connectionName,
            },
            body: {
                connectionName: options.connectionName,
                schema: options.schema,
                table: options.table,
                columnName: data.columnName,
                isIdentity: data.isIdentity,
                isNullable: data.isNullable,
                isPK: data.isPK,
                isFK: data.isFK,
                isUK: data.isUK,
                isExtension: data.isExtension,
                schemaFK: data.schemaFK,
                tableFK: data.tableFK,
            }
        }).then(() => {
            allStruct.setOptions(allStruct.options);
            options.onHide?.();
        })
    }

    return <>
        <DataTable
            value={columns}
            size="small"
            scrollable
            scrollHeight={`${columns.length > 10 ? "450px" : undefined}`}
            cellClassName={() => "p-0 m-0 nowrap px-2"}
            className="nowrap" 
        >
            <Column field="columnName" header="Column Name" className="nowrap px-2" />
            <Column field="dataType" header="Data Type" className="nowrap px-2" />
            <Column
                field="isIdentity"
                header="Is Identity"
                body={(data) => <Checkbox checked={data.isIdentity} />}
            />
            <Column
                field="isNullable"
                header="Is Nullable" 
                body={(data) => <Checkbox checked={data.isNullable} />}
            />
            <Column
                field="isPK"
                header="Is PK" 
                body={(data) => <Checkbox checked={data.isPK} />}
            />
            <Column
                field="isFK"
                header="Is FK" 
                body={(data) => <Checkbox checked={data.isFK} />}
            />
            <Column
                field="isUK"
                header="Is UK" 
                body={(data) => <Checkbox checked={data.isUK} />}
            />
            <Column
                field="isExtension"
                header="Is Extension" 
                body={(data) => <Checkbox checked={data.isExtension} />}
            />
            <Column
                field="schemaFK"
                header="Schema FK" 
                body={(data) => <Dropdown
                    inputId="schemaFK"
                    className="w-15rem"
                    options={schemaFKs}
                    value={schemaFK.field.value}
                    onChange={(e) => schemaFK.field.onChange(e.value)}
                    showClear
                />}
            />
            <Column
                field="tableFK"
                header="Table FK"
                body={(data) => <Dropdown
                    inputId="tableFK"
                    className="w-15rem"
                    options={tableFKs}
                    value={tableFK.field.value}
                    onChange={(e) => tableFK.field.onChange(e.value)}
                    showClear
                />}
            />
        </DataTable>
        <div className='col-12 flex pt-3 justify-content-end'>
            <div className='flex'>
                <Button type='button' label="Send" icon="pi pi-check" onClick={handleSubmit(onSubmit)} />
            </div>
        </div>
    </>

    return <>
        <form >
            <div className="p-fluid grid" >

                <div className="col-12">
                    <span className="p-float-label mt-4">
                        <Dropdown
                            inputId="column"
                            options={struct.columns}
                            optionLabel="columnName"
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.value)}
                        />
                        <label htmlFor="column">Column</label>
                    </span>
                </div>

                <div className="col-12 flex align-items-center gap-4">
                    <span className="flex align-items-center mt-3">
                        <Checkbox inputId="isIdentity" {...isIdentity.field} checked={isIdentity.field.value} onChange={(e) => isIdentity.field.onChange(e.checked)} />
                        <label htmlFor="isIdentity" className="ml-2">Is Identity</label>
                    </span>

                    <span className="flex align-items-center mt-3">
                        <Checkbox inputId="isNullable" {...isNullable.field} checked={isNullable.field.value} onChange={(e) => isNullable.field.onChange(e.checked)} />
                        <label htmlFor="isNullable" className="ml-2">Is Nullable</label>
                    </span>

                    <span className="flex align-items-center mt-3">
                        <Checkbox inputId="isPK" {...isPK.field} checked={isPK.field.value} onChange={(e) => isPK.field.onChange(e.checked)} />
                        <label htmlFor="isPK" className="ml-2">Is PK</label>
                    </span>

                    <span className="flex align-items-center mt-3">
                        <Checkbox inputId="isFK" {...isFK.field} checked={isFK.field.value} onChange={(e) => isFK.field.onChange(e.checked)} />
                        <label htmlFor="isFK" className="ml-2">Is FK</label>
                    </span>

                    <span className="flex align-items-center mt-3">
                        <Checkbox inputId="isUK" {...isUK.field} checked={isUK.field.value} onChange={(e) => isUK.field.onChange(e.checked)} />
                        <label htmlFor="isUK" className="ml-2">Is UK</label>
                    </span>

                    <span className="flex align-items-center mt-3">
                        <Checkbox inputId="isExtension" {...isExtension.field} checked={isExtension.field.value} onChange={(e) => isExtension.field.onChange(e.checked)} />
                        <label htmlFor="isExtension" className="ml-2">Is Extension</label>
                    </span>
                </div>

                <div className="col-6">
                    <span className="p-float-label mt-5">
                        <Dropdown
                            inputId="schemaFK"
                            options={schemaFKs}
                            value={schemaFK.field.value}
                            onChange={(e) => schemaFK.field.onChange(e.value)}
                            showClear
                        />
                        <label htmlFor="schemaFK">Schema FK</label>
                    </span>
                </div>

                <div className="col-6">
                    <span className="p-float-label mt-5">
                        <Dropdown
                            inputId="tableFK"
                            options={tableFKs}
                            value={tableFK.field.value}
                            onChange={(e) => tableFK.field.onChange(e.value)}
                            showClear
                        />
                        <label htmlFor="tableFK">Table FK</label>
                    </span>
                </div>

                <div className='col-12 flex pt-3 justify-content-end'>
                    <div className='flex'>
                        <Button type='button' label="Send" icon="pi pi-check" onClick={handleSubmit(onSubmit)} />
                    </div>
                </div>
            </div>
        </form>
    </>
} 
