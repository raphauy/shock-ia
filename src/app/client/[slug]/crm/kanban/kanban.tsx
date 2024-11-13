'use client'

import { toast } from '@/components/ui/use-toast'
import { ContactDAO } from '@/services/contact-services'
import { KanbanStageDAO, KanbanStageDAOWithContacts } from '@/services/stage-services'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { useEffect, useState } from 'react'
import { updateStageContactsAction } from '../contacts/contact-actions'
import { updateKanbanStagesAction } from '../stages/stage-actions'
import { StageDialog } from '../stages/stage-dialogs'
import StageColumn from './stage-column'
import TagSelector from '../contacts/tag-selector'
import { Separator } from '@/components/ui/separator'

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

type Props = {
  clientId: string
  initialStages: KanbanStageDAOWithContacts[]
  allTags: string[]
}

export function KanbanComponent({ clientId, initialStages, allTags }: Props) {
  const [stages, setStages] = useState<KanbanStageDAOWithContacts[]>(initialStages)
  const [filteredTags, setFilteredTags] = useState<string[]>([])

  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])

  function updateKanbanStages(orderedStages: KanbanStageDAO[]) {
    updateKanbanStagesAction(clientId, orderedStages)
    .then(() => {
      toast({title: "Estado actualizado"})
    })
    .catch((error) => {
      console.error(error)
    })
  }

  function updateStageContacts(contacts: ContactDAO[]) {
    updateStageContactsAction(contacts)
    .then(() => {
      toast({title: "Contacto actualizado"})
    })
    .catch((error) => {
      console.error(error)
    })
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result
    if (!destination) return
    // if dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    // User moves a list
    if (type === 'list') {
      const newStages = reorder(stages, source.index, destination.index).map((item, index) => ({ ...item, order: index }))
      setStages(newStages)
      updateKanbanStages(newStages as KanbanStageDAO[])
    }
    // User moves a contact
    if (type === 'contact') {
      let newOrderedData = [...stages]

      // Source and destination lists
      const sourceList = newOrderedData.find(list => list.id === source.droppableId)
      const destinationList = newOrderedData.find(list => list.id === destination.droppableId)
      if (!sourceList || !destinationList) return

      // Check if contacts exist in the source list
      if (!sourceList.contacts) {
        sourceList.contacts = []
      }

      // Check if contacts exist in the destination list
      if (!destinationList.contacts) {
        destinationList.contacts = []
      }

      // Moving the contact in the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedContacts = reorder(sourceList.contacts, source.index, destination.index)
        reorderedContacts.forEach((contact, index) => contact.order = index)
        sourceList.contacts = reorderedContacts
        setStages(newOrderedData)
        updateStageContacts(reorderedContacts)
      }

      // Moving the contact to another list
      if (source.droppableId !== destination.droppableId) {
        // Remove contact from source list
        const [movedContact] = sourceList.contacts.splice(source.index, 1)

        // Assign the new stage to the moved contact
        movedContact.stageId = destination.droppableId

        // Add contact to the destination list
        destinationList.contacts.splice(destination.index, 0, movedContact)

        // Update order of contacts in source and destination lists
        sourceList.contacts.forEach((contact, index) => contact.order = index)

        // Update order of contacts in destination list
        destinationList.contacts.forEach((contact, index) => contact.order = index)

        setStages(newOrderedData)
        updateStageContacts(destinationList.contacts)
      }
    }
  }

  function handleTagsChange(tags: string[]) {
    setFilteredTags(tags)
    return Promise.resolve(true)
  }

  return (
    <div className="space-y-2">
      <TagSelector actualTags={filteredTags} allTags={allTags} onChange={handleTagsChange} placeholder='Filtrar etiquetas...' />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="stages" type='list' direction='horizontal'>
          {(provided) => (
            <ol className="flex gap-x-3 h-full min-h-[600px]" ref={provided.innerRef} {...provided.droppableProps}>
              {stages.map((stage, index) => (
                <StageColumn key={stage.id} stage={stage} index={index} allTags={allTags} filteredTags={filteredTags} />
              ))}
              {provided.placeholder}
              <StageDialog clientId={clientId} />
              <div className='flex-shrink-0 w-1' />
            </ol>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}