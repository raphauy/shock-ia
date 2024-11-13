"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ContactDAO } from "@/services/contact-services";
import { KanbanStageDAOWithContacts } from "@/services/stage-services";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { CircleCheckIcon, CircleDashedIcon, CircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ContactCard from "./contact-card";
import StageMenu from "./stage-menu";

type Props = {
    stage: KanbanStageDAOWithContacts
    index: number
    filteredTags: string[]
    allTags: string[]
}
export default function StageColumn({ stage, index, allTags, filteredTags }: Props) {
  const [contacts, setContacts] = useState<ContactDAO[]>([])

  useEffect(() => {
    setContacts(stage.contacts)
  }, [stage.contacts])

  useEffect(() => {
    if (filteredTags.length === 0) {
      setContacts(stage.contacts)
      return
    }
    const filteredContacts = stage.contacts.filter((contact) => filteredTags.some((tag) => contact.tags.includes(tag)))
    setContacts(filteredContacts)
  }, [filteredTags, stage.contacts])

  return (
    <div>
      <Draggable draggableId={stage.id} index={index}>
        {(provided) => (
          <li className="shrink-0 h-full w-72 select-none" ref={provided.innerRef} {...provided.draggableProps}>
            <Card className="bg-muted h-full group" {...provided.dragHandleProps}>
              <CardHeader className="pb-2 px-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-1 text-lg font-medium" >{getSatusIcon(stage)} {stage.name} &nbsp; {contacts.length}</CardTitle>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <StageMenu stageId={stage.id} stageName={stage.name} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{stage.description}</p>
              </CardHeader>
              <CardContent className="h-full px-2">
                <Droppable droppableId={stage.id} type="contact">
                  {(provided) => (
                    <ol className="space-y-3 h-full" ref={provided.innerRef} {...provided.droppableProps}>
                      {contacts.map((contact, index) => (
                        <ContactCard key={contact.id} contact={contact} index={index} allTags={allTags} />
                      ))}
                      {provided.placeholder}
                    </ol>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </li>
        )}
      </Draggable>
    </div>
  )
    
}

function getSatusIcon(stage: KanbanStageDAOWithContacts) {
  if (stage.isFinal) return <CircleCheckIcon size={16} className={cn("mb-0.5", stage.color && `text-[${stage.color}]`)} />
  if (stage.isBotEnabled) return <CircleDashedIcon size={16} className={cn("mb-0.5", stage.color && `text-[${stage.color}]`)} />

  return <CircleIcon size={16} className={cn("mb-0.5", stage.color && `text-[${stage.color}]`)} />
}