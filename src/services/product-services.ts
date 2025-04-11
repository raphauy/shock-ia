import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { PrismaClient, Prisma, EcommerceProvider } from '@prisma/client';
import OpenAI from 'openai';
import crypto from 'crypto';
import { GoogleProductItem, getProductsGoogleSheetFormat } from './google-sheets-service';

const prisma = new PrismaClient();

/**
 * Formatea el tiempo de ejecución para mostrar minutos cuando es necesario
 * @param seconds Tiempo en segundos
 * @returns Tiempo formateado como "X min Y seg" o "X.XX segundos"
 */
function formatExecutionTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} segundos`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} ${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`;
}

/**
 * Obtiene y procesa productos en formato Google Shopping desde una URL externa
 * @param url URL del feed de productos en formato Google
 * @param max Número máximo de productos a retornar
 * @param skip Número de productos a saltar (útil para muestreo aleatorio)
 * @returns Un objeto con los productos procesados y el conteo total
 */
export async function getProductsGoogleFormat(
  url: string, 
  max?: number,
  skip: number = 0
): Promise<{ products: GoogleProductItem[], totalCount: number }> {
  try {
    // Obtenemos el feed XML desde la URL proporcionada
    const response = await axios.get(url);
    
    // El contenido está en formato XML con namespace Google
    let xmlContent = response.data;
    
    try {
      // Parseamos el XML a un objeto JavaScript
      const result = await parseStringPromise(xmlContent, { 
        explicitArray: false,
        trim: true,
        mergeAttrs: true, // Permite fusionar atributos con elementos
        tagNameProcessors: [(name) => {
          // Elimina el prefijo g: para facilitar el acceso a los datos
          return name.replace(/^g:/, '');
        }]
      });
      
      // Procesamos los resultados según la estructura observada
      let products: GoogleProductItem[] = [];
      
      if (result && result.rss && result.rss.channel && result.rss.channel.item) {
        // Aseguramos que siempre tengamos un array de items
        const items = Array.isArray(result.rss.channel.item) 
          ? result.rss.channel.item 
          : [result.rss.channel.item];
        
        console.log(`Feed contiene ${items.length} productos en total`);
        
        // Aplicamos skip y limit para muestreo
        let itemsToProcess = items;
        
        // Aplicamos skip si es mayor que 0
        if (skip > 0) {
          itemsToProcess = items.slice(Math.min(skip, items.length));
          console.log(`Saltando ${skip} productos, quedan ${itemsToProcess.length} productos disponibles`);
        }
        
        // Si max está definido, limitamos la cantidad de productos
        if (max !== undefined) {
          itemsToProcess = itemsToProcess.slice(0, max);
          console.log(`Limitando a ${max} productos, procesando ${itemsToProcess.length} productos`);
        }
        
        products = itemsToProcess.map((item: any) => {
          // Extraemos los precios
          const price = item.price || "0 UYU";
          const salePriceText = item.sale_price;
          
          // Procesamos el precio y la moneda
          const priceMatch = price.match(/(\d+(?:\.\d+)?)\s+(\w+)/);
          const priceValue = priceMatch ? parseFloat(priceMatch[1]) : 0;
          const priceCurrency = priceMatch ? priceMatch[2] : "UYU";
          
          // Procesamos el precio de oferta si existe
          let salePrice;
          if (salePriceText) {
            const salePriceMatch = salePriceText.match(/(\d+(?:\.\d+)?)\s+(\w+)/);
            if (salePriceMatch) {
              salePrice = {
                value: parseFloat(salePriceMatch[1]),
                currency: salePriceMatch[2]
              };
            }
          }
          
          // Procesamos las imágenes adicionales
          const additionalImages = item.additional_image_link 
            ? Array.isArray(item.additional_image_link) 
              ? item.additional_image_link 
              : [item.additional_image_link]
            : [];
          
          // Procesamos custom_labels si existen
          let customLabels: string[] = [];
          if (item.custom_label_0) {
            // A veces contienen listas separadas por |
            const labels = item.custom_label_0.split('|').filter((l: string) => l.trim().length > 0);
            customLabels = customLabels.concat(labels);
          }
          
          return {
            id: item.id || "",
            itemGroupId: item.item_group_id,
            title: item.title || "",
            description: item.description || "",
            link: item.link || "",
            availability: item.availability || "out of stock",
            price: {
              value: priceValue,
              currency: priceCurrency
            },
            sale_price: salePrice,
            brand: item.brand || "",
            condition: item.condition || "new",
            adult: item.adult,
            productType: item.product_type,
            size: item.size,
            image_link: item.image_link || "",
            additional_image_links: additionalImages.length > 0 ? additionalImages : undefined,
            custom_labels: customLabels.length > 0 ? customLabels : undefined
          };
        });
        
        // Devolvemos tanto los productos procesados como el conteo total
        return {
          products: products,
          totalCount: items.length
        };
      }
      
      return { products: [], totalCount: 0 };
      
    } catch (parseError) {
      console.error('Error al parsear XML:', parseError);
      return { products: [], totalCount: 0 };
    }
  } catch (error) {
    console.error('Error al obtener productos en formato Google:', error);
    return { products: [], totalCount: 0 };
  }
}

