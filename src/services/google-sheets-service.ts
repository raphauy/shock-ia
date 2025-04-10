import axios from 'axios';

// Definición del estándar de columnas para productos
export const COLUMNAS_ESTANDAR_PRODUCTOS = [
  'id',               // Identificador único del producto (obligatorio)
  'title',            // Título/nombre del producto (obligatorio)
  'description',      // Descripción del producto (obligatorio)
  'link',             // URL al producto
  'image_link',       // URL de la imagen principal
  'additional_image_link', // URLs adicionales separadas por |
  'price',            // Precio en formato "100 UYU" (obligatorio)
  'sale_price',       // Precio de oferta en formato "80 UYU"
  'availability',     // Disponibilidad: "in stock", "out of stock", etc.
  'brand',            // Marca del producto
  'category',         // Categoría o tipo de producto
  'condition',        // Condición: "new", "used", "refurbished"
  'size',             // Talla o tamaño si aplica
  'tags'              // Etiquetas separadas por |
];

// Columnas que son obligatorias
export const COLUMNAS_OBLIGATORIAS = ['id', 'title', 'description', 'price'];

// Definición de tipo para los productos (compatible con el formato que usa Fenicio)
export interface GoogleProductItem {
  id: string;
  itemGroupId?: string;
  title: string;
  description: string;
  link: string;
  availability: string;
  price: {
    value: number;
    currency: string;
  };
  sale_price?: {
    value: number;
    currency: string;
  };
  brand: string;
  condition: string;
  adult?: string;
  productType?: string;
  size?: string;
  image_link?: string;
  additional_image_links?: string[];
  custom_labels?: string[];
}

/**
 * Extrae el ID de la hoja de cálculo de una URL de Google Sheets
 * @param url URL de Google Sheets
 * @returns ID de la hoja de cálculo o null si no se pudo extraer
 */
