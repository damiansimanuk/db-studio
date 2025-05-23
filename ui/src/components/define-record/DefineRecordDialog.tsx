import { Dialog } from "primereact/dialog"
import { DefineRecordForm } from "./DefineRecord"
import type { TRecord } from "./DefineRecord"

export function DefineRecordDialog(options: TRecord) {
    return <>
        <Dialog
            visible={!!options.recordData}
            header={(options.recordData?.columns?._id_ != null
                ? `Edit record in table ${options.schemaName}.${options.tableName}`
                : `Create new record in table ${options.schemaName}.${options.tableName}`)}
            onHide={() => options.onHide?.()}
            style={{ width: 'max(800px, 50vw)' }}
            breakpoints={{ '960px': '100vw' }}
            modal
        >
            <DefineRecordForm  {...options} />
        </Dialog>
    </>
} 