/**
 * Genera un hash MD5 del texto de un producto para verificar cambios
 * @param productText El texto generado para el producto
 * @returns Un hash MD5 como string
 */
function generateProductTextHash(productText: string): string {
  return crypto.createHash('md5').update(productText).digest('hex');
}

/**
 * Genera el texto de descripción completa para un producto, utilizado para obtener embeddings
 * @param product Producto para el que generar el texto
 * @returns Texto con la información completa del producto
 */
function generateProductText(product: any): string {
  let text = `Nombre: ${product.title}\n`;
  
  if (product.description) {
    text += `Descripción: ${product.description}\n`;
  }
  
  if (product.brand) {
    text += `Marca: ${product.brand}\n`;
  }
  
  if (product.category) {
    text += `Categoría: ${product.category}\n`;
  }
  
  if (product.size) {
    text += `Talla/Tamaño: ${product.size}\n`;
  }
  
  text += `Precio: ${product.price} ${product.currency}\n`;
  
  if (product.salePrice) {
    text += `Precio de oferta: ${product.salePrice} ${product.currency}\n`;
  }
  
  if (product.tags && product.tags.length > 0) {
    text += `Etiquetas: ${product.tags.join(', ')}\n`;
  }
  
  text += `Disponibilidad: ${product.availability}\n`;
  
  return text;
}

/**
 * Crea o actualiza un feed de ecommerce para un cliente
 * @param clientId ID del cliente
 * @param name Nombre descriptivo del feed
 * @param url URL del feed de productos
 * @param provider Proveedor del ecommerce
 * @param format Formato del feed (google, facebook, etc)
 * @param totalProductsInFeed Total de productos detectados en el feed
 * @returns El feed creado o actualizado
 */
export async function createOrUpdateEcommerceFeed(
  clientId: string,
  name: string,
  url: string,
  provider: EcommerceProvider,
  format: string = "google",
  totalProductsInFeed: number = 0
) {
  // Verificamos si ya existe un feed activo para este cliente
  const existingFeed = await prisma.ecommerceFeed.findFirst({
    where: {
      clientId,
      active: true
    }
  });

  if (existingFeed) {
    // Actualizamos el feed existente
    return prisma.ecommerceFeed.update({
      where: { id: existingFeed.id },
      data: {
        name,
        url, // Actualizamos también la URL
        provider,
        format,
        active: true,
        totalProductsInFeed,
        updatedAt: new Date()
      }
    });
  } else {
    // Creamos un nuevo feed
    return prisma.ecommerceFeed.create({
      data: {
        name,
        url,
        provider,
        format,
        active: true,
        totalProductsInFeed,
        client: {
          connect: { id: clientId }
        }
      }
    });
  }
}

/**
 * Sincroniza los productos de un feed con la base de datos
 * Realiza sincronización completa (creación y actualización)
 * @param feedId ID del feed de ecommerce
 * @param maxProducts Número máximo de productos a sincronizar (0 para todos)
 * @returns Objeto con estadísticas del proceso
 */
