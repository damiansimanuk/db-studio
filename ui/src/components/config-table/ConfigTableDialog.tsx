import { Dialog } from "primereact/dialog";
import { ConfigTable } from "./ConfigTable";
import type { TConfigTable } from "./ConfigTable";


export function ConfigTableDialog(options: TConfigTable) {
    return <>
        <Dialog
            visible={!!options.table}
            header={`Config table ${options.schema}.${options.table}`}
            onHide={() => options.onHide?.()} 
            modal
        >
            <ConfigTable {...options} />
        </Dialog>
    </>
} 
