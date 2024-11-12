"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn, getMonthName } from "@/lib/utils"
import { endOfMonth, format, parse, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function DatesFilter() {
  const params= useParams()
  const slug= params.slug
  const searchParams= useSearchParams()
  const router= useRouter()

  const [last, setLast] = useState(searchParams.get("last"))  
  const [selectedMonthLabel, setSelectedMonthLabel] = useState("")

  const allParams = searchParams.toString()
  // Remove all instances of from, to, and last params along with the leading ampersand if necessary
  let newParams= allParams.replace(/([&]?)(from|to|last)=[^&]+/g, "")
  newParams= newParams.startsWith("&") ? newParams.slice(1) : newParams
  const restOfTheParams= newParams ? `&${newParams}` : ""
    
  useEffect(() => {
    const lastParam= searchParams.get("last")
    setLast(lastParam)
    if (lastParam) {
      setSelectedMonthLabel("")
    }
  }, [searchParams])

  function handleSelection(monthLabel: string) {
    console.log("handleLastChange", monthLabel);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed (enero = 0, diciembre = 11)

    // Parsear el mes utilizando date-fns y la localización en español
    const parsedDate = parse(monthLabel, 'MMMM', new Date(), { locale: es });
    const parsedMonth = parsedDate.getMonth(); // 0-indexed

    // Ajustar el año si el mes seleccionado es posterior al mes actual (lo que implica que es del año anterior)
    const year = parsedMonth > currentMonth ? currentYear - 1 : currentYear;

    // Crear las fechas `from` y `to` para el inicio y final del mes
    const from = format(startOfMonth(new Date(year, parsedMonth)), 'yyyy-MM-dd');
    const to = format(endOfMonth(new Date(year, parsedMonth)), 'yyyy-MM-dd');

    setSelectedMonthLabel(monthLabel);

    router.push(`/client/${slug}/crm?from=${from}&to=${to}${restOfTheParams}`);
  }

  const actualMonth= new Date().getMonth() + ""
  const actualMonthLabel= getMonthName(actualMonth)

  return (
    // <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background w-full mb-2">
    <header className="flex h-16 items-center gap-4 border-b bg-background w-full mb-2">
    <div className="flex items-center gap-4">
        <Link href={`/client/${slug}/crm?last=HOY${restOfTheParams}`}>
          <Button variant={last === "HOY" ? "outline" : "ghost"} >Hoy</Button>
        </Link>
        <Link href={`/client/${slug}/crm?last=7D${restOfTheParams}`}>
          <Button variant={last === "7D" ? "outline" : "ghost"} >7D</Button>
        </Link>
        <Link href={`/client/${slug}/crm?last=30D${restOfTheParams}`}>
          <Button variant={last === "30D" ? "outline" : "ghost"} >30D</Button>
        </Link>
        <Link href={`/client/${slug}/crm?last=ALL${restOfTheParams}`}>
          <Button variant={last === "ALL" ? "outline" : "ghost"} >Todo</Button>
        </Link>
        <Separator orientation="vertical" className="h-4" />
        {/* <Link href={`/client/${slug}/crm?last=LAST_MONTH${restOfTheParams}`}>
          <Button variant={last === "LAST_MONTH" ? "outline" : "ghost"} >{actualMonthLabel}</Button>
        </Link> */}
        <Select onValueChange={handleSelection} value={selectedMonthLabel || ""}>
          <SelectTrigger className={cn(!selectedMonthLabel && "border-none", "focus:ring-0 focus:ring-offset-0")}>
            {selectedMonthLabel ? (
              <SelectValue>{selectedMonthLabel}</SelectValue>
            ) : (
              <span className="text-muted-foreground">Mes</span>
            )}
          </SelectTrigger>
          <SelectContent>
            {getLast12MonthsLabels().map((monthLabel) => (
              <SelectItem key={monthLabel} value={monthLabel}>{monthLabel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="ml-auto flex items-center">
        <p>Filtrar etiquetas aquí (ToDo)</p>
      </div>
    </header>
  )
}

function getLast12MonthsLabels() {
  const months= []
  const now= new Date()
  for (let i= 0; i < 12; i++) {
    const month= new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(month.toLocaleString('es-ES', { month: 'long' }))
  }
  return months
}