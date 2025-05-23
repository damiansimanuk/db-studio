import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import React, { createContext, useContext, useRef } from 'react'


function createMessageContext() {
    const toast = useRef<Toast>(null)
    const confirmDialog = useRef<ConfirmDialog>(null)

    return {
        toast,
        confirmDialog,
    }
}

const messageContext = createContext<ReturnType<typeof createMessageContext> | null>(null)

export function MessageProvider(props: React.PropsWithChildren<{}>) {
    var context = createMessageContext()

    return (
        <messageContext.Provider value={context} >
            <Toast ref={context.toast} />
            <ConfirmDialog ref={context.confirmDialog}
                style={{ minWidth: '40vw', maxWidth: '960px' }}
                breakpoints={{ '960px': '100vw' }} />
            {props.children}
        </messageContext.Provider>
    )
}

export const useToast = () => {
    const context = useContext(messageContext)
    return context?.toast?.current
}

export const useConfirmDialog = () => {
    return confirmDialog
}

