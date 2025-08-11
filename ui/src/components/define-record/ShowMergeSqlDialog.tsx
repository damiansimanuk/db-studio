import { Dialog } from "primereact/dialog";
import { useEffect, useRef, useState } from "react";
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-diff';
import 'prismjs/plugins/diff-highlight/prism-diff-highlight';
import 'prismjs/plugins/diff-highlight/prism-diff-highlight.css';
import 'prismjs/themes/prism-tomorrow.css';
// import 'prismjs/themes/prism-okaidia.css';  
import './ShowMergeSqlDialog.css';
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { DiffEditor, type Monaco, type MonacoDiffEditor } from '@monaco-editor/react';
import { languages } from "monaco-editor";
import * as monaco from 'monaco-editor';

export function ShowMergeSqlDialog({
    originalSql,
    newSql,
    diffSql,
    onSave,
}: {
    originalSql: string;
    newSql: string;
    diffSql: string;
    onSave?: () => void;
}) {
    const editorRef = useRef<MonacoDiffEditor>(null);
    const [visible, setVisible] = useState(true);


    const handleEditorMount = (diffEditor: MonacoDiffEditor, editor: Monaco) => {
        editorRef.current = diffEditor;
        setupAutocomplete(editor);
    };

    const handleDialogHide = () => {
        setTimeout(() => editorDispose(), 1);
        setVisible(false);
    };

    const editorDispose = () => {
        if (editorRef.current) {
            editorRef.current.getOriginalEditor()?.dispose();
            editorRef.current.getModifiedEditor()?.dispose();
            editorRef.current.dispose();
            editorRef.current = null;
        }
    }

    useEffect(() => {
        return () => editorDispose();
    }, []);

    const setupAutocomplete = (editor: Monaco) => {

        return;
        
        editor.languages.registerCompletionItemProvider('sql', {
            triggerCharacters: ['.', ' '],

            provideCompletionItems: function (model, position) {
                // const word = model.getWordUntilPosition(position);
                const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)

                const suggestions: monaco.languages.CompletionItem[] = [
                    {
                        label: 'myCustomFunction',
                        kind: monaco.languages.CompletionItemKind.Function,
                        documentation: 'Una función personalizada de ejemplo.',
                        insertText: 'myCustomFunction()',
                        range: range
                    },
                    {
                        label: 'customVar',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        documentation: 'Variable personalizada.',
                        insertText: 'customVar',
                        range: range
                    }
                ];

                return { suggestions };
            }
        });
    };

    return <>
        <Dialog
            visible={visible}
            header={(`Merge SQL`)}
            onHide={handleDialogHide}
            style={{ width: 'max(800px, 50vw)' }}
            breakpoints={{ '960px': '100vw' }}
            modal={true}
            maximizable
            maximized
            footer={
                <div className="flex justify-content-end mt-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text"
                        severity="danger"
                        onClick={() => handleDialogHide()} />
                    <Button
                        label="Save"
                        className="mr-0"
                        icon="pi pi-save"
                        severity="success"
                        onClick={() => onSave?.()} />
                </div>
            }
        >
            <DiffEditor
                language="sql"
                theme="vs-dark"
                options={{
                    readOnly: false,
                    renderSideBySide: false,
                }}
                original={originalSql}
                modified={newSql}
                onMount={handleEditorMount}
            />
        </Dialog>
    </>;
}



