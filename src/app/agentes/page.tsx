export default function Agentes() {
    return (
      <div className="w-full h-[calc(100vh-50px)]">
        <iframe
            src="https://agentes.rctracker.dev"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Sitio externo"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    )
  }
  