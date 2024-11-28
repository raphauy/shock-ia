'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ContactDAO } from "@/services/contact-services"
import { ContactEventDAO } from '@/services/contact-event-services'
import { ContactEventType } from '@prisma/client'
import { getAllTagsAction, getContactEventsAction, getRepoDataCountAction, getStageByContactIdAction, getTagsOfContactAction } from './contact-actions'
import { cn, formatWhatsAppStyle } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import TagSelectorDialog from './tag-selector-dialog'
import { Input } from '@/components/ui/input'
import TagSelector from './tag-selector'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type ContactDetailsSheetProps = {
  contact: ContactDAO | null
  isOpen: boolean
  onClose: () => void
}

export function ContactDetailsSheet({ contact, isOpen, onClose }: ContactDetailsSheetProps) {
  const [events, setEvents] = useState<ContactEventDAO[]>([])
  const [stage, setStage] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>(["pepe"])
  const [tagChangeCount, setTagChangeCount] = useState(0)
  const [contactTags, setContactTags] = useState<string[]>([])
  const [repoDataCount, setRepoDataCount] = useState(0)

  const params= useParams()
  const slug= params.slug as string

  useEffect(() => {
    if (contact) {
      getStageByContactIdAction(contact.id)
      .then(respStage => {
        setStage(respStage)
      })
      getAllTagsAction(contact.clientId)
      .then(respTags => {
        setAllTags(respTags)
      })
      getRepoDataCountAction(contact.id)
      .then(respCount => {
        setRepoDataCount(respCount)
      })
    }
  }, [contact])

  useEffect(() => {
    if (contact) {
      getContactEventsAction(contact.id)
      .then(respEvents => {        
        setEvents(respEvents)
      })
      getTagsOfContactAction(contact.id || '')
      .then(respTags => {
        setContactTags(respTags)
      })
    }
  }, [tagChangeCount, contact])

  if (!contact) return null  

  const createdEvent = events.find(e => e.type === ContactEventType.CREATED)
  const otherEvents = events.filter(e => e.type !== ContactEventType.CREATED)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
        
      <SheetContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] w-full">
        <SheetHeader>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.imageUrl || ''} alt={contact.name} />
                    <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                    <h2 className="text-lg font-semibold">{contact.name}</h2>
                    <p className="text-sm text-muted-foreground">{contact.phone || 'Sin número de teléfono'}</p>
                    </div>
                </div>
                <div className='flex flex-col gap-2'>
                    <Badge variant="stage">{stage}</Badge>
                    <Badge variant="outline">{contact.src}</Badge>
                </div>
            </div>
        </SheetHeader>

        <div className="mt-5">
            <div className='flex justify-between'>
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                  {contactTags.map((tag) => (
                      <Badge key={tag} className="h-5">{tag}</Badge>
                  ))}
                  <TagSelectorDialog contact={contact} initialTags={contactTags} allTags={allTags} tagChangeCount={() => setTagChangeCount(tagChangeCount + 1)} />
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    {formatWhatsAppStyle(contact.updatedAt)}
                </p>
            </div>

            <div className={cn("flex justify-end", repoDataCount === 0 && "hidden")}>
              <Button variant="outline">
                <Link href={`/client/${slug}/crm/registros?contactId=${contact.id}`}>
                  Ver registros ({repoDataCount})
                </Link>
              </Button>
            </div>


            <Separator className="my-4" />
          
            <div className="relative">
                <h3 className="font-semibold mb-4 text-center">Historial</h3>
                <ScrollArea className="h-[calc(100vh-350px)] pr-4 -mr-4">
                    <div className="relative">
                        {/* Vertical line with higher z-index */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" style={{ zIndex: 10 }} />
                        
                        {/* Other events */}
                        <div className="space-y-8 relative">
                        {otherEvents.map((event) => (
                            <div key={event.id} className={`relative flex items-start ${
                            event.type === ContactEventType.MOVED_TO_STAGE ? 'justify-end' : 'justify-start'
                            }`}>
                            {/* Dot with higher z-index */}
                            <div className="absolute left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 mt-2" style={{ zIndex: 20 }} />
                            
                            {/* Content */}
                            <div className={`w-[45%] ${
                                event.type === ContactEventType.MOVED_TO_STAGE ? 'ml-4' : 'mr-4'
                            }`}>
                                <div className="p-3 rounded-lg bg-muted">
                                    {getEventBadgeContent(event) ? (
                                        <div>
                                          
                                            <Badge className="mb-2 h-5">{getEventBadgeContent(event)!.content}</Badge>
                                            <p className="text-sm font-bold mb-2">{getEventBadgeContent(event)!.title}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold mb-2">{getEventDescription(event)}</p>
                                    )}
                                    <div className='flex justify-between'>
                                        {event.by && (
                                            <p className="text-sm text-muted-foreground mt-1">Por: {event.by}</p>
                                        )}
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {formatWhatsAppStyle(event.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>
                        
                        {/* Created event at the bottom with background to hide line */}
                        {createdEvent && (
                        <div className="relative mt-8 flex justify-center bg-background" style={{ zIndex: 30 }}>
                            <div className="absolute left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2" />
                            <div className="w-[45%] mt-6">
                            <div className="p-3 rounded-lg bg-muted text-center">
                                <p className="text-sm font-bold mb-2">{getEventDescription(createdEvent)}</p>
                                <p className="text-sm text-muted-foreground mt-1">{formatWhatsAppStyle(createdEvent.createdAt)}</p>
                            </div>
                            </div>
                        </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function getEventDescription(event: ContactEventDAO): string {
    switch (event.type) {
      case ContactEventType.CREATED:
        return 'Contacto creado'
      case ContactEventType.TAGGED:
        return `Etiqueta añadida: ${event.info}`
      case ContactEventType.UNTAGGED:
        return `Etiqueta removida: ${event.info}`
      case ContactEventType.MOVED_TO_STAGE:
        return `Movido a estado: ${event.info}`
      case ContactEventType.EDITED:
        return 'Contacto editado'
      default:
        return 'Evento desconocido'
    }
  }
  
  function getEventBadgeContent(event: ContactEventDAO): { content: string; title: string; variant: "default" } | null {
    switch (event.type) {
      case ContactEventType.TAGGED:
        return { content: event.info || event.type, title: "Contacto etiquetado", variant: "default" }
      case ContactEventType.UNTAGGED:
        return { content: event.info || event.type, title: "Etiqueta retirada", variant: "default" }
      default:
        return null
    }
  }
  
  