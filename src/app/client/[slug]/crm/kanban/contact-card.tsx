'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatWhatsAppStyle } from "@/lib/utils";
import { ContactDAO } from "@/services/contact-services";
import { Draggable } from "@hello-pangea/dnd";
import { Expand } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getRepoDataCountAction } from "../contacts/contact-actions";

type Props = {
  contact: ContactDAO
  index: number
  allTags: string[]
  onContactClick: (contact: ContactDAO) => void
}
export default function ContactCard({ contact, index, allTags, onContactClick }: Props) {

  // const params= useParams()
  // const slug= params.slug as string

  // const [repoDataCount, setRepoDataCount] = useState(0)

  // useEffect(() => {
  //   getRepoDataCountAction(contact.id)
  //   .then((count) => {
  //     setRepoDataCount(count)
  //   })
  // }, [contact.id])

  return (
    <>
        <Draggable draggableId={contact.id} index={index}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={contact.imageUrl ?? ''} alt={contact.name} />
                          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{contact.name}</h3>
                          <p className="text-sm text-gray-500">{contact.name === contact.phone ? "" : contact.phone}</p>
                        </div>
                      </div>
                      {/* <DisplayContactDialog contact={contact} /> */}
                      {/* <ResponsiveModalSide contact={contact} allTags={allTags} /> */}
                      <Button variant="outline" onClick={() => onContactClick(contact)}>
                        <Expand className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between">
                      <div className={cn("mt-3 flex flex-wrap gap-1")}>
                        <Badge variant="outline" className="h-5">{formatWhatsAppStyle(contact.createdAt)}</Badge>
                        {contact.tags.map((tag, index) => (
                          <Badge key={index} className="h-5">{tag}</Badge>
                        ))}
                      </div>
                      {/* <Button variant="ghost" className={cn("p-1", repoDataCount === 0 && "hidden")}>
                        <Link href={`/client/${slug}/crm/registros?contactId=${contact.id}`}>
                          <DatabaseZap />
                        </Link>
                      </Button> */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
        </Draggable>
      </>
    )
    
}