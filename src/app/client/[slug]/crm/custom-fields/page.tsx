import { getClientAndCustomFieldsBySlug } from "@/services/clientService"
import CustomFieldsBox from "./custom-fields-box"
import { CustomFieldDialog } from "./customfield-dialogs"

type Props = {
  params: Promise<{
    slug: string
  }>
}
export default async function CustomFieldsPage(props: Props) {
  const params = await props.params;
  const client= await getClientAndCustomFieldsBySlug(params.slug)
  if (!client) {
    return <div>Cliente no encontrado</div>
  }
  return (
    <div className="flex flex-col items-center justify-center mt-10 w-full space-y-4">
      <div className="flex justify-between w-full max-w-3xl mb-10">
        <p className="text-2xl font-bold">Campos personalizados</p>
        <CustomFieldDialog clientId={client.id} />
      </div>


      <div className="w-full max-w-3xl">
        <CustomFieldsBox clientId={client.id} initialFields={client.customFields} />
      </div>
    </div>
  )
}
