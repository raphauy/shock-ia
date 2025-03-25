"use client"

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface ItemsPerPageProps {
  options?: number[]
}

export default function ItemsPerPage({ options = [10, 20, 50, 100] }: ItemsPerPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const perPage = searchParams.get('perPage') || '20'
  
  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('perPage', value)
    params.set('page', '1') // Reset to first page when changing items per page
    router.push(`${pathname}?${params.toString()}`)
  }
  
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="per-page" className="text-sm text-muted-foreground whitespace-nowrap">
        Mostrar:
      </label>
      <Select value={perPage} onValueChange={handleChange}>
        <SelectTrigger id="per-page" className="w-[70px]">
          <SelectValue placeholder={perPage} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 