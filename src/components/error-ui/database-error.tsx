import { AlertCircle, Database, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DatabaseErrorProps {
  error: Error;
  retryUrl?: string;
}

export function DatabaseError({ error, retryUrl }: DatabaseErrorProps) {
  // Determinar si es un error de conexión a la base de datos
  const isConnectionError = error.message.includes("Can't reach database server") || 
                            error.message.includes("P1001") ||
                            error.name === "PrismaClientInitializationError";
  
  // Extraer la URL de la base de datos del mensaje de error, si existe
  const dbUrlMatch = error.message.match(/running at `([^`]+)`/);
  const dbUrl = dbUrlMatch ? dbUrlMatch[1] : "la base de datos";
  
  // Obtener un título apropiado según el tipo de error
  const getErrorTitle = () => {
    if (isConnectionError) {
      return "No se puede conectar a la base de datos";
    }
    
    if (error.message.includes("was not found")) {
      return "Registro no encontrado";
    }
    
    return "Error de base de datos";
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 max-w-md mx-auto">
      <div className="w-full p-4 mb-6 border border-destructive rounded-md bg-destructive/10 text-destructive">
        <div className="flex items-center mb-3">
          <AlertCircle className="h-5 w-5 mr-2" />
          <h3 className="font-semibold">{getErrorTitle()}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="text-sm">
            {isConnectionError ? (
              <>
                <p className="mb-2">
                  No se pudo establecer conexión con {dbUrl}. 
                </p>
                <p className="font-medium">
                  Por favor, verifica que:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>El servidor de la base de datos esté activo</li>
                  <li>La conexión a internet sea estable</li>
                  <li>Las credenciales de acceso sean correctas</li>
                </ul>
              </>
            ) : (
              <p>
                Ocurrió un error al acceder a la base de datos: {error.message}
              </p>
            )}
          </div>
          
          <div className="bg-card p-3 rounded text-xs overflow-auto max-h-32">
            <pre className="whitespace-pre-wrap break-all">{error.message}</pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-muted-foreground">Ver detalles técnicos</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all text-muted-foreground">{error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-4">
        {retryUrl && (
          <Link href={retryUrl}>
            <Button variant="default" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </Button>
          </Link>
        )}
        
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Database className="h-4 w-4" />
            Ir al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
} 