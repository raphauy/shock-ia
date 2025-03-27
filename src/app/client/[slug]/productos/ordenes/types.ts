// Tipos de datos según la documentación oficial de Fenicio
// Referencia: https://developers.fenicio.help/referencia/modelos-de-datos

export type OrdenProducto = {
  id?: string;
  nombre?: string;
  precio?: number;
  cantidad?: number;
  atributos?: Record<string, string>;
}

export type Documento = {
  numero?: string;
  pais?: string;
  tipo?: string;
}

export type ClienteOrden = {
  id?: number;
  codigo?: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  genero?: string;
  documento?: Documento;
  extras?: Record<string, any>;
}

export type Direccion = {
  latitud?: number;
  longitud?: number;
  pais?: string;
  estado?: string;
  localidad?: string;
  calle?: string;
  numeroPuerta?: string;
  numeroApto?: string;
  codigoPostal?: string;
  observaciones?: string;
}

export type OrdenEntrega = {
  tipo?: string;
  estado?: string;
  destinatario?: string;
  direccionEnvio?: Direccion;
  local?: string;
  codigoTracking?: string;
  etiqueta?: string;
}

export type Orden = {
  idOrden: string;          // Identificador principal y único de la orden
  numeroOrden?: string;     // OBSOLETO según documentación, usar idOrden
  estado: string;           // Estado de la orden (EN_CURSO, APROBADA, etc.)
  motivoCancelacion?: string;
  origen?: string;          // Origen de la orden (WEB, CALLCENTER, etc.)
  fechaInicio?: string;     // Fecha de inicio
  fechaAbandono?: string;
  fechaRecuperada?: string;
  fechaFin?: string;        // Fecha de finalización
  fechaCancelada?: string;
  fechaCarga?: string;      // Campo personalizado para compatibilidad
  comprador?: ClienteOrden; // Datos del comprador
  cliente?: ClienteOrden;   // Campo personalizado para compatibilidad
  moneda?: string;          // Código ISO de la moneda (UYU, USD, etc.)
  importeTotal?: number;    // Monto total de la orden
  montoTotal?: number;      // Campo personalizado para compatibilidad
  entrega?: OrdenEntrega;   // Datos de entrega
  estadoEntrega?: string;   // Campo simplificado para compatibilidad
  lineas?: OrdenProducto[]; // Productos en la orden
  productos?: OrdenProducto[]; // Campo personalizado para compatibilidad
  impuestos?: number;
  observaciones?: string;
}

export type OrdenesResponse = {
  error: boolean;
  msj: string;
  totAbs: number;
  ordenes?: Orden[];
}

// Constantes para estados de órdenes
export const ESTADOS_ORDEN = [
  { valor: "TODAS", etiqueta: "Todas" },
  { valor: "EN_CURSO", etiqueta: "En curso" },
  { valor: "ABANDONADA", etiqueta: "Abandonada" },
  { valor: "PAGO_PENDIENTE", etiqueta: "Pago pendiente" },
  { valor: "REQUIERE_APROBACION", etiqueta: "Requiere aprobación" },
  { valor: "APROBADA", etiqueta: "Aprobada" },
  { valor: "CANCELADA", etiqueta: "Cancelada" }
];

// Constantes para estados de entrega
export const ESTADOS_ENTREGA = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "RECIBIDO", etiqueta: "Recibido" },
  { valor: "PREPARANDO", etiqueta: "Preparando" },
  { valor: "AGUARDANDO_DESPACHO", etiqueta: "Aguardando despacho" },
  { valor: "EN_TRANSITO", etiqueta: "En tránsito" },
  { valor: "LISTO_PARA_RETIRAR", etiqueta: "Listo para retirar" },
  { valor: "ENTREGADO", etiqueta: "Entregado" }
];

// Funciones de utilidad para acceder a propiedades de órdenes

/**
 * Obtiene el nombre del cliente de una orden
 */
export const getClienteNombre = (orden: Orden): string => {
  return orden.comprador?.nombre || orden.cliente?.nombre || 'N/A';
};

/**
 * Obtiene el apellido del cliente de una orden
 */
export const getClienteApellido = (orden: Orden): string => {
  return orden.comprador?.apellido || orden.cliente?.apellido || 'N/A';
};

/**
 * Obtiene el email del cliente de una orden
 */
export const getClienteEmail = (orden: Orden): string => {
  return orden.comprador?.email || orden.cliente?.email || 'N/A';
};

/**
 * Obtiene el documento del cliente de una orden
 */
export const getClienteDocumento = (orden: Orden): string => {
  if (orden.comprador?.documento?.numero) {
    return orden.comprador.documento.numero;
  }
  if (orden.cliente?.documento) {
    return String(orden.cliente.documento);
  }
  return 'N/A';
};

/**
 * Obtiene el teléfono del cliente de una orden
 */
export const getClienteTelefono = (orden: Orden): string => {
  return orden.comprador?.telefono || orden.cliente?.telefono || 'N/A';
};

/**
 * Obtiene el estado de entrega de una orden
 */
export const getEstadoEntrega = (orden: Orden): string => {
  return orden.estadoEntrega || orden.entrega?.estado || 'Sin estado';
};

/**
 * Obtiene los productos de una orden
 */
export const getProductos = (orden: Orden): OrdenProducto[] => {
  return (orden.lineas && orden.lineas.length > 0) 
    ? orden.lineas 
    : (orden.productos && orden.productos.length > 0)
      ? orden.productos
      : [];
};

/**
 * Obtiene el monto total de una orden
 */
export const getMontoTotal = (orden: Orden): number | undefined => {
  return orden.importeTotal !== undefined ? orden.importeTotal : orden.montoTotal;
}; 