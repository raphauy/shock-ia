"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, EcommerceFeed } from "@/lib/generated/prisma";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedAutomationToggle } from "./feed-automation-toggle";

interface FeedCardProps {
  feed: EcommerceFeed & {
    client: Pick<Client, 'id' | 'name' | 'slug'>;
  };
}

export function FeedCard({ feed }: FeedCardProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    if (feed.lastSync) {
      const distance = formatDistanceToNow(feed.lastSync, {
        addSuffix: true,
        locale: es
      });
      setFormattedDate(distance);
    } else {
      setFormattedDate("Nunca");
    }
  }, [feed.lastSync]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href={`/client/${feed.client.slug}/productos`} 
                    className="text-lg font-semibold"
                    target="_blank"
                >
                    {feed.client.name}
                </Link>
                <Badge variant="outline">{feed.totalProductsInFeed} productos</Badge>
            </div>
            <Badge variant="archived">{feed.provider}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-between items-center">
          
            <div className="text-sm font-medium flex items-center gap-2">
                Sincronizado
                <span className="text-sm text-muted-foreground">
                {formattedDate}
                </span>
            </div>
            
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Sincronizar automáticamente</p>
                <FeedAutomationToggle feedId={feed.id} initialState={feed.automateSync} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
} 