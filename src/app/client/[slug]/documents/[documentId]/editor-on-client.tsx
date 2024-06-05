"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { DocumentDAO } from "@/services/document-services";
import { Loader, Save } from "lucide-react";
import { Editor } from '@tiptap/core';
import { Editor as NovelEditor } from "novel";
import { useEffect, useRef, useState } from "react";
import { updateContentAction } from "../document-actions";
import { ToastAction } from "@/components/ui/toast";
import LinkBox from "./link-box";

type Props = {
    document: DocumentDAO
    initialContent: string
    basePath: string
}

export default function NovelOnClient({ document, initialContent, basePath }: Props) {

    const [loading, setLoading] = useState(false);
    const [textContent, setTextContent] = useState<string>(document.textContent || "")
    const [jsonContent, setJsonContent] = useState<string>(document.jsonContent || initialContent)
    const [wordCount, setWordCount] = useState(document.textContent?.split(" ").length || 0)
    const [charCount, setCharCount] = useState(document.textContent?.length || 0)
    const [charCountSaved, setCharCountSaved] = useState(document.textContent?.length || 0)
    const [sections, setSections] = useState(Math.ceil(wordCount/1000))

      
    // Referencia para mantener actualizada la función de desmontaje
    const onBeforeUnmountRef = useRef<() => void>();

    useEffect(() => {
        // Actualiza la referencia en cada renderizado para capturar el estado actual
        onBeforeUnmountRef.current = () => {

            if (charCount !== charCountSaved) {
                toast({
                    title: "Tienes cambios sin guardar.",
                    variant: "destructive",
                    action: <ToastAction altText="Try again" onClick={() => save()}>Guardar Cambios</ToastAction>,
                  })
            }
        };
    });
    
    useEffect(() => {
        // Función que se ejecutará al desmontar el componente
        return () => {
            // Ejecuta la función actual referenciada
            if(onBeforeUnmountRef.current) {
                onBeforeUnmountRef.current();
            }
        };
    }, []);
    
    
    function onUpdate(editor: Editor | undefined) {
        console.log("guardando");
        
        if (!editor) {
            return
        }
        setJsonContent(JSON.stringify(editor.getJSON()))
        setTextContent(editor.getText())

        const wordCount = editor.getText().split(" ").length
        setWordCount(wordCount)
        setCharCount(editor.getText().length)
        const sectionsCount= Math.ceil(wordCount/1000)
        setSections(sectionsCount)
    }

    function save() {
       
        setLoading(true);
        updateContentAction(document.id, textContent, jsonContent)
        .then(() => {
            toast({ title: "Texto guardado"})
            setCharCountSaved(charCount)
        })
        .catch(() => {
            toast({ title: "Hubo un error al guardar el texto", variant: "destructive"})
        })
        .finally(() => {
            setLoading(false);
        })
    }

    return (
        <div className="relative flex h-full xl:min-w-[1000px] flex-col items-center gap-4 justify-between">
            <div className="fixed z-20 flex flex-col gap-1 bottom-20 right-10">
                <Button onClick={save} className="w-10 p-2" disabled={charCount === charCountSaved}>
                {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                ) : (
                    <Save />
                )}
                </Button>
            </div>

            <div className="flex items-center justify-between w-full px-7">

                <LinkBox href={`${document.url}`} />

                <div className="flex items-center w-1/3 gap-2">
                    <p className="font-bold">{wordCount}</p> <p>palabras, </p>
                    <p className="font-bold">{sections === 1 ? "1 sección" : `${sections} secciones`}</p>
                </div>
                
                <p className="font-bold">
                {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                ) : (
                    <Button variant={charCount === charCountSaved ? "ghost" : "default"} disabled={charCount === charCountSaved} onClick={save} className="p-2">
                        Guardar
                    </Button>
                )}
                </p>
                  
            </div>
            <NovelEditor
                
                defaultValue={jsonContent ? JSON.parse(jsonContent) : {}}
                // @ts-ignore
                onDebouncedUpdate={onUpdate}
                disableLocalStorage
            />
        </div>
    )
}



