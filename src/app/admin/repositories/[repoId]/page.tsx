import FCConfig from "./fc-config"

type Props = {
  params: Promise<{
    repoId: string
  }>
}

export default async function RepositoryPage(props: Props) {
  const params = await props.params;
  const repoId = params.repoId
  const fullMode= true

  return (
    <FCConfig repoId={repoId} fullMode={fullMode} haveCRM={false} />
  )
}
