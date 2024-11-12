"use client"

import React, { useEffect, useState } from 'react';
import { Tag, TagInput } from 'emblor';
import { addTagToFunctionAction, removeTagFromFunctionAction } from '../../config/(crud)/actions';
import { toast } from '@/components/ui/use-toast';
import { FunctionClientDAO } from '@/services/function-services';
import { Loader } from 'lucide-react';

type Props = {
    functionName: string
    functionClient: FunctionClientDAO
    tagsUI: boolean
}
export default function TagInputFunctionBox({ functionName, functionClient, tagsUI }: Props) {
    const [loading, setLoading] = useState(false)
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
    const [tags, setTags] = useState<Tag[]>(functionClient.tags.map(tag => ({id: tag, text: tag})))

    useEffect(() => {
        setTags(functionClient.tags.map(tag => ({id: tag, text: tag})))
    }, [functionClient.tags])

    function onTagAdd(tag: string) {
        setLoading(true)
        addTagToFunctionAction(functionClient.clientId, functionClient.functionId, tag)
        .then(updated => {
            if (updated) {
                toast({title: "Etiqueta agregada"})
            } else {
                toast({title: "Error al agregar etiqueta", variant: "destructive"})
            }
        })
        .catch(error => {
            toast({title: "Error al agregar etiqueta", variant: "destructive"})
        })
        .finally(() => {
            setLoading(false)
        })
    }

    function onTagRemove(tag: string) {
        setLoading(true)
        removeTagFromFunctionAction(functionClient.clientId, functionClient.functionId, tag)
        .then(updated => {
            if (updated) {
                toast({title: "Etiqueta eliminada"})
            } else {
                toast({title: "Error al eliminar etiqueta", variant: "destructive"})
            }
        })
        .catch(error => {
            toast({title: "Error al eliminar etiqueta", variant: "destructive"})
        })
        .finally(() => {
            setLoading(false)
        })
    }

    const label = tagsUI ? functionName : "Etiquetas"

    return (
        <div>
            <div className="flex items-center gap-x-2 border-b pb-2 pl-2">                
                <p className="font-bold">{label}:</p>
                { loading && <Loader className="animate-spin" /> }
            </div>

            <div className="mt-2 bg-background p-2 rounded-md">
                <TagInput 
                    loa
                    tags={tags}
                    setTags={setTags}            
                    placeholder="Agregar etiqueta"
                    activeTagIndex={activeTagIndex}
                    setActiveTagIndex={setActiveTagIndex}
                    inlineTags={false}
                    styleClasses = {
                        {
                        input: 'w-full',
                        }
                    }
                    onTagAdd={onTagAdd}
                    onTagRemove={onTagRemove}
                />                
            </div>

        </div>
    );
};
