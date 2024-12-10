"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

type Props= {
  id: string
  name?: string
}

export function CampaignLink({ id, name }: Props) {
  const params= useParams()
  const slug= params.slug
  return (
    <Link href={`/client/${slug}/crm/campaigns/${id}`}>
      <Button variant={name ? "link" : "ghost"} className={cn(name && "p-0")}>
        {name && name}
        {!name && <Eye />}
    </Button>
    </Link>
  )
}