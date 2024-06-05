import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, CircleDollarSign } from "lucide-react";

type Props = {
    promptPrice: number
    completionPrice: number
    promptCost: number
    completionCost: number
}

export default function ValueClientCard({ promptPrice, completionPrice, promptCost, completionCost }: Props) {
    const totalCost = promptCost + completionCost
  return (
    <Card className={cn("flex flex-col", totalCost === 0 && "opacity-20")}>
        <CardHeader>
            <CardDescription className="flex justify-between">
                <p>Costo Total</p>
                <CircleDollarSign />
            </CardDescription>
            <CardTitle>
                <p>{Intl.NumberFormat("es-UY", { style: "currency", currency: "USD" }).format(totalCost)}</p>
            </CardTitle>
        </CardHeader>
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
                <p className="text-lg text-muted-foreground">{Intl.NumberFormat("es-UY", { style: "currency", currency: "USD" }).format(promptCost)}</p>
                <p className="text-lg text-muted-foreground">{Intl.NumberFormat("es-UY", { style: "currency", currency: "USD" }).format(completionCost)}</p>
            </CardTitle>
            <CardDescription className="flex justify-between">
                <p>Prompt ({Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits:2 }).format(promptPrice)})</p>
                <p>Completion ({Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits:2 }).format(completionPrice)})</p>
            </CardDescription>
        </CardHeader>
    </Card>

  )
}
