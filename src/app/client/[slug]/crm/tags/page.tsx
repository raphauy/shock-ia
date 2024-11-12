import { FunctionClientDAO } from "@/services/function-services";
import TagInputFunctionBox  from "@/app/admin/repositories/[repoId]/tag-input-function";
import { getClientBySlug } from "@/services/clientService";
import { getClientFunctions } from "@/services/function-services";
import { notFound } from "next/navigation";
import TagInputBox from "./tag-input";

type Props = {
  params: {
    slug: string
  }
}
export default async function TagsPage({ params }: Props) {
  const client= await getClientBySlug(params.slug)
  if (!client) notFound()

  const functions= await getClientFunctions(client.id)

  return (
    <div className="flex flex-col gap-y-4">
      <p className="text-2xl mt-4 font-medium">Etiquetas globales</p>
      <TagInputBox clientId={client.id} tags={client.tags} />


      <p className="text-2xl mt-10 font-medium">Etiquetas de funciones</p>
      {
        functions.map((clientFunction) => (
          <div key={clientFunction.functionId} className="p-4 border rounded-md">
            <TagInputFunctionBox functionName={clientFunction.function.name} functionClient={clientFunction} tagsUI={true} />
          </div>
        ))
      }
    </div>
  )
}