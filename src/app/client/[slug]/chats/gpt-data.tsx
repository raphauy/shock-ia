import CodeBlock from "@/components/code-block"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { DocumentResult } from "@/services/functions"
import { BookOpen, Database, SquareFunction } from "lucide-react"
import Link from "next/link"

interface Props {
    gptData: string
    slug: string
}

export default function GPTData({ gptData, slug }: Props) {

    if (!gptData || gptData === "null") return null

    const gptDataObj= JSON.parse(gptData)
    const functionName= gptDataObj.functionName

    if (functionName === "getDocument" || functionName === "getSection") {
        const docId= gptDataObj.docId
        const docName= gptDataObj.docName
        const label= functionName === "getSection" ? "" : "(S)"
        return (
            <div className="flex items-center w-full gap-2 p-2 border rounded-md border-blue-500">
                <BookOpen size={20} color="blue"/> {label}
                <Link className="flex px-1" href={`/client/${slug}/documents/${docId}`} target="_blank">
                    <Button variant="link" className="h-6"><p>{docName}</p></Button>
                </Link>
            </div>
        )        
    } else {
        const repoFields= gptDataObj.args
        const jsonReplaced = JSON.stringify(repoFields, (key, value) => {
            if (value === true) return "SI"
            if (value === false) return "NO"
            return value;
          }, 2)

          const isLegacyFunction= functionName === "reservarServicio" || functionName === "registrarPedido" || functionName === "reservarSummit" || functionName === "echoRegister" || functionName === "completarFrase" || functionName === "getDateOfNow" || functionName === "notifyHuman"
    
          return (
            <div className={cn("flex items-center w-full gap-2 p-2 border rounded-md", isLegacyFunction ? "border-yellow-500" : "border-red-500")}>
                <div>
                {
                    isLegacyFunction ?
                    <SquareFunction size={20} className="text-yellow-500" />
                    :
                    <Database size={20} className="text-red-500" />
                }
                </div>
                <p className="mr-4 font-bold">{functionName}</p>
                <CodeBlock code={jsonReplaced} showLineNumbers={false} />                
            </div>
        )        
    }

}