export function extractSheetId(url: string): string | null {
  // Intentar extraer el ID de la URL de Google Sheets
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Convierte una URL de Google Sheets a una URL de exportación CSV
 * @param url URL de Google Sheets
 * @param sheetId ID de la hoja específica (gid). Por defecto es 0 (primera hoja)
 * @returns URL de exportación CSV o null si la URL de entrada no es válida
 */
export function convertToExportUrl(url: string, sheetId: number = 0): string | null {
  const spreadsheetId = extractSheetId(url);
  if (!spreadsheetId) return null;
  
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetId}`;
}

/**
 * Parsea una cadena CSV a un array de arrays
 * @param csvText Texto CSV a parsear
 * @returns Array de arrays con los datos parseados
 */
export function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  // Procesar el CSV carácter por carácter
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = i < csvText.length - 1 ? csvText[i + 1] : '';
    
    // Manejar comillas
    if (char === '"') {
      // Comilla escapada (doble comilla)
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Saltar la siguiente comilla
      } else {
        // Inicio o fin de campo con comillas
        insideQuotes = !insideQuotes;
      }
      continue;
    }
    
    // Manejar comas (separadores de campo)
    if (char === ',' && !insideQuotes) {
      row.push(currentField.trim());
      currentField = '';
      continue;
    }
    
    // Manejar saltos de línea
    if (char === '\n' && !insideQuotes) {
      // Fin de línea, añadir el último campo y la fila completa
      if (currentField.trim() !== '' || row.length > 0) {
        row.push(currentField.trim());
        result.push(row);
        row = [];
        currentField = '';
      }
      continue;
    }
    
    // Manejar retorno de carro seguido de salto de línea (Windows)
    if (char === '\r' && nextChar === '\n' && !insideQuotes) {
      // Ignorar el retorno de carro, el salto de línea se procesará en la siguiente iteración
      continue;
    }
    
    // Cualquier otro carácter se agrega al campo actual
    currentField += char;
  }
  
  // Procesar el último campo y fila si existen
  if (currentField.trim() !== '' || row.length > 0) {
    row.push(currentField.trim());
    result.push(row);
  }
  
  return result.filter(row => row.length > 0);
}

/**
 * Lee una Google Sheet pública y extrae sus datos
 * @param url URL de la Google Sheet
 * @param sheetId ID de la hoja específica (opcional)
 * @returns Objeto con los nombres de las columnas y los datos de las filas
 */
export async function readGoogleSheet(url: string, sheetId?: number): Promise<{
  columns: string[];
  rows: Record<string, string>[];
  rawData: string[][];
} | null> {
  try {
    // Convertir URL a formato de exportación CSV
    const exportUrl = convertToExportUrl(url, sheetId);
    if (!exportUrl) {
      console.error('❌ URL de Google Sheets inválida:', url);
      return null;
    }
    
    console.log('📊 Obteniendo datos de Google Sheet...');
    console.log('🔗 URL de exportación:', exportUrl);
    
    // Obtener los datos CSV
    const response = await axios.get(exportUrl, { 
      responseType: 'text',
      timeout: 10000
    });
    
    // Procesar los datos CSV con nuestra función personalizada
    const records = parseCSV(response.data);
    
    // Verificar que hay datos
    if (!records || records.length === 0) {
      console.warn('⚠️ No se encontraron datos en la hoja de cálculo');
      return null;
    }
    
    // Extraer nombres de columnas (primera fila)
    const columns = records[0];
    
    // Extraer datos de filas (resto de filas)
    const data = records.slice(1);
    
    // Convertir a formato de objetos para facilitar el acceso
    const rows = data.map((row: string[]) => {
      const rowData: Record<string, string> = {};
      columns.forEach((col: string, index: number) => {
        rowData[col] = row[index] || '';
      });
      return rowData;
    });
    
    return { 
      columns, 
      rows,
      rawData: records
    };
  } catch (error: any) {
    console.error('❌ Error al leer la Google Sheet:', error.message);
    return null;
  }
}

/**
 * Valida si las columnas existentes cumplen con el estándar definido
 * @param columns Columnas encontradas en la hoja
 * @returns Objeto con resultado de validación y mensajes
 */
export function validateColumns(columns: string[]): {
  isValid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  unknown: string[];
} {
  // Convertir a minúsculas para comparación no sensible a mayúsculas
  const normalizedColumns = columns.map(col => col.toLowerCase());
  
  // Verificar columnas obligatorias
  const missingRequired = COLUMNAS_OBLIGATORIAS.filter(
    col => !normalizedColumns.includes(col.toLowerCase())
  );
  
  // Verificar columnas opcionales
  const missingOptional = COLUMNAS_ESTANDAR_PRODUCTOS
    .filter(col => !COLUMNAS_OBLIGATORIAS.includes(col))
    .filter(col => !normalizedColumns.includes(col.toLowerCase()));
  
  // Verificar columnas desconocidas (no estándar)
  const standardLower = COLUMNAS_ESTANDAR_PRODUCTOS.map(col => col.toLowerCase());
  const unknown = normalizedColumns.filter(col => !standardLower.includes(col));
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    unknown
  };
}

/**
 * Convierte las filas de la Google Sheet al formato GoogleProductItem
 * @param rows Filas de datos de la Google Sheet
 * @returns Array de productos en formato GoogleProductItem
 */
export function convertToGoogleProductItems(rows: Record<string, string>[]): GoogleProductItem[] {
  return rows.map(row => {
    // Procesamos el precio
    const priceText = row.price || "0";
    const priceMatch = priceText.match(/(\d+(?:\.\d+)?)\s+(\w+)/);
    const priceValue = priceMatch ? parseFloat(priceMatch[1]) : parseFloat(priceText) || 0;
    
    // Solo asignamos moneda si existe explícitamente
    const priceCurrency = priceMatch ? priceMatch[2] : row.currency || "";

    // Procesamos el precio de oferta si existe
    let salePrice = undefined;
    if (row.sale_price) {
      const salePriceMatch = row.sale_price.match(/(\d+(?:\.\d+)?)\s+(\w+)/);
      if (salePriceMatch) {
        salePrice = {
          value: parseFloat(salePriceMatch[1]),
          currency: salePriceMatch[2]
        };
      }
    }

    // Procesamos imágenes adicionales si existen
    const additionalImages = row.additional_image_link 
      ? row.additional_image_link.split('|').filter(url => url.trim().length > 0)
      : undefined;

    // Procesamos etiquetas si existen
    const tags = row.tags
      ? row.tags.split('|').filter(tag => tag.trim().length > 0)
      : undefined;

    return {
      id: row.id || "",
      itemGroupId: row.item_group_id,
      title: row.title || "",
      description: row.description || "",
      link: row.link || "",
      availability: row.availability || "",
      price: {
        value: priceValue,
        currency: priceCurrency
      },
      sale_price: salePrice,
      brand: row.brand || "",
      condition: row.condition || "",
      adult: row.adult,
      productType: row.category,
      size: row.size,
      image_link: row.image_link,
      additional_image_links: additionalImages,
      custom_labels: tags
    };
  });
}

/**
 * Obtiene y procesa productos desde una Google Sheet pública
 * @param url URL de la Google Sheet
 * @param max Número máximo de productos a retornar
 * @returns Un objeto con los productos procesados, el conteo total y detalles de validación
 */
export async function getProductsGoogleSheetFormat(
  url: string,
  max?: number
): Promise<{ 
  products: GoogleProductItem[]; 
  totalCount: number; 
  validation: { 
    isValid: boolean; 
    missingRequired: string[]; 
    missingOptional: string[];
    unknown: string[];
  };
}> {
  try {
    // Leer datos de la Google Sheet
    const sheetData = await readGoogleSheet(url);
    
    if (!sheetData) {
      return { 
        products: [], 
        totalCount: 0, 
        validation: { isValid: false, missingRequired: [], missingOptional: [], unknown: [] }
      };
    }
    
    // Validar columnas
    const validation = validateColumns(sheetData.columns);
    
    // Si no es válido, retornamos vacío con la información de validación
    if (!validation.isValid) {
      return { 
        products: [], 
        totalCount: 0, 
        validation
      };
    }
    
    // Convertir datos a formato GoogleProductItem
    let products = convertToGoogleProductItems(sheetData.rows);
    
    // Aplicar límite si se especifica
    if (max !== undefined && max > 0 && products.length > max) {
      products = products.slice(0, max);
    }
    
    return {
      products,
      totalCount: sheetData.rows.length,
      validation
    };
  } catch (error) {
    console.error('Error al obtener productos de Google Sheets:', error);
    return { 
      products: [], 
      totalCount: 0, 
      validation: { isValid: false, missingRequired: [], missingOptional: [], unknown: [] }
    };
  }
}
