import { BookOpen, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

type DocumentToolProps = {
  args: {
    documentId: string;
    documentName: string;
  },
  slug: string;
};

export function DocumentTool({ args, slug }: DocumentToolProps) {

    const docId= args.documentId
    const docName= args.documentName
    return (
        <div className="flex items-center w-full gap-2 p-2 border rounded-md border-foreground">
            <Wrench className="size-6"/>
            <Link className="flex px-1" href={`/client/${slug}/documents/${docId}`} target="_blank">
                <Button variant="link" className="h-6"><p>{docName}</p></Button>
            </Link>
            <BookOpen className="size-6 ml-auto"/>
        </div>
    )
}
