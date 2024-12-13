"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader, MessageSquare } from "lucide-react";
import { useState } from "react";
import { setWhatsappInboxIdAction } from "./actions";


type ChatwootButtonProps = {
    clientId: string;
    initialWhatsappInboxId: string;
}
export default function InboxButton({ clientId, initialWhatsappInboxId }: ChatwootButtonProps) {
    const [loadingSetWhatsappInboxId, setLoadingSetWhatsappInboxId] = useState(false);
    const [whatsappInboxId, setWhatsappInboxId] = useState(initialWhatsappInboxId);

    function handleSetWhatsappInboxId() {
      if (!whatsappInboxId) {
          toast({ title: "Se necesita un ID de la Inbox de Whatsapp", variant: "destructive" })
          return;
      }
      setLoadingSetWhatsappInboxId(true)
      setWhatsappInboxIdAction(clientId, whatsappInboxId)
      .then((result) => {
        if (result) {
          toast({ title: "ID de la Inbox de Whatsapp seteado" })
        }
      })
      .catch((error) => {
        toast({ title: "Error seteando ID de la Inbox de Whatsapp", description: error.message, variant: "destructive" })
      })
      .finally(() => {
        setLoadingSetWhatsappInboxId(false)
      })
    }
    
    return (
      <div className="flex flex-col gap-4">
        <Input
          type="text"
          placeholder="ID del Inbox de Whatsapp"
          value={whatsappInboxId}
          onChange={(e) => setWhatsappInboxId(e.target.value)}
        />
        <Button onClick={handleSetWhatsappInboxId} className="col-span-2 mt-2">
          { loadingSetWhatsappInboxId ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" /> }
          Setear ID de la Inbox de Whatsapp
        </Button>
      </div>
)
}

