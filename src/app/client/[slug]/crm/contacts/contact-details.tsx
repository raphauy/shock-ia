'use client';

import { Button } from '@/components/ui/button';
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalDescription, ResponsiveModalHeader, ResponsiveModalTitle, ResponsiveModalTrigger } from '@/components/ui/responsive-modal';
import { ContactDAO } from '@/services/contact-services';
import { Expand, Loader } from 'lucide-react';
import TagSelector from './tag-selector';
import { setTagsOfContactAction } from './contact-actions';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

type Props = {
  contact: ContactDAO
  allTags: string[]
}
export default function ContactDetails({ contact, allTags }: Props) {
    const [loading, setLoading] = useState(false)


    async function onTagsChange(tags: string[]) {
        setLoading(true)
        const result = await setTagsOfContactAction(contact.id, tags)
        if (result) {
            toast({title: 'Etiquetas actualizadas' })
            setLoading(false)
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
                <Button variant="outline"><Expand className="h-4 w-4" /></Button>
            </ResponsiveModalTrigger>
            <ResponsiveModalContent 
                side="top" 
                className='min-h-[80vh] min-w-[80vw]'
            >
                <div>

                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle>{contact.name}</ResponsiveModalTitle>
                        <ResponsiveModalDescription>Aquí estará el detalle del contacto</ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <div className='mt-10'>
                        <p>Provisorio para poder etiquetar:</p>
                        <Input type='text' className='opacity-0 h-0' />
                        <div className='flex items-center justify-between gap-2'>
                            <TagSelector actualTags={contact.tags} allTags={allTags} onChange={onTagsChange} placeholder='Selecciona las etiquetas...' />
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

