import { useForm } from "react-hook-form"
import { useTableStructure } from "../../core/api/Shared"
import { Button } from "primereact/button"
import { Spinner } from "../../layout/Spinner"
import { useEffect, useState } from "react"
import { Toast } from "primereact/toast"
import { useRef } from "react"
import { RenderFormField } from "./RenderFormField"
import { createStoreEntryPoint } from "../../core/api/Store";


const mergeSqlStore = createStoreEntryPoint("/api/Database/GetMergeSql", "post");
export type RecordData = typeof mergeSqlStore.types.body;

export type TRecord = {
    connectionName: string,
    schemaName: string,
    tableName: string,
    recordData: RecordData,
    isRoot?: boolean,
    onSuccess?: () => void
    onError?: () => void
    onHide?: () => void
}

export function DefineRecordForm({
    connectionName,
    schemaName,
    tableName,
    recordData,
    isRoot,
    onSuccess,
    onError,
    onHide
}: TRecord) {
    const mergeSql = mergeSqlStore.use();
    const struct = useTableStructure(connectionName, schemaName, tableName);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    const { control, handleSubmit, reset } = useForm<RecordData['columns']>({
        defaultValues: {},
    });

    useEffect(() => {
        if (recordData?.columns) {
            reset(recordData.columns);
        }
    }, [recordData?.columns]);

    const onSave = async (data: RecordData['columns']) => {
        Object.assign(recordData.columns, data)
        console.log('Submitting recordData:', JSON.stringify(recordData, null, 2));
        if (!isRoot) {
            onSuccess?.();
            return;
        }

        setLoading(true);
        try {
            // Here you would typically call your API to save the data
            console.log('Submitting data:', data);

            await mergeSql.fetch({
                query: { connectionName },
                body: recordData
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Record saved successfully',
                life: 3000
            });

            onSuccess?.();
        } catch (error: any) {
            console.error('Error saving record:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to save record',
                life: 5000
            });
            onError?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Spinner loading={loading} />

            <Toast ref={toast} position="top-right" />
            <form >
                <div className="p-fluid">
                    {struct?.columns?.map((column) => RenderFormField({
                        connectionName,
                        control,
                        column,
                        recordData
                    }))}

                    <div className="col flex justify-content-end mt-4">
                        <div className="flex">
                            <Button
                                type="button"
                                label="Cancel"
                                className="p-button-text mr-2"
                                onClick={() => onHide?.()}
                                disabled={loading}
                            />
                            <Button
                                type="button"
                                onClick={handleSubmit(onSave)}
                                label={loading ? 'Saving...' : 'Save'}
                                icon="pi pi-check"
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}


