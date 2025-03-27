import {
  getClienteApellido,
  getClienteDocumento,
  getClienteEmail,
  getClienteNombre,
  getClienteTelefono,
  getEstadoEntrega,
  getMontoTotal,
  getProductos,
  Orden
} from "../ordenes/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrdenCardSimpleProps {
  orden: Orden;
}

// Formatear fecha en formato español
const formatearFecha = (fechaStr: string): string => {
  if (!fechaStr) return "Fecha no disponible";
  
  try {
    const fecha = new Date(fechaStr);
    return format(fecha, "d 'de' MMMM 'de' yyyy, HH:mm 'hs'", { locale: es });
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return fechaStr;
  }
};

// Formatear moneda
const formatearMoneda = (monto?: number, moneda?: string): string => {
  if (monto === undefined || monto === null) return "N/A";
  if (!moneda) moneda = "UYU"; // Usar moneda por defecto si no está definida
  
  try {
    return monto.toLocaleString('es-UY', { 
      style: 'currency', 
      currency: moneda 
    });
  } catch (error) {
    console.error("Error formateando moneda:", error);
    return `${monto} ${moneda}`;
  }
};

// Función auxiliar para garantizar texto seguro
const safeText = (text?: string): string => {
  return text || "-";
};

// Formatear estado de entrega para mostrar correctamente
const formatearEstadoEntrega = (estadoEntrega?: string): string => {
  // Si no hay estado de entrega, devolvemos un valor por defecto
  if (!estadoEntrega) return "Sin estado";
  
  // Mapeamos los estados de entrega a sus versiones legibles
  const estadosLegibles: Record<string, string> = {
    'RECIBIDO': 'Recibido',
    'PREPARANDO': 'Preparando',
    'AGUARDANDO_DESPACHO': 'Aguardando despacho',
    'EN_TRANSITO': 'En tránsito',
    'LISTO_PARA_RETIRAR': 'Listo para retirar',
    'ENTREGADO': 'Entregado'
  };
  
  return estadosLegibles[estadoEntrega] || estadoEntrega.replace(/_/g, ' ');
};

// Formatear precio de producto con manejo de valores undefined
const formatearPrecioProducto = (precio?: number, cantidad: number = 1, moneda?: string): string => {
  if (precio === undefined || precio === null) return "N/A";
  if (!moneda) moneda = "UYU"; // Usar moneda por defecto si no está definida
  
  try {
    return precio.toLocaleString('es-UY', { 
      style: 'currency', 
      currency: moneda 
    });
  } catch (error) {
    console.error("Error formateando precio:", error);
    return `${precio} ${moneda}`;
  }
};

export default function OrdenCardSimple({ orden }: OrdenCardSimpleProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Cabecera de la orden */}
      <div className="bg-muted p-4 flex flex-col md:flex-row justify-between">
        <div>
          <h3 className="font-semibold">Orden ID: {orden.idOrden}</h3>
          <p className="text-sm text-muted-foreground">
            {formatearFecha(orden.fechaCarga || orden.fechaInicio || "")}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 md:mt-0">
          <span className={`px-2 py-1 text-xs rounded-full ${
            orden.estado === 'APROBADA' ? 'bg-green-100 text-green-800 border border-green-200' : 
            orden.estado === 'CANCELADA' ? 'bg-red-100 text-red-800 border border-red-200' :
            orden.estado === 'PAGO_PENDIENTE' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
            orden.estado === 'REQUIERE_APROBACION' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
            orden.estado === 'EN_CURSO' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {orden.estado}
          </span>
          
          <span className={`px-2 py-1 text-xs rounded-full ${
            getEstadoEntrega(orden) === 'ENTREGADO' ? 'bg-green-100 text-green-800 border border-green-200' : 
            getEstadoEntrega(orden) === 'LISTO_PARA_RETIRAR' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
            getEstadoEntrega(orden) === 'EN_TRANSITO' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            getEstadoEntrega(orden) === 'AGUARDANDO_DESPACHO' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            getEstadoEntrega(orden) === 'PREPARANDO' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
            getEstadoEntrega(orden) === 'RECIBIDO' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
            'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
            {formatearEstadoEntrega(getEstadoEntrega(orden))}
          </span>
          
          <span className="font-semibold">
            {formatearMoneda(getMontoTotal(orden), orden.moneda)}
          </span>
        </div>
      </div>
      
      {/* Datos del cliente */}
      <div className="p-4 border-b">
        <h4 className="font-medium mb-2">Cliente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Nombre:</span> {safeText(getClienteNombre(orden))} {safeText(getClienteApellido(orden))}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span> {safeText(getClienteEmail(orden))}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Teléfono:</span> {safeText(getClienteTelefono(orden))}
          </p>
        </div>
      </div>
      
      {/* Productos (sin atributos) */}
      <div className="p-4">
        <h4 className="font-medium mb-2">Productos ({getProductos(orden).length || 0})</h4>
        <div className="space-y-2">
          {getProductos(orden).map((producto, idx) => (
            <div key={`${orden.idOrden}-${producto.id || idx}`} className="flex justify-between items-start border-b pb-2 last:border-b-0">
              <div>
                <p className="font-medium">{producto.nombre}</p>
                {/* Atributos eliminados intencionalmente */}
              </div>
              <div className="text-right">
                <p className="text-sm">{producto.cantidad} x {formatearPrecioProducto(producto.precio, 1, orden.moneda)}</p>
                <p className="font-medium">
                  {formatearPrecioProducto(producto.precio ? producto.precio * (producto.cantidad || 1) : undefined, 1, orden.moneda)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <p className="text-lg font-bold">
            Total: {formatearMoneda(getMontoTotal(orden), orden.moneda)}
          </p>
        </div>
      </div>
    </div>
  );
} 