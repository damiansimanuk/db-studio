import { TableList } from "../components/TableList";
import { databaseStructureStore, useTableStructure } from "../core/api/Shared";
import { storeEntryPointMemo } from "../core/api/Store";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { useEffect, useState } from "react";

const connections = [
    "Rigel",
    "TNAF4PRDDB",
    "Atlasbooks",
]

export function SchemasTabs() {
    const struct = databaseStructureStore.use();
    const [connectionName, setConnectionName] = useState("Rigel");
    const [schemas, setSchemas] = useState([]);
    const [selectedSchema, setSelectedSchema] = useState(null);
    const [tables, setTables] = useState([]);

    useEffect(() => {
        struct.setOptions({ query: { connectionName } })
    }, [connectionName]);

    useEffect(() => {
        setSchemas([...new Set(struct.data?.map(e => e.schema))])
    }, [struct.data]);

    useEffect(() => {
        setTables([...new Set(struct.data?.filter(e => e.schema === selectedSchema).map(e => e.table))])
    }, [struct.data, selectedSchema]);

    return (
        <div className="w-full h-full flex flex-column">
            <div className="">
                <Dropdown
                    value={connectionName}
                    options={connections}
                    onChange={(e) => setConnectionName(e.value)}
                    placeholder="Select a connection"
                />
                <Dropdown
                    value={selectedSchema}
                    options={schemas}
                    onChange={(e) => setSelectedSchema(e.value)}
                    placeholder="Select a schema"
                />
            </div>

            <TabView className="h-full flex flex-column border border-1 border-gray-600 bg-gray-600" scrollable >
                {tables.map((table) => (
                    <TabPanel header={table} key={table} headerClassName="pr-1" contentClassName="m-0 p-0" >
                        <div className="flex-grow-1 h-full">
                            <TableList
                                connectionName={connectionName}
                                schema={selectedSchema}
                                table={table}
                            />
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    )
}
