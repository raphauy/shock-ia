import { BookOpen, Wrench, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useState } from "react";
import CodeBlock from '../code-block';

type DocumentToolProps = {
  documentId: string;
  documentName: string;
  slug: string;
};

export function DocumentTool({ documentId, documentName, slug }: DocumentToolProps) {

    return (
        <div className="flex items-center w-full gap-2 p-2 border rounded-md border-foreground h-11">
            <Wrench className="size-6"/>
            <Link className="flex px-1" href={`/client/${slug}/documents/${documentId}`} target="_blank">
                <Button variant="link" className="h-6"><p>{documentName}</p></Button>
            </Link>
            <BookOpen className="size-6 ml-auto"/>
        </div>
    )
}

export function DocumentToolSkeleton() {
    return (
        <div className="flex items-center w-full gap-2 p-2 border rounded-md border-foreground">
            <Wrench className="size-6"/>
        </div>
    )
}

type GenericToolProps = {
  toolName: string;
  args: any;
  result?: any;
};

export function GenericTool({ toolName, args, result }: GenericToolProps) {
  const [open, setOpen] = useState(false);

  const argsWithoutConversationId = { ...args, conversationId: undefined };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`flex items-center w-full gap-2 py-2 px-2 border border-foreground bg-background h-12 transition-all ${open ? 'rounded-t-md' : 'rounded-md'}`}> 
        <Wrench className="size-6" />
        <div className="font-semibold text-primary text-sm flex-1">{toolName}</div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-auto">
            {open ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="p-3 border border-t-0 border-foreground rounded-b-md">
          <div className="mb-2">
            <span className="font-medium text-xs text-muted-foreground">Campos:</span>
            <div className="mt-1">
              <CodeBlock code={JSON.stringify(argsWithoutConversationId, null, 2)} showLineNumbers={false} />
            </div>
          </div>
          <div>
            <span className="font-medium text-xs text-muted-foreground">Resultado:</span>
            {typeof result === 'string' || typeof result === 'number' ? (
              <div className="text-sm bg-background rounded p-2 mt-1 whitespace-pre-wrap break-words">
                {String(result)}
              </div>
            ) : result ? (
              <pre className="text-xs bg-background rounded p-2 mt-1 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">Sin resultado</div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}