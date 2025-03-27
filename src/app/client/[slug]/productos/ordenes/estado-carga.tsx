import { LockIcon, Package, PackageX, ShieldAlert } from "lucide-react";

interface EstadoCargaProps {
  cargando: boolean;
  ordenesVacias: boolean;
  error?: string;
}

export default function EstadoCarga({ cargando, ordenesVacias, error }: EstadoCargaProps) {
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
          <div className="h-3 w-36 bg-muted rounded"></div>
        </div>
        <p className="mt-6 text-muted-foreground">Cargando órdenes...</p>
      </div>
    );
  }

  if (error) {
    const isAccessDenied = error.includes("Acceso denegado");

    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className={`${isAccessDenied ? 'bg-orange-100 dark:bg-orange-950/30' : 'bg-destructive/10'} p-3 rounded-full`}>
          {isAccessDenied ? (
            <ShieldAlert className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          ) : (
            <PackageX className="h-8 w-8 text-destructive" />
          )}
        </div>
        <h3 className="mt-4 text-lg font-medium">
          {isAccessDenied ? 'Acceso restringido' : 'Error al cargar órdenes'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md text-center">
          {error}
        </p>
        {isAccessDenied && (
          <div className="mt-4 text-xs text-muted-foreground max-w-sm text-center">
            Es posible que necesites solicitar permisos adicionales para ver las órdenes de este cliente.
          </div>
        )}
      </div>
    );
  }

  if (ordenesVacias) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className="bg-muted p-3 rounded-full">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No se encontraron órdenes</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Prueba a ajustar los filtros para ver más resultados.
        </p>
      </div>
    );
  }

  return null;
} 