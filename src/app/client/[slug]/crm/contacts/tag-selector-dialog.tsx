'use client';

import { Button } from '@/components/ui/button';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalDescription, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalTrigger } from '@/components/ui/responsive-modal';
import { ContactDAO } from '@/services/contact-services';
import { Badge, Expand, Loader, PlusCircle } from 'lucide-react';
import TagSelector from './tag-selector';
import { setTagsOfContactAction } from './contact-actions';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

type Props = {
  contact: ContactDAO
  initialTags: string[]
  allTags: string[]
  tagChangeCount: () => void
}
export default function TagSelectorDialog({ contact, initialTags, allTags, tagChangeCount }: Props) {
    const [loading, setLoading] = useState(false)


    async function onTagsChange(tags: string[]) {
        setLoading(true)
        const result = await setTagsOfContactAction(contact.id, tags)
        if (result) {
            toast({title: 'Etiquetas actualizadas' })
            setLoading(false)
            tagChangeCount()
            return true
        } else {
            toast({title: 'Error al actualizar las etiquetas', description: 'Intenta nuevamente'})
            setLoading(false)
            return false
        }
    }
    
    return (
        <ResponsiveModal>
            <ResponsiveModalTrigger asChild>
                <PlusCircle className='cursor-pointer w-5 h-5'/>
            </ResponsiveModalTrigger>
            <ResponsiveModalContent side="top" className='min-h-[40vh] min-w-[60vw]'>
                <div>
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle>{contact.name}</ResponsiveModalTitle>
                    </ResponsiveModalHeader>
                    <div className='mt-10'>
                        <Input type='text' className='opacity-0 h-0' />
                        <div className='flex items-center justify-between gap-2'>
                            <TagSelector actualTags={initialTags} allTags={allTags} onChange={onTagsChange} placeholder='Selecciona las etiquetas...' />
                            <div className='w-10'>
                                {loading && <Loader className="animate-spin" />}
                            </div>
                        </div>
                    </div>
                </div>
            </ResponsiveModalContent>
        </ResponsiveModal>
    );
};

