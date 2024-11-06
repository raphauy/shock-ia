'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContactDAO } from "@/services/contact-services";
import { Draggable } from "@hello-pangea/dnd";
import { Expand, PencilIcon } from "lucide-react";
import { ContactDialog } from "../contacts/contact-dialogs";
import { cn } from "@/lib/utils";

type Props = {
  contact: ContactDAO
  index: number
}
export default function ContactCard({ contact, index }: Props) {
    return (
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
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="icon" className="size-8">
                          <Expand className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className={cn("mt-3 flex flex-wrap justify-center gap-1", contact.tags.length === 0 && "hidden")}>
                        {contact.tags.map((tag, index) => (
                          <Badge key={index} variant="secondaryWithBorder">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
            )}
        </Draggable>
    )
    
}