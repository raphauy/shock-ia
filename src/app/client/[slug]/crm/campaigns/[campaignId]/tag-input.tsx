"use client"

import { toast } from '@/components/ui/use-toast';
import { Tag, TagInput as TagInputEmblor } from 'emblor';
import { Loader } from 'lucide-react';
import { useState } from 'react';
import { addTagToCampaignAction, removeTagFromCampaignAction } from '../campaign-actions';

type Props = {  
    campaignId: string
    initialTags: string[]
}
export default function TagInput({ campaignId, initialTags }: Props) {
    const [loading, setLoading] = useState(false)
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
    const [tags, setTags] = useState<Tag[]>(initialTags.map(tag => ({id: tag, text: tag})))


    function onTagAdd(tag: string) {
        setLoading(true)
        addTagToCampaignAction(campaignId, tag)
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
        removeTagFromCampaignAction(campaignId, tag)
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
        <div>
            <div className="flex items-center gap-x-2 ">                
                <p className="font-bold">Etiquetas:</p>
                { loading && <Loader className="animate-spin" /> }
            </div>

            <div className="mt-2 bg-background rounded-md">
                <TagInputEmblor 
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

            <p className="text-sm mt-2 text-muted-foreground">Se etiquetará a los contactos de esta campaña con las etiquetas definidas aquí arriba.</p>

        </div>
    );
};
