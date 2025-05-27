"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn, formatWhatsAppStyle } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ConversationPreview } from "./actions";

interface ConversationCardProps {
  conversation: ConversationPreview;
  isSelected: boolean;
  slug: string;
}

export function ConversationCard({ conversation, isSelected }: ConversationCardProps) {
  const { contactName, phone, lastUpdateTime, imageUrl } = conversation;
  
  // Estado para almacenar el formato de la fecha
  const [timeAgo, setTimeAgo] = useState<string>("");
  
  // Usar useEffect para formatear la fecha solo en el cliente
  useEffect(() => {
    setTimeAgo(formatWhatsAppStyle(lastUpdateTime));
  }, [lastUpdateTime]);
  
  // Extraer las iniciales del nombre del contacto
  const initials = contactName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <Card 
      className={cn(
        "py-2 px-1.5 border-0 shadow-none cursor-pointer transition-colors",
        isSelected 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-muted"
      )}
    >
      <div className="flex gap-1.5">
        <Avatar className={cn(
          "h-9 w-9",
          isSelected && "border border-primary-foreground/30 bg-primary-foreground/10"
        )}>
          {imageUrl && <AvatarImage src={imageUrl} alt={contactName} />}
          <AvatarFallback className={cn(
            isSelected && "bg-primary text-primary-foreground"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 pr-1">
          {/* Primera línea: Nombre del contacto */}
          <h3 className={cn(
            "font-medium truncate leading-tight", 
            isSelected ? "text-primary-foreground" : "text-foreground"
          )}>
            {contactName}
          </h3>
          
          {/* Segunda línea: Teléfono/email y fecha */}
          <div className="flex items-center mt-0.5 gap-1">
            <span className={cn(
              "text-sm truncate leading-tight flex-1",
              isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
            )}>
              {phone}
            </span>
            <span className={cn(
              "text-xs leading-none whitespace-nowrap flex-shrink-0",
              isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70"
            )}>
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
} 