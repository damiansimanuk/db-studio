import { Dialog } from "primereact/dialog"
import { DefineRecordForm } from "./DefineRecord"
import { useForm } from "react-hook-form";
import { createStoreEntryPoint } from "../../core/api/Store";
import { useEffect, useState } from "react";
import { Spinner } from "../../layout/Spinner";
import { Toast } from "primereact/toast"
import { useRef } from "react"
import { ShowMergeSqlDialog } from "./ShowMergeSqlDialog"
import { Button } from "primereact/button";

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

export function DefineRecordDialog({
    connectionName,
    schemaName,
    tableName,
    recordData,
    isRoot,
    onSuccess,
    onError,
    onHide
}: TRecord) {
    const [loading, setLoading] = useState(false);
    const [sql, setSql] = useState({ originalSql: '', newSql: '', diffSql: '' });
    const mergeSql = mergeSqlStore.use();
    const toast = useRef<Toast>(null);

    const { control, handleSubmit, reset } = useForm<RecordData['columns']>({
        defaultValues: {},
    });

    useEffect(() => {
        if (recordData?.columns) {
            reset(recordData.columns);
        }
        mergeSql.reset();
        setSql({ originalSql: '', newSql: '', diffSql: '' });
    }, [recordData?.columns]);

    const onAcceptForm = async (data: RecordData['columns']) => {
        Object.assign(recordData.columns, data)
        recordData.isEdition = true;
        console.log('onAcceptForm recordData:', JSON.stringify(recordData, null, 2));
        onSuccess?.();
    }

    const onCompile = async (data: RecordData['columns']) => {
        setLoading(true);
        setSql({ originalSql: '', newSql: '', diffSql: '' });

        Object.assign(recordData.columns, data)
        recordData.isEdition = true;

        try {
            await mergeSql.fetch({
                query: { connectionName },
                body: recordData
            }).then((data) => {
                setSql({ originalSql: data.originalSql, newSql: data.newSql, diffSql: data.diffSql });
            });
        } catch (error: any) {
            console.error('Error saving record:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to save record',
                life: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    return <>
        <Dialog
            visible={!!recordData}
            header={(`Config ${schemaName}.${tableName}`)}
            onHide={() => onHide?.()}
            style={{ width: 'max(800px, 50vw)' }}
            breakpoints={{ '960px': '100vw' }}
            modal
            footer={
                <div className="flex justify-content-end mt-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text"
                        severity="danger"
                        onClick={() => onHide?.()} />
                    {isRoot
                        ? <Button
                            label="Compile"
                            className="mr-0"
                            icon="pi pi-code"
                            severity="success"
                            onClick={handleSubmit(onCompile)} />
                        : <Button
                            label="Accept"
                            className="mr-0 p-button-text"
                            icon="pi pi-check"
                            severity="success"
                            onClick={handleSubmit(onAcceptForm)} />
                    }
                </div>
            }
        >
            <Spinner loading={loading} />

            <Toast ref={toast} position="top-right" />

            {!!sql.newSql && <ShowMergeSqlDialog
                originalSql={sql.originalSql}
                diffSql={sql.diffSql}
                newSql={sql.newSql}
                onSave={() => { }}
            />}

            <DefineRecordForm
                control={control}
                connectionName={connectionName}
                schemaName={schemaName}
                tableName={tableName}
                recordData={recordData}
            />
        </Dialog>
    </>
}



