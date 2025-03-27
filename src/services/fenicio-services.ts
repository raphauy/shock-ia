import axios from 'axios';
import { getFeedURL } from './product-services';

export async function getOrderData(clientId: string, orderId: string) {
    try {
        // Obtener la URL del feed para construir la URL base de la API
        const feedURL = await getFeedURL(clientId);
        
        if (!feedURL) {
            console.error("❌ No se pudo obtener la URL del feed para el cliente:", clientId);
            return { error: true, msj: "No se pudo obtener la URL del feed para el cliente" };
        }
        
        // Extraer el dominio de la URL del feed
        const feedDomain = new URL(feedURL).origin;
        
        // Construir el endpoint base de la API
        const apiBaseEndpoint = `${feedDomain}/API_V1`;
        
        // Construir el endpoint específico para obtener una orden
        const ordenEndpoint = `${apiBaseEndpoint}/ordenes/${orderId}`;
        
        // Configurar el proxy HTTP para todos los entornos
        let httpProxyAgent = undefined;
        let httpsProxyAgent = undefined;
        const proxyUrl = process.env.PROXY_URL;
        
        if (proxyUrl && typeof window === 'undefined') { // Solo ejecutar en servidor
            try {
                // Importar los agentes de proxy dinámicamente solo en el servidor
                const { HttpProxyAgent } = await import('http-proxy-agent');
                const { HttpsProxyAgent } = await import('https-proxy-agent');
                
                httpProxyAgent = new HttpProxyAgent(proxyUrl);
                httpsProxyAgent = new HttpsProxyAgent(proxyUrl);
                console.log("🧪 Usando proxy HTTP configurado en variables de entorno");
            } catch (error) {
                console.error("❌ Error al cargar los agentes de proxy:", error);
            }
        } else if (!proxyUrl) {
            console.log("⚠️ No se encontró la URL del proxy en las variables de entorno (PROXY_URL)");
        }
        
        // Realizar la petición para obtener los datos de la orden
        const response = await axios.get(ordenEndpoint, {
            httpAgent: httpProxyAgent,
            httpsAgent: httpsProxyAgent,
            headers: {
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        const data = response.data;
        
        // Verificar si la respuesta indica acceso denegado
        if (data.error && data.msj?.includes("Acceso denegado")) {
            console.error("❌ Acceso denegado al endpoint de orden:", orderId);
            return { 
                error: true, 
                msj: "Acceso denegado: No tienes permisos para acceder a esta orden. Contacta al administrador para solicitar acceso." 
            };
        }
        
        // Limpiar los atributos de cada línea de la orden si existen
        if (data.orden && data.orden.lineas && Array.isArray(data.orden.lineas)) {
            data.orden.lineas = data.orden.lineas.map((linea: any) => {
                // Crear una copia de la línea sin el campo atributos
                const { atributos, ...lineaSinAtributos } = linea;
                return lineaSinAtributos;
            });
            console.log("🧹 Atributos eliminados de las líneas de la orden");
        }
        
        // Mostrar información en consola sobre el resultado
        if (data.error) {
            console.error(`❌ Error al obtener la orden ${orderId}:`, data.msj);
        } else if (data.orden) {
            console.log(`✅ Datos de orden ${orderId} obtenidos correctamente`);
            console.log("📊 Detalles:", {
                estado: data.orden.estado,
                fechaInicio: data.orden.fechaInicio,
                importeTotal: data.orden.importeTotal,
                moneda: data.orden.moneda,
                cantidadLineas: data.orden.lineas?.length || 0
            });
        } else {
            console.log("⚠️ Respuesta recibida sin datos de orden");
        }

        console.log("🔍 Datos de orden obtenidos:", data);
        
        return data;
    } catch (err: any) {
        console.error("❌ Error accediendo al endpoint de orden:", err.message);
        return { 
            error: true, 
            msj: `Error al obtener datos de la orden: ${err.message}${err.response?.status ? ` (Status: ${err.response.status})` : ''}` 
        };
    }
}