export async function syncProductsFromFeed(feedId: string, maxProducts: number = 0): Promise<{
  totalSynced: number,
  newProducts: number,
  updatedProducts: number,
  unchangedProducts: number,
  deletedProducts: number,
  executionTime: number
}> {
  // Iniciamos el cronómetro
  const startTime = Date.now();
  console.log(`Iniciando sincronización completa de productos desde feed ${feedId}...`);

  // Obtenemos la información del feed
  const feed = await prisma.ecommerceFeed.findUnique({
    where: { id: feedId }
  });

  if (!feed || !feed.active) {
    throw new Error(`Feed no encontrado o inactivo: ${feedId}`);
  }

  // Obtenemos los productos del feed según su formato, respetando el límite
  // También obtenemos el conteo total de productos en el feed
  let products: GoogleProductItem[] = [];
  let totalProductsInFeed = 0;
  let allFeedProductIds: string[] = [];

  if (feed.format === "google") {
    // Primero obtenemos todos los IDs del feed sin límite
    const allProductsResult = await getProductsGoogleFormat(feed.url);
    allFeedProductIds = allProductsResult.products.map(p => p.id);
    totalProductsInFeed = allProductsResult.totalCount;
    
    // Luego obtenemos los productos con el límite para procesar
    const result = await getProductsGoogleFormat(feed.url, maxProducts > 0 ? maxProducts : undefined);
    products = result.products;
  } else if (feed.format === "custom" && feed.provider === "GOOGLE_SHEETS") {
    // Para Google Sheets usamos el formato personalizado
    const allProductsResult = await getProductsGoogleSheetFormat(feed.url);
    if (!allProductsResult.validation.isValid) {
      throw new Error(`Feed de Google Sheets inválido: faltan columnas obligatorias ${allProductsResult.validation.missingRequired.join(', ')}`);
    }
    allFeedProductIds = allProductsResult.products.map(p => p.id);
    totalProductsInFeed = allProductsResult.totalCount;
    
    // Luego obtenemos los productos con el límite para procesar
    const result = await getProductsGoogleSheetFormat(feed.url, maxProducts > 0 ? maxProducts : undefined);
    if (!result.validation.isValid) {
      throw new Error(`Feed de Google Sheets inválido: faltan columnas obligatorias ${result.validation.missingRequired.join(', ')}`);
    }
    products = result.products;
  } else {
    throw new Error(`Formato de feed no soportado: ${feed.format}`);
  }

  if (products.length === 0) {
    throw new Error(`No se encontraron productos en el feed: ${feed.url}`);
  }
  
  console.log(`Procesando ${products.length} de ${totalProductsInFeed} productos del feed`);

  // Sincronizamos cada producto con la base de datos
  let syncCount = 0;
  let embedsToUpdateCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let newCount = 0;
  let deletedCount = 0;

  // Obtener todos los productos existentes para este cliente en la base de datos
  const existingProducts = await prisma.product.findMany({
    where: {
      clientId: feed.clientId,
      feedId: feed.id
    },
    select: {
      id: true,
      externalId: true,
      title: true
    }
  });
  console.log(`Encontrados ${existingProducts.length} productos en la base de datos para este feed`);

  // Identificar productos que ya no existen en el feed usando todos los IDs del feed
  const productsToDelete = existingProducts.filter(
    product => !allFeedProductIds.includes(product.externalId)
  );
  console.log(`Se eliminarán ${productsToDelete.length} productos que ya no existen en el feed`);

  // Eliminar productos que ya no existen en el feed
  if (productsToDelete.length > 0) {
    for (const product of productsToDelete) {
      try {
        await prisma.product.delete({
          where: { id: product.id }
        });
        deletedCount++;
        console.log(`Producto eliminado: ${product.externalId} - ${product.title}`);
      } catch (error) {
        console.error(`Error eliminando producto ${product.externalId}:`, error);
      }
    }
  }

  // Ahora procesamos los productos del feed (creación y actualización)
  for (const product of products) {
    try {
      const existingProduct = await prisma.product.findFirst({
        where: {
          clientId: feed.clientId,
          externalId: product.id
        }
      });

      const productData = {
        externalId: product.id,
        groupId: product.itemGroupId,
        title: product.title,
        description: product.description,
        link: product.link,
        availability: product.availability,
        price: new Prisma.Decimal(product.price.value),
        currency: product.price.currency,
        salePrice: product.sale_price ? new Prisma.Decimal(product.sale_price.value) : null,
        brand: product.brand,
        condition: product.condition,
        adult: product.adult === "yes" || product.adult === "true",
        category: product.productType,
        size: product.size,
        imageUrl: product.image_link || "",
        additionalImages: product.additional_image_links || [],
        tags: product.custom_labels || [],
        feed: {
          connect: { id: feed.id }
        },
        client: {
          connect: { id: feed.clientId }
        }
      };

      // Verificar si el contenido relevante para el embedding ha cambiado
      let textHash = null;
      let needsEmbeddingUpdate = false;

      if (existingProduct) {
        // Solo calculamos el hash si es necesario (si el producto ya existe)
        const newProductText = generateProductText({
          ...productData,
          // Aseguramos que usamos el mismo formato para prevenir falsos positivos
          salePrice: productData.salePrice?.toString() || null
        });
        
        textHash = generateProductTextHash(newProductText);
        
        // Verificamos si el hash actual es diferente del almacenado
        if (existingProduct.contentHash !== textHash) {
          needsEmbeddingUpdate = true;
          embedsToUpdateCount++;
          updatedCount++;
          
          // Actualizamos el producto SOLO si ha cambiado
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              ...productData,
              contentHash: textHash,
              embeddingUpdatedAt: null // Necesita actualizar el embedding
            }
          });
          console.log(`Producto actualizado: ${product.id} - ${product.title}`);
        } else {
          // Si no hay cambios, evitamos la actualización en la base de datos
          unchangedCount++;
          console.log(`Producto sin cambios (omitiendo actualización): ${product.id} - ${product.title}`);
        }
      } else {
        // Nuevo producto, calculamos el hash y marcamos para generar embedding
        const newProductText = generateProductText({
          ...productData,
          salePrice: productData.salePrice?.toString() || null
        });
        
        textHash = generateProductTextHash(newProductText);
        needsEmbeddingUpdate = true;
        embedsToUpdateCount++;
        newCount++;
        
        // Creamos un nuevo producto con el hash
        await prisma.product.create({
          data: {
            ...productData,
            contentHash: textHash,
            // embeddingUpdatedAt se deja nulo para indicar que necesita actualizarse
          }
        });
        console.log(`Nuevo producto creado: ${product.id} - ${product.title}`);
      }

      syncCount++;
    } catch (error) {
      console.error(`Error sincronizando producto ${product.id}:`, error);
    }
  }

  // Actualizamos la fecha de última sincronización y el total de productos en el feed
  await prisma.ecommerceFeed.update({
    where: { id: feed.id },
    data: {
      lastSync: new Date(),
      // Solo actualizamos totalProductsInFeed si es un valor válido (mayor que 0)
      ...(totalProductsInFeed > 0 ? { totalProductsInFeed } : {})
    }
  });

  // Calculamos el tiempo transcurrido
  const endTime = Date.now();
  const executionTime = (endTime - startTime) / 1000; // en segundos

  console.log(`Productos sincronizados: ${syncCount}, Embeddings pendientes: ${embedsToUpdateCount}`);
  console.log(`Detalles: ${newCount} nuevos, ${updatedCount} actualizados, ${unchangedCount} sin cambios, ${deletedCount} eliminados`);
  console.log(`Tiempo total de ejecución: ${formatExecutionTime(executionTime)}`);
  
  // Log adicional para diagnóstico
  console.log(`Métricas de la sincronización completa:
  - Productos analizados del feed: ${products.length} de ${totalProductsInFeed} totales
  - Productos nuevos creados: ${newCount}
  - Productos actualizados: ${updatedCount}
  - Productos sin cambios: ${unchangedCount}
  - Productos eliminados: ${deletedCount}
  - Total sincronizados: ${syncCount}
  - Embeddings pendientes: ${embedsToUpdateCount}
  - Tiempo total: ${formatExecutionTime(executionTime)}
  `);
  
  return {
    totalSynced: syncCount,
    newProducts: newCount,
    updatedProducts: updatedCount,
    unchangedProducts: unchangedCount,
    deletedProducts: deletedCount,
    executionTime: executionTime
  };
}

