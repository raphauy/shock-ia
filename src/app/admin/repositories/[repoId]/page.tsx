import FCConfig from "./fc-config"

type Props = {
  params: {
    repoId: string
  }
}

export default async function RepositoryPage({ params }: Props) {
  const repoId = params.repoId
  const fullMode= true

  return (
    <FCConfig repoId={repoId} fullMode={fullMode} haveCRM={false} />
  )
}
