import { Button } from "@/components/ui/button"
import { DocumentResult } from "@/services/functions"
import { BookOpen } from "lucide-react"
import Link from "next/link"

interface Props {
    gptData: string
    slug: string
}

export default function GPTData({ gptData, slug }: Props) {
    const document: DocumentResult= JSON.parse(gptData)

    if (!document) return (<div></div>)

    return (
    <div className="flex items-center w-full gap-2 p-2 m-1 border rounded-md">
        <BookOpen size={18} />
        <Link className="flex px-1" href={`/client/${slug}/documents/${document.docId}`} target="_blank">
            <Button variant="link" className="h-6"><p>{document.docName}</p></Button>
        </Link>
        <p>({document.description})</p>
    </div>
    )
}