/**
 * Busca productos de un cliente por texto
 * @param clientId ID del cliente
 * @param searchText Texto a buscar en título, descripción, marca o categoría
 * @param limit Límite de resultados (Deprecado: usar page y perPage para paginación)
 * @param page Número de página (inicia en 1)
 * @param perPage Elementos por página
 * @returns Lista de productos que coinciden con la búsqueda
 */
export async function searchClientProducts(
  clientId: string, 
  searchText: string = "", 
  limit: number = 10,
  page: number = 1,
  perPage: number = 20
) {
  console.log("searchClientProducts", clientId, searchText, limit, page, perPage);
  // Si se proporciona limit pero no page/perPage, se mantiene compatibilidad con código antiguo
  const skip = limit !== 10 ? 0 : (page - 1) * perPage;
  const take = limit !== 10 ? limit : perPage;
  
  // Determinar las condiciones de búsqueda
  let whereCondition: any;
  
  if (searchText.trim()) {
    whereCondition = {
      clientId,
      OR: [
        { title: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
        { category: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
        { brand: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
      ]
    };
  } else {
    whereCondition = { clientId };
  }
  
  return prisma.product.findMany({
    where: whereCondition,
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      salePrice: true,
      brand: true,
      category: true,
      availability: true,
      imageUrl: true,
      link: true,
    },
    skip,
    take,
    orderBy: { title: 'asc' }
  });
}

/**
 * Obtiene los productos de un cliente
 * @param clientId ID del cliente
 * @param limit Límite de resultados (Deprecado: usar page y perPage para paginación)
 * @param page Número de página (inicia en 1)
 * @param perPage Elementos por página
 * @returns Lista de productos del cliente
 */
export async function getClientProducts(
  clientId: string, 
  limit: number = 10,
  page: number = 1,
  perPage: number = 20
) {
  // Si se proporciona limit pero no page/perPage, se mantiene compatibilidad con código antiguo
  const skip = limit !== 10 ? 0 : (page - 1) * perPage;
  const take = limit !== 10 ? limit : perPage;
  
  return prisma.product.findMany({
    where: {
      clientId
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      salePrice: true,
      brand: true,
      category: true,
      availability: true,
      imageUrl: true,
      link: true,
      updatedAt: true,
      feed: {
        select: {
          name: true,
          provider: true
        }
      }
    },
    skip,
    take,
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Genera un embedding para un texto usando la API de OpenAI
 * @param text Texto para el que generar el embedding
 * @returns Vector de embedding
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
  });
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Limita a 8000 caracteres (límite de tokens del modelo)
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generando embedding:', error);
    throw error;
  }
}

/**
 * Genera embeddings para productos que aún no los tienen
 * @param clientId ID del cliente
 * @param forceUpdate Si es true, actualiza todos los embeddings, no solo los que faltan
 * @param batchSize Límite de productos a procesar (0 = sin límite)
 * @returns Objeto con el número de embeddings actualizados y tiempo de ejecución
 */
export async function generateProductEmbeddings(
  clientId: string,
  forceUpdate: boolean = false,
  batchSize: number = 0
): Promise<{
  updatedCount: number,
  executionTime: number
}> {
  const startTime = Date.now();
  
  // Obtenemos productos que necesitan generación de embeddings
  // Ahora usamos el embeddingUpdatedAt = null como indicador de que necesita actualización
  const whereClause = forceUpdate
    ? { clientId }
    : {
        clientId,
        embeddingUpdatedAt: null // Si es null, necesita actualización
      };

  // Contador total de productos pendientes
  const totalPending = await prisma.product.count({
    where: whereClause
  });

  // Configurar las opciones de consulta
  const findOptions: any = {
    where: whereClause
  };
  
  // Aplicar límite solo si batchSize es positivo
  if (batchSize > 0) {
    findOptions.take = batchSize;
  }

  // Obtener los productos para actualizar
  const products = await prisma.product.findMany(findOptions);

  console.log(`Generando embeddings para ${products.length} productos de ${totalPending} pendientes...`);
  
  let updatedCount = 0;

  for (const product of products) {
    try {
      // Generamos el texto para el embedding
      const productText = generateProductText(product);
      
      // Generamos el embedding
      const embedding = await generateEmbedding(productText);
      
      // Actualizamos el producto con el embedding y la fecha
      await prisma.$executeRaw`
        UPDATE "Product"
        SET embedding = ${embedding}::vector, "embeddingUpdatedAt" = ${new Date()}
        WHERE id = ${product.id}
      `;
      
      updatedCount++;
      console.log(`Embedding generado para producto ${updatedCount}/${products.length}: ${product.title}`);
    } catch (error) {
      console.error(`Error generando embedding para producto ${product.id}:`, error);
    }
  }

  const endTime = Date.now();
  const executionTime = (endTime - startTime) / 1000; // en segundos

  console.log(`Proceso completado: ${updatedCount} embeddings generados de ${products.length} productos procesados.`);
  console.log(`Tiempo total de ejecución: ${formatExecutionTime(executionTime)}`);
  
  return {
    updatedCount,
    executionTime
  };
}

export type ProductSearchResult = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  salePrice: number;
  brand: string;
  category: string;
  availability: string;
  imageUrl: string;
  link: string;
  similarity: number;
}

