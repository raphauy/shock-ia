"use client"

import React, { useState } from 'react';
import { Tag, TagInput } from 'emblor';
import { toast } from '@/components/ui/use-toast';
import { FunctionClientDAO } from '@/services/function-services';
import { Loader } from 'lucide-react';
import { addTagAction, removeTagAction } from './actions';

type Props = {
    clientId: string
    tags: string[]
}
export default function TagInputBox({ clientId, tags }: Props) {
    const [loading, setLoading] = useState(false)
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
    const [tagsState, setTags] = useState<Tag[]>(tags.map(tag => ({id: tag, text: tag})));

    function onTagAdd(tag: string) {
        setLoading(true)
        addTagAction(clientId, tag)
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
        removeTagAction(clientId, tag)
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

    return (
        <div className="h-32">
            <div className="bg-background p-2 rounded-md">
                <TagInput 
                    tags={tagsState}
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
            { loading && <Loader className="animate-spin ml-2" /> }
        </div>
    );
};
