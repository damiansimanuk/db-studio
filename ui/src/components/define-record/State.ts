import { create } from "zustand";
import { createStoreEntryPoint } from "../../core/api/Store";


const mergeSqlStore = createStoreEntryPoint("/api/Database/GetMergeSql", "post");
export type RecordData = typeof mergeSqlStore.types.body;

interface RecordStore {
    record: RecordData;
    getRootRecord: () => RecordData;
    getRecord: (parentTableId: number, parentColumnId: number) => RecordData | null;
}

const flatRecords = (record: RecordData) => {
    if (!record) return [];

    const records: RecordData[] = [record];
    for (const element of record.dependencies ?? []) {
        records.push(...flatRecords(element));
    }
    return records;
}


export const useRecordStore = create<RecordStore>((set, get) => ({
    record: {} as RecordData,

    getRootRecord: () => get().record,

    getRecord: (parentTableId: number, parentColumnId: number) => {
        let root = get().record

        // create root record if not exists
        if (!root && !parentTableId) {
            root = {
                tableId: null,
                columns: {},
                dependencies: []
            }
            set({ record: root })
        }
        const records = flatRecords(root);
        let parent = records.find(e => e.tableId === parentTableId)

        // only if parent exists create child or return dependency item
        if (parent) {
            let item = parent.dependencies.find(e => e.parentColumn === parentColumnId)
            if (!item && parentTableId && parentColumnId) {
                item = {
                    parentColumn: parentColumnId,
                    parentTableId,
                    tableId: null,
                    columns: {},
                    dependencies: []
                }
                parent.dependencies.push(item)
                set({ record: root })
            }
            return item
        }
        return null;
    },
}));