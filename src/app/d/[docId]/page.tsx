import { getDocumentDAO } from "@/services/document-services";
import ContentViewer from "./content-viewer";

type Props = {
    params: {
        docId: string
    }
}
export default async function ArticlePreview({ params }: Props) {
    const docId= params.docId

    const doc = await getDocumentDAO(docId)
    if (!doc) {
        return <div>Documento no encontrado</div>
    }

    let content= doc.jsonContent
    if (!content) {
        content= JSON.stringify("")
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-col items-center p-1 md:p-4 xl:p-8">
                <p className="mb-4 text-3xl font-bold">{doc.name}</p>
            </div>
            <div className="w-full">
                <ContentViewer content={content} />
            </div>
        </div>
  )
}