/**
 * Realiza una búsqueda semántica de productos
 * @param clientId ID del cliente
 * @param query Consulta de búsqueda en lenguaje natural
 * @param limit Número máximo de resultados
 * @param similarityThreshold Umbral mínimo de similitud (0-1)
 *        - Para filtrar resultados: use un valor como 0.5 (valor predeterminado)
 *        - Para obtener todos los resultados sin filtrar: use un valor muy alto como 0.95
 * @returns Lista de productos ordenados por relevancia
 */
export async function searchProductsWithEmbeddings(
  clientId: string,
  query: string,
  limit: number = 10,
  similarityThreshold: number = 0.5
): Promise<ProductSearchResult[]> {
  try {
    // Primero verificamos si hay productos con embeddings para este cliente
    const productCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Product" 
      WHERE "clientId" = ${clientId} AND embedding IS NOT NULL
    `;
    
    // El resultado es un array con un objeto, extraemos el valor del count
    const countValue = productCountResult as Array<{ count: string | number }>;
    const count = Number(countValue[0]?.count || 0);
    
    if (count === 0) {
      console.log("No hay productos con embeddings para este cliente. Realizando búsqueda textual en su lugar...");
      // Si no hay embeddings,
      return []      
    }
    
    // Generamos el embedding para la consulta
    const queryEmbedding = await generateEmbedding(query);
    
    console.log(`Buscando productos similares a: "${query}" (entre ${count} productos con embeddings)`);
    
    // Verificamos si la extensión pgvector está disponible
    let hasVectorExtension = false;
    try {
      const extensionResult = await prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
      hasVectorExtension = Array.isArray(extensionResult) && extensionResult.length > 0;
      console.log("Extensión pgvector disponible, utilizando búsqueda vectorial");
    } catch (error) {
      console.log("Extensión pgvector no disponible, utilizando búsqueda textual");
    }
    
    if (hasVectorExtension) {
      try {
        // Determinamos si estamos usando un umbral muy alto (modo "sin filtrar")
        const isFilteringDisabled = similarityThreshold > 0.9;
        
        // Definimos límites y filtros según el modo

        
        console.log(`Modo de filtrado: ${isFilteringDisabled ? 'Desactivado' : 'Activado'}, Umbral: ${similarityThreshold}, Límite SQL: ${limit}`);
        
        // Construimos la consulta SQL con o sin filtro de umbral según el modo
        let results;
        
        if (isFilteringDisabled) {
          // Consulta sin filtro de umbral (trae todos los resultados hasta el límite)
          results = await prisma.$queryRaw`
            SELECT 
              p.id,
              p.title,
              p.description,
              p.price,
              p.currency,
              p."salePrice",
              p.brand,
              p.category,
              p.availability,
              p."imageUrl",
              p.link,
              p.embedding <=> ${queryEmbedding}::vector AS similarity
            FROM "Product" p
            WHERE 
              p."clientId" = ${clientId}
              AND p.embedding IS NOT NULL
            ORDER BY similarity ASC
            LIMIT ${limit}
          `;
        } else {
          // Consulta con filtro de umbral aplicado directamente en SQL
          results = await prisma.$queryRaw`
            SELECT 
              p.id,
              p.title,
              p.description,
              p.price,
              p.currency,
              p."salePrice",
              p.brand,
              p.category,
              p.availability,
              p."imageUrl",
              p.link,
              p.embedding <=> ${queryEmbedding}::vector AS similarity
            FROM "Product" p
            WHERE 
              p."clientId" = ${clientId}
              AND p.embedding IS NOT NULL
              AND p.embedding <=> ${queryEmbedding}::vector <= ${similarityThreshold}
            ORDER BY similarity ASC
            LIMIT ${limit}
          `;
        }
        
        const allResults = results as any[];
        
        // Mostramos el rango de similitudes para diagnóstico
        if (allResults.length > 0) {
          const similarities = allResults.map(r => r.similarity);
          const minSim = Math.min(...similarities);
          const maxSim = Math.max(...similarities);
          console.log(`Rango de similitudes: ${minSim.toFixed(4)} a ${maxSim.toFixed(4)}`);
        }
        
        console.log(`Mostrando ${allResults.length} resultados más relevantes`);

        const products: ProductSearchResult[] = allResults.map((r: ProductSearchResult) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          price: r.price,
          currency: r.currency,
          salePrice: r.salePrice,
          brand: r.brand,
          category: r.category,
          availability: r.availability,
          imageUrl: r.imageUrl,
          link: r.link,
          similarity: r.similarity
        }))

        return products;
      } catch (error) {
        console.error("Error en búsqueda vectorial:", error);
        throw error
      }
    } else {
      console.log("No hay extensión pgvector disponible");
      throw new Error("Hubo un error al buscar productos")
    }
  } catch (error) {
    console.error('Error en búsqueda semántica:', error);
    throw error
  }
}


/**
 * Cuenta el total de productos de un cliente
 * @param clientId ID del cliente
 * @returns Número total de productos
 */
export async function getClientProductsCount(clientId: string): Promise<number> {
  return prisma.product.count({
    where: {
      clientId
    }
  });
}

/**
 * Cuenta los productos de un cliente que coinciden con un término de búsqueda
 * @param clientId ID del cliente
 * @param searchText Texto a buscar en título, descripción, marca o categoría
 * @returns Número de productos que coinciden con la búsqueda
 */
export async function countClientProductsBySearch(
  clientId: string, 
  searchText: string = ""
): Promise<number> {
  // Determinar las condiciones de búsqueda
  let whereCondition: any;
  
  if (searchText.trim()) {
    whereCondition = {
      clientId,
      OR: [
        { title: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
        { category: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
        { brand: { contains: searchText, mode: 'insensitive' as Prisma.QueryMode } },
      ]
    };
  } else {
    whereCondition = { clientId };
  }
  
  return prisma.product.count({
    where: whereCondition
  });
}

/**
 * Cuenta los productos de un cliente que tienen embeddings generados
 * @param clientId ID del cliente
 * @returns Número de productos que tienen embeddings
 */
export async function getClientProductsWithEmbeddingsCount(clientId: string): Promise<number> {
  return prisma.product.count({
    where: { 
      clientId,
      embeddingUpdatedAt: { not: null }
    }
  });
}

/**
 * Sincroniza solo los productos nuevos (no existentes) desde un feed
 * Optimizado para entornos serverless con límites de tiempo de ejecución
 * @param feedId ID del feed de ecommerce
 * @param maxProducts Número máximo de productos nuevos a sincronizar (0 para todos los nuevos)
 * @returns Objeto con estadísticas del proceso
 */
export async function syncOnlyNewProducts(
  feedId: string, 
  maxProducts: number = 10
): Promise<{ 
  newProducts: number, 
  totalProcessed: number,
  deletedProducts: number,
  executionTime: number 
}> {
  // Iniciamos el cronómetro
  const startTime = Date.now();
  console.log(`Iniciando sincronización de nuevos productos desde feed ${feedId}...`);

  // Obtenemos la información del feed
  const feed = await prisma.ecommerceFeed.findUnique({
    where: { id: feedId }
  });

  if (!feed || !feed.active) {
    throw new Error(`Feed no encontrado o inactivo: ${feedId}`);
  }

  // Obtenemos los ids de productos existentes para este cliente
  console.log(`Obteniendo IDs de productos existentes para cliente ${feed.clientId}...`);
  const existingProducts = await prisma.product.findMany({
    where: { 
      clientId: feed.clientId,
      feedId: feed.id
    },
    select: { 
      id: true,
      externalId: true,
      title: true
    }
  });
  
  // Creamos un set con los IDs existentes para búsqueda rápida
  const existingIdsSet = new Set(existingProducts.map(p => p.externalId));
  console.log(`${existingIdsSet.size} productos existentes encontrados en la base de datos`);

  // Obtenemos todos los productos del feed de una sola vez
  console.log(`Obteniendo productos del feed: ${feed.url}`);
  
  let allFeedProducts: GoogleProductItem[] = [];
  let totalProductsInFeed = 0;
  let deletedCount = 0;
  
  if (feed.format === "google") {
    // Intentamos obtener todos los productos del feed (sin límite)
    const result = await getProductsGoogleFormat(feed.url);
    allFeedProducts = result.products;
    totalProductsInFeed = result.totalCount;
  } else if (feed.format === "custom" && feed.provider === "GOOGLE_SHEETS") {
    // Para Google Sheets usamos el formato personalizado
    const result = await getProductsGoogleSheetFormat(feed.url);
    if (!result.validation.isValid) {
      throw new Error(`Feed de Google Sheets inválido: faltan columnas obligatorias ${result.validation.missingRequired.join(', ')}`);
    }
    allFeedProducts = result.products;
    totalProductsInFeed = result.totalCount;
  } else {
    throw new Error(`Formato de feed no soportado: ${feed.format}`);
  }
  
  if (allFeedProducts.length === 0) {
    throw new Error(`No se encontraron productos en el feed: ${feed.url}`);
  }
  
  console.log(`Feed contiene ${totalProductsInFeed} productos en total. Se obtuvieron ${allFeedProducts.length} productos.`);
  
  // Obtener todos los IDs de productos en el feed actual
  const feedProductIds = allFeedProducts.map(product => product.id);
  console.log(`Identificados ${feedProductIds.length} productos en el feed actual`);

  // Identificar productos que ya no existen en el feed
  const productsToDelete = existingProducts.filter(
    product => !feedProductIds.includes(product.externalId)
  );
  console.log(`Se eliminarán ${productsToDelete.length} productos que ya no existen en el feed`);

  // Eliminar productos que ya no existen en el feed (hasta un máximo de 100 por ejecución para evitar timeouts)
  const maxDeletions = 100;
  if (productsToDelete.length > 0) {
    const productsToDeleteBatch = productsToDelete.slice(0, maxDeletions);
    for (const product of productsToDeleteBatch) {
      try {
        await prisma.product.delete({
          where: { id: product.id }
        });
        deletedCount++;
        console.log(`Producto eliminado: ${product.externalId} - ${product.title}`);
      } catch (error) {
        console.error(`Error eliminando producto ${product.externalId}:`, error);
      }
    }
  }
  
  // Procesamos los productos localmente
  const productsToCreate: GoogleProductItem[] = [];
  let processedProducts = 0;
  let newProductsFound = 0;
  
  console.log(`Buscando hasta ${maxProducts} productos nuevos...`);
  
  // Recorremos el feed secuencialmente y filtramos productos nuevos
  for (const product of allFeedProducts) {
    processedProducts++;
    
    // Si ya no es un producto existente, lo agregamos
    if (!existingIdsSet.has(product.id)) {
      productsToCreate.push(product);
      newProductsFound++;
      
      // Si ya encontramos suficientes productos nuevos, terminamos
      if (maxProducts > 0 && newProductsFound >= maxProducts) {
        console.log(`Se alcanzó el límite de ${maxProducts} productos nuevos. Deteniendo la búsqueda.`);
        break;
      }
    }
    
    // Log de progreso cada 500 productos
    if (processedProducts % 500 === 0) {
      console.log(`Progreso: ${processedProducts}/${allFeedProducts.length} productos procesados, ${newProductsFound} nuevos encontrados`);
    }
  }
  
  console.log(`Búsqueda completada. Encontrados ${newProductsFound} productos nuevos después de procesar ${processedProducts} de ${allFeedProducts.length} productos`);
  
  // Crear los productos nuevos en la base de datos
  let newCount = 0;
  
  for (const product of productsToCreate) {
    try {
      const productData = {
        externalId: product.id,
        groupId: product.itemGroupId,
        title: product.title,
        description: product.description,
        link: product.link,
        availability: product.availability,
        price: new Prisma.Decimal(product.price.value),
        currency: product.price.currency,
        salePrice: product.sale_price ? new Prisma.Decimal(product.sale_price.value) : null,
        brand: product.brand,
        condition: product.condition,
        adult: product.adult === "yes" || product.adult === "true",
        category: product.productType,
        size: product.size,
        imageUrl: product.image_link || "",
        additionalImages: product.additional_image_links || [],
        tags: product.custom_labels || [],
        feed: {
          connect: { id: feed.id }
        },
        client: {
          connect: { id: feed.clientId }
        }
      };

      // Generamos el texto y hash para el embedding
      const newProductText = generateProductText({
        ...productData,
        salePrice: productData.salePrice?.toString() || null
      });
      
      const textHash = generateProductTextHash(newProductText);
      
      // Creamos el nuevo producto
      await prisma.product.create({
        data: {
          ...productData,
          contentHash: textHash,
          // embeddingUpdatedAt se deja nulo para indicar que necesita actualizarse
        }
      });
      
      newCount++;
      console.log(`Nuevo producto creado (${newCount}/${productsToCreate.length}): ${product.id} - ${product.title}`);
    } catch (error) {
      console.error(`Error creando producto ${product.id}:`, error);
    }
  }

  // Actualizamos la fecha de última sincronización y el conteo total en una sola operación
  await prisma.ecommerceFeed.update({
    where: { id: feed.id },
    data: {
      // Actualizamos lastSync solo si se procesaron productos
      ...(newCount > 0 ? { lastSync: new Date() } : {}),
      // Actualizamos totalProductsInFeed si es un valor válido y distinto
      ...(totalProductsInFeed > 0 && totalProductsInFeed !== feed.totalProductsInFeed ? 
        { totalProductsInFeed } : {})
    }
  });

  // Calculamos el tiempo transcurrido
  const endTime = Date.now();
  const executionTime = (endTime - startTime) / 1000; // en segundos

  console.log(`Sincronización completada. ${newCount} productos nuevos creados.`);
  console.log(`Tiempo total de ejecución: ${formatExecutionTime(executionTime)}`);
  
  // Log adicional para diagnóstico
  console.log(`Métricas de la sincronización:
  - Productos obtenidos del feed: ${allFeedProducts.length}
  - Productos procesados: ${processedProducts}
  - Productos nuevos encontrados: ${newProductsFound}
  - Productos nuevos creados: ${newCount}
  - Productos eliminados: ${deletedCount}
  - Tiempo total: ${formatExecutionTime(executionTime)}
  `);
  
  return {
    newProducts: newCount,
    totalProcessed: processedProducts,
    deletedProducts: deletedCount,
    executionTime
  };
}

export async function getFeedURL(clientId: string) {
  const feed = await prisma.ecommerceFeed.findFirst({
    where: { clientId }
  });
  if (!feed) {
    return null;
  }
  return feed.url;
}
