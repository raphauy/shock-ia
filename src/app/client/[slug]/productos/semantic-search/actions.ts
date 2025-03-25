'use server'

import { getClientBySlug } from "@/services/clientService"
import { searchProductsWithEmbeddings } from "@/services/product-services"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

/**
 * Realiza una búsqueda semántica de productos para un cliente.
 * Utiliza un umbral de similitud alto (0.95) para obtener todos los resultados sin filtrar por similitud.
 * El filtrado por umbral se hace en el cliente, para mostrar productos relevantes a color y el resto en escala de grises.
 * 
 * @param slug Slug del cliente
 * @param query Consulta de búsqueda
 * @param limit Límite de resultados total a mostrar
 * @returns Resultados de la búsqueda ordenados por similitud sin filtrar por umbral
 */
export async function searchProducts(
  slug: string,
  query: string,
  limit: number = 10
) {
  try {
    // Validamos los parámetros
    if (!slug || !query) {
      throw new Error("Se requiere slug del cliente y consulta de búsqueda")
    }

    // Obtenemos el cliente
    const client = await getClientBySlug(slug)
    if (!client) {
      throw new Error("Cliente no encontrado")
    }

    // Realizamos la búsqueda sin filtrar por umbral de similitud
    // Pasamos un umbral muy alto (0.95) para incluir prácticamente todos los resultados
    // Esta función ahora optimiza la consulta SQL según el valor del umbral
    const rawProducts = await searchProductsWithEmbeddings(
      client.id,
      query,
      Number(limit),
      0.95 // Umbral muy alto para incluir casi todos los resultados
    )

    // Convertimos los objetos Decimal a string para evitar problemas de serialización
    const products = rawProducts.map(product => ({
      ...product,
      // Convertimos los campos Decimal a string
      price: product.price?.toString() || "0",
      salePrice: product.salePrice?.toString() || null,
      // Aseguramos que similarity sea un número JavaScript
      similarity: typeof product.similarity === 'number' ? product.similarity : Number(product.similarity)
    }))

    return { success: true, products }
  } catch (error: any) {
    console.error("Error en la búsqueda de productos:", error)
    return { 
      success: false, 
      error: error.message || "Error al realizar la búsqueda",
      products: []
    }
  }
} 