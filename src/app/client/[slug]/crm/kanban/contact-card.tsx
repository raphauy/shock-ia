'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatWhatsAppStyle } from "@/lib/utils";
import { ContactDAO } from "@/services/contact-services";
import { Draggable } from "@hello-pangea/dnd";
import { DisplayContactDialog } from "../contacts/contact-dialogs";
import React from "react";

type Props = {
  contact: ContactDAO
  index: number
}
export default function ContactCard({ contact, index }: Props) {
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
                      <DisplayContactDialog contact={contact} />
                    </div>
                    <div className={cn("mt-3 flex flex-wrap justify-center gap-1", contact.tags.length === 0 && "hidden")}>
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondaryWithBorder">{tag}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-right">{formatWhatsAppStyle(contact.updatedAt ?? "")}</p>
                  </CardContent>
                </Card>
              </div>
            )}
        </Draggable>
      </>
    )
    
}