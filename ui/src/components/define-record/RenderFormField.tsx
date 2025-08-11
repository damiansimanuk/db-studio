import { Controller, type Control } from "react-hook-form"
import { databaseStructureStore } from "../../core/api/Shared"
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { InputText } from "primereact/inputtext"
import { InputMask } from 'primereact/inputmask'
import { InputNumber } from "primereact/inputnumber"
import { Calendar } from "primereact/calendar"
import { classNames } from "primereact/utils"
import type { RecordData } from "./DefineRecordDialog"
import { FkSelect } from "./FkSelect"
import type { components } from "../../core/api/request/swagger"
import { boolToString, toBoolean } from "../../core/helper/Helper";

const getInputType = (type: components["schemas"]["DataTypeEnum"]) => {

    switch (type) {
        case 'Integer':
            return 'number';
        case 'Float':
        case 'Decimal':
            return 'decimal-number';
        case 'Boolean':
            return 'checkbox';
        case 'DateTime':
        case 'DateTimeOffset':
            return 'datetime';
        case 'TimeOnly':
            return 'time';
        case 'Xml':
        case 'Json':
            return 'longText';
        case 'Binary':
            return 'binary'
        case 'String':
        case 'Char':
        case 'Guid':
            return 'text'
        default:
            return 'text'
    }
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
    const inputType = getInputType(column.dataType ?? 'Undefined');
    const rules = getValidationRules(column);
    const isRequired = !column.isNullable;
    const inlineLabel = inputType == 'checkbox'

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
                        {inlineLabel && <div className="flex align-items-center">
                            {inputType === 'checkbox' &&
                                <TriStateCheckbox
                                    inputId={fieldName}
                                    required={isRequired}
                                    value={toBoolean(field.value)}
                                    onChange={(e) => field.onChange(boolToString(e.value))}
                                    className={classNames({ 'p-invalid': fieldState.error })}
                                />}
                            <label
                                htmlFor={fieldName}
                                className='font-medium ml-2 no-select cursor-pointer'
                            >
                                {column.isFK ? column.columnName.replace(/_?id$/i, "").replace(/^_?id/i, "") : column.columnName}
                                {isRequired && <span className="ml-1">*</span>}
                            </label>
                        </div>}
                        {!inlineLabel && <span className="p-float-label mt-5">
                            <div className="p-inputwrapper-filled">
                                {column.isFK ? (
                                    <FkSelect
                                        connectionName={connectionName}
                                        column={column}
                                        field={field}
                                        fieldState={fieldState}
                                        parentRecordData={recordData}
                                    />
                                ) : inputType === 'datetime' ? (
                                    <Calendar
                                        id={fieldName}
                                        value={field.value ? new Date(field.value as string) : null}
                                        onChange={(e) => field.onChange(e.value)}
                                        showTime={column.dataType?.toLowerCase().includes('time')}
                                        className={classNames({ 'p-invalid': fieldState.error })}
                                        panelClassName="min-w-min"
                                        appendTo={document.body}
                                        showButtonBar
                                        dateFormat="yy-mm-dd"
                                        hourFormat="24"
                                        showSeconds={true}
                                        showMillisec={true}
                                    />
                                ) : inputType === 'number' ? (
                                    <InputNumber
                                        id={fieldName}
                                        value={field.value}
                                        allowEmpty
                                        onValueChange={(e) => field.onChange(e.value ? e.value.toString() : null)}
                                        className={classNames('w-full', { 'p-invalid': fieldState.error })}
                                        useGrouping={false}
                                    />
                                ) : inputType === 'decimal-number' ? (
                                    <InputNumber
                                        id={fieldName}
                                        value={field.value}
                                        allowEmpty
                                        onValueChange={(e) => field.onChange(e.value ? e.value.toString() : null)}
                                        className={classNames('w-full', { 'p-invalid': fieldState.error })}
                                        mode="decimal"
                                        useGrouping={false}
                                        minFractionDigits={1}
                                        maxFractionDigits={9}
                                    />
                                ) : inputType === 'time' ? (
                                    <InputMask
                                        id={fieldName}
                                        value={field.value}
                                        onChange={field.onChange}
                                        className={classNames('w-full', { 'p-invalid': fieldState.error })}
                                        mask="99:99:99"
                                    />
                                ) : inputType === 'binary' ? (
                                    <InputText
                                        id={fieldName}
                                        value={field.value}
                                        onChange={field.onChange}
                                        className={classNames('w-full', { 'p-invalid': fieldState.error })}
                                        type={inputType}
                                    />
                                ) : (
                                    <InputText
                                        id={fieldName}
                                        value={field.value}
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
                                {column.isFK ? column.columnName.replace(/_?id$/i, "").replace(/^_?id/i, "") : column.columnName}
                                {isRequired && <span className="ml-1">*</span>}
                            </label>
                        </span>}

                        {fieldState.error &&
                            <small className="p-error">{fieldState.error.message}</small>
                        }
                    </>
                )}
            />
        </div >
    );
};
