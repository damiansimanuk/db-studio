import { Controller, type Control } from "react-hook-form"
import { databaseStructureStore, useTableStructure } from "../../core/api/Shared"
import { Checkbox } from "primereact/checkbox"
import { InputText } from "primereact/inputtext"
import { InputNumber } from "primereact/inputnumber"
import { Calendar } from "primereact/calendar"
import { classNames } from "primereact/utils"
import { Dropdown } from "primereact/dropdown"
import { useEffect, useState } from "react"
import { DefineRecordDialog } from "./DefineRecordDialog"
import { Button } from "primereact/button"
import type { RecordData } from "./DefineRecord"
import { useTable } from "../../core/api/Shared"

const getInputType = (dataType: string) => {
    const type = dataType?.toLowerCase() || '';

    if (type.includes('int') || type.includes('decimal') || type.includes('numeric') || type.includes('float') || type.includes('double')) {
        return 'number';
    }

    if (type.includes('date') || type.includes('time')) {
        return 'date';
    }

    if (type.includes('bit') || type.includes('boolean')) {
        return 'checkbox';
    }

    return 'text';
};


const getValidationRules = (column: typeof databaseStructureStore.types.result[0]['columns'][0]) => {
    const rules: any = {};

    if (column.isIdentity)
        return rules;

    if (!column.isNullable) {
        rules.required = `${column.columnName} is required`;
    }

    if (column.columnName.toLowerCase().includes('email')) {
        rules.pattern = {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
        };
    }

    return rules;
};


const FkSelect = ({
    connectionName,
    column,
    field,
    fieldState,
    parentRecordData,
}: {
    connectionName: string;
    column: typeof databaseStructureStore.types.result[0]['columns'][0];
    field: any;
    fieldState: any;
    parentRecordData: RecordData;
}) => {
    const [recordData, setRecordData] = useState<RecordData>(null);
    const table = useTable(connectionName, column.schemaFK, column.tableFK, "FkSelect_");

    const getAndUpdateItem = (itemId: any) => {
        field.onChange(itemId)

        let item = parentRecordData.dependencies.find(e => e.parentColumn === column.columnName)

        if (!item) {
            item = {
                tableId: table.struct.tableId,
                parentColumn: column.columnName,
                columns: {},
                dependencies: []
            }
            parentRecordData.dependencies.push(item)
        }

        const record = table.getRecord(itemId)
        Object.assign(item, { columns: record })

        return item
    }

    const configRecord = () => {
        let item = getAndUpdateItem(field.value)
        setRecordData(item)
    }

    const onCloseDialog = () => {
        setRecordData(null)
    }

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
                    optionLabel="__repr"
                    optionValue="__id"
                    placeholder="Select a item"
                    showClear
                    appendTo={document.body}
                />
                <Button
                    icon="pi pi-pencil"
                    className="p-button-success"
                    type="button"
                    onClick={() => configRecord()} />
            </div>

        </>
    );
};

export const RenderFormField = ({
    connectionName,
    control,
    column,
    recordData,
}: {
    connectionName: string,
    control: Control<any, any>,
    column: typeof databaseStructureStore.types.result[0]['columns'][0],
    recordData: RecordData
}) => {
    const fieldName = column.columnName;
    const inputType = getInputType(column.dataType);
    const rules = getValidationRules(column);
    const isRequired = !column.isNullable;

    // Skip identity columns for new records
    if (column.isIdentity && !recordData)
        return null;

    return (
        <div key={fieldName} className="field mb-4">

            <Controller
                name={fieldName}
                control={control}
                rules={rules}
                render={({ field, fieldState }) => (
                    <>
                        <span className="p-float-label mt-5">
                            <div className="p-inputwrapper-filled">
                                {column.isFK ? (
                                    <FkSelect
                                        connectionName={connectionName}
                                        column={column}
                                        field={field}
                                        fieldState={fieldState}
                                        parentRecordData={recordData}
                                    />
                                ) : inputType === 'checkbox' ? (
                                    <Checkbox
                                        inputId={fieldName}
                                        checked={!!field.value}
                                        onChange={(e) => field.onChange(e.checked)}
                                        className={classNames({ 'p-invalid': fieldState.error })}
                                    />
                                ) : inputType === 'date' ? (
                                    <Calendar
                                        id={fieldName}
                                        value={field.value ? new Date(field.value as string) : null}
                                        onChange={(e) => field.onChange(e.value)}
                                        showTime={column.dataType?.toLowerCase().includes('time')}
                                        className={classNames({ 'p-invalid': fieldState.error })}
                                        panelClassName="min-w-min"
                                        appendTo={document.body}
                                        showButtonBar
                                    />
                                ) : inputType === 'number' ? (
                                    <InputNumber
                                        id={fieldName}
                                        value={field.value ?? ''}
                                        onValueChange={(e) => field.onChange(e.value)}
                                        className={classNames('w-full', { 'p-invalid': fieldState.error })}
                                        mode="decimal"
                                    />
                                ) : (
                                    <InputText
                                        id={fieldName}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        className={classNames('w-full', { 'p-invalid': fieldState.error })}
                                        type={inputType}
                                    />
                                )}
                            </div>
                            <label
                                htmlFor={fieldName}
                                className={classNames('block font-medium')}
                            >
                                {fieldName}
                                {isRequired && <span className="ml-1">*</span>}
                            </label>
                        </span>
                        {fieldState.error && (
                            <small className="p-error">{fieldState.error.message}</small>
                        )}
                    </>
                )}
            />
        </div>
    );
};
