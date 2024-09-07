"use client"

import { Editor as NovelEditor } from "novel";
import { useEffect, useRef, useState } from "react";

type Props = {
    content: string
}
export default function ContentViewer({ content }: Props) {

    const editorContainerRef = useRef<HTMLDivElement>(null)

    const [isContentLoaded, setIsContentLoaded] = useState(false)


    useEffect(() => {
        const timeoutId = setTimeout(() => setIsContentLoaded(true), 500)

        return () => clearTimeout(timeoutId);
    }, [])
    
    useEffect(() => {
       
        if (editorContainerRef.current && isContentLoaded) {
            const firstElement = editorContainerRef.current.querySelector('.invisible-anchor');
            
            if (firstElement) {                
                firstElement.scrollIntoView();
            }
        }
    }, [editorContainerRef, isContentLoaded]);
    const editorProps = {
        editable: () => false,
    }

    return (
        <div ref={editorContainerRef} className="w-full border rounded-b-lg">

            <div className="invisible-anchor" style={{ position: 'absolute', top: '0', left: '0', opacity: 0 }}/>

            <NovelEditor
                className="w-full bg-white rounded-t-none rounded-b-md"
                defaultValue={content ? JSON.parse(content) : {}}
                disableLocalStorage
                editorProps={editorProps}
            />
        </div>
    )
}