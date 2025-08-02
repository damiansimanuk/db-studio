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
    const [showDiff, setShowDiff] = useState(true);
    const [visible, setVisible] = useState(true);
    const [highlighted, setHighlighted] = useState('');

    useEffect(() => {
        const show = !!newSql;
        if (show) {
            const highlightText = showDiff
                ? Prism.highlight(
                    diffSql,
                    Prism.languages.diff,
                    'diff-sql'
                ) : Prism.highlight(
                    newSql,
                    Prism.languages.sql,
                    'sql'
                );
            setHighlighted(highlightText);
            setVisible(true);
        }
        else {
            setHighlighted('');
            setVisible(false);
        }
    }, [newSql, showDiff]);

    function handleEditorMount(editor: MonacoDiffEditor, monaco: Monaco) {
        editorRef.current = editor;
        setupAutocomplete(monaco);
    };

    // function setupSQLAutocomplete(monaco: Monaco) {
    //     type TMonaco = typeof monaco.languages.lang
    //     monaco.languages.registerCompletionItemProvider('sql', {
    //         provideCompletionItems: (model, position) => {
    //             const suggestions: TMonaco.CompletionItem[] = [];
    //             const textUntilPosition = model.getValueInRange({
    //                 startLineNumber: position.lineNumber,
    //                 startColumn: 1,
    //                 endLineNumber: position.lineNumber,
    //                 endColumn: position.column
    //             });

    //             return { suggestions: ["SimaPepe"] };
    //         }
    //     });
    // }


    // Autocompletado básico
    const setupAutocomplete = (editor: Monaco) => {

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

        // editor.languages.registerCompletionItemProvider('sql', {
        //     triggerCharacters: [".", " "], // Activa en "." y espacios
        //     provideCompletionItems: (model, position) => {
        //         const suggestions: monaco.languages.CompletionItem[] = [
        //             {
        //                 label: 'simpleFunction',
        //                 kind: monaco.languages.CompletionItemKind.Function,
        //                 insertText: 'simpleFunction(${1:param})',
        //                 insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        //                 range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        //                 detail: 'Función simple con un parámetro',
        //             },
        //         ];

        //         const nativeSuggestions = nativeCompletionItemProvider.provideCompletionItems(model, position);

        //         // Combina las sugerencias
        //         const allSuggestions = [...suggestions, ...(nativeSuggestions || [])];



        //         return { suggestions };
        //     },
        // });
    };

    return <>
        <Dialog
            visible={visible}
            header={(`Merge SQL`)}
            onHide={() => setVisible(false)}
            style={{ width: 'max(800px, 50vw)' }}
            breakpoints={{ '960px': '100vw' }}
            modal
            maximizable
            maximized
            footer={
                <div className="flex justify-content-end mt-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text"
                        severity="danger"
                        onClick={() => setVisible(false)} />
                    <Button
                        label="Save"
                        className="mr-0"
                        icon="pi pi-save"
                        severity="success"
                        onClick={() => onSave?.()} />
                </div>
            }
        >
            {/* <div className="w-full flex justify-content-end">
                {showDiff ? 'asdf' : 'no'}
                <Checkbox inputId="diff" checked={showDiff} onClick={() => setShowDiff(!showDiff)}   ></Checkbox>
                <label  >lala</label>
                <Button icon="pi pi-plus" label="Diff" text className="m-0 shadow-none" onClick={() => { }} />
            </div> */}

            {/* <pre className="language-diff-sql diff-highlight"
                dangerouslySetInnerHTML={{ __html: highlighted }}
            /> */}

            {/* <Editor
                height="300px"
                language="sql"
                theme="vs-dark"
                defaultValue={diffSql}
            /> */}

            <DiffEditor
                language="sql"
                theme="vs-dark"
                options={{
                    readOnly: false,
                    renderSideBySide: false,
                }}
                original={originalSql}
                modified={newSql}
                onMount={(editor, monaco) => setupAutocomplete(monaco)}
            />

        </Dialog>
    </>;
}



