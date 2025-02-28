import { CustomInfo, getCustomInfoAction } from "@/app/admin/chat/actions"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn, removeSectionTexts } from "@/lib/utils"
import { Bot, Car, CircleDollarSign, Terminal, Ticket, User } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DeleteConversationDialog } from "./(delete-conversation)/delete-dialogs"
import { DataConversation } from "./actions"
import GPTData from "./gpt-data"

interface Props {
  conversation: DataConversation
  promptTokensPrice: number
  completionTokensPrice: number
  isAdmin: boolean
  showSystem: boolean
  setShowSystem: (showSystem: boolean) => void
}
  
export default function ConversationBox({ conversation, promptTokensPrice, completionTokensPrice, isAdmin, showSystem, setShowSystem}: Props) {

  const params= useParams()
  const slug= params.slug as string
  
  const totalPromptTokens= conversation.messages.reduce((acc, message) => acc + message.promptTokens, 0)
  const totalCompletionTokens= conversation.messages.reduce((acc, message) => acc + message.completionTokens, 0)
  const promptTokensValue= totalPromptTokens / 1000 * promptTokensPrice
  const completionTokensValue= totalCompletionTokens / 1000 * completionTokensPrice

  const messages= showSystem && isAdmin ? conversation.messages : conversation.messages.filter(message => message.role !== "system")

  const [customInfo, setCustomInfo] = useState<CustomInfo | null>(null)

  useEffect(() => {
    getCustomInfoAction(conversation.id)
    .then((customInfo) => {
      if (customInfo) {
        setCustomInfo(customInfo)
      }
    })
    .catch((err) => {
      console.log(err)
    })
  }, [conversation.id])
  

  return (
    <main className="flex flex-col items-center justify-between w-full p-3 border-l">
      <div className="flex justify-between w-full pb-2 text-center border-b">
        <div className="place-self-end">
          {customInfo?.summitId &&
            <Link href={`/client/summit/summit?summitId=${customInfo.summitId}`}>
              <Button variant="ghost" className="h-7"><Ticket /></Button>
            </Link>
          }
          {customInfo?.carServiceName &&
            <Link href={`/client/${slug}/car-service?name=${customInfo.carServiceName}`}>
              <Button variant="ghost" className="h-7"><Car /></Button>
            </Link>
          }
        </div>
        <div>
          <p className="text-lg font-bold">{conversation.celular} ({conversation.fecha})</p>
          {
            totalPromptTokens > 0 && isAdmin && (
              <div className="flex items-center justify-center gap-2">
                <p>{Intl.NumberFormat("es-UY").format(totalPromptTokens)} pt</p>
                <p>+</p>
                <p>{Intl.NumberFormat("es-UY").format(totalCompletionTokens)} ct</p>
                <p>=</p>
                <p>{Intl.NumberFormat("es-UY").format(totalPromptTokens + totalCompletionTokens)} tokens</p>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <CircleDollarSign size={18} />
                <p>{Intl.NumberFormat("es-UY").format(promptTokensValue + completionTokensValue)} USD</p>
              </div>                  
            )
          }
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && 
            <>
              <p>Prompt:</p><Switch checked={showSystem} onCheckedChange={setShowSystem} />
              <DeleteConversationDialog id={conversation.id} description={`Seguro que desea eliminar la conversación de ${conversation.celular}`} redirectUri={`${conversation.clienteSlug}`} />
            </>
          }
        </div>          
      </div>  

      <div className="w-full max-w-3xl mt-5 ">
      {
        messages.map((message, i) => (
          <div key={i} className="w-full">
            <div className={cn("flex w-full items-center justify-between px-1 lg:px-4 border-gray-200 py-5",
                message.role === "user" ? "bg-gray-100 dark:bg-gray-800 border-b border-t" : "bg-background",
              )}
            >
              <div className="flex items-center w-full max-w-screen-md px-5 space-x-4 sm:px-0">
                {
                  // @ts-ignore
                  !message.gptData &&
                  <div className="flex flex-col">
                    <div
                        className={cn(
                        "p-1.5 text-white flex justify-center",
                        (message.role === "assistant") ? "bg-green-500" : (message.role === "system" || message.role === "function") ? "bg-blue-500" : "bg-black",
                      )}
                    >
                        {message.role === "user" ? (
                        <User width={20} />
                        ) : message.role === "system" || message.role === "function" ? (
                          <Terminal width={20} />
                        ) : (
                        <Bot width={20} />
                        )
                        }
                    </div>
                    <p className="text-sm">{message.fecha}</p>
                  </div>
                }
                {message.role === "system" ?
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="Prompt">
                    <AccordionTrigger>Prompt</AccordionTrigger>
                    <AccordionContent>
                      <div className="whitespace-pre-line">
                        {removeSectionTexts(message.content)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion> :
                  <div className="w-full">
                    {
                      message.role != "system" && message.role != "function" &&
                      (() => {
                        // Si el contenido contiene backticks, mostrar como texto plano
                        if (message.content.includes('`')) {
                          return <div className="whitespace-pre-wrap">{message.content}</div>;
                        }
                        
                        // De lo contrario, intentar renderizar como Markdown
                        try {
                          return (
                            <ReactMarkdown                        
                              className="prose break-words prose-p:leading-relaxed dark:prose-invert"
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // open links in new tab
                                a: (props) => (
                                  <a {...props} target="_blank" rel="noopener noreferrer" />
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          );
                        } catch (error) {
                          console.error("Error rendering markdown:", error);
                          return <div className="whitespace-pre-wrap">{message.content}</div>;
                        }
                      })()
                    }
                  </div>
              }
              </div>
              {
                message.promptTokens > 0 && isAdmin ? (
                  <div className="grid p-2 text-right border rounded-md">
                    <p className="whitespace-nowrap">{Intl.NumberFormat("es-UY").format(message.promptTokens)} pt</p>
                    <p>{Intl.NumberFormat("es-UY").format(message.completionTokens)} ct</p>
                  </div>
                ) : 
                <div></div>
              }
            </div>
            {
              message.gptData && isAdmin && (
                <GPTData gptData={message.gptData} slug={conversation.clienteSlug} />
              )
            }
          </div>
        ))
      }
      </div>

    </main>
  );
}


