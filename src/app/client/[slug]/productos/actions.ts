"use server"

import { syncProductsFromFeed, generateProductEmbeddings, syncOnlyNewProducts } from "@/services/product-services"
import { getCurrentUser } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

/**
 * Acción del servidor para sincronizar productos desde un feed
 * @param feedId ID del feed a sincronizar
 * @param maxProducts Número máximo de productos a sincronizar (0 para todos)
 * @returns Detalles de la sincronización
 */
export async function syncProductsAction(feedId: string, maxProducts: number = 0) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("No autenticado")
    }

    // Verificar que el feed pertenece a un cliente del usuario
    const feed = await prisma.ecommerceFeed.findUnique({
      where: { id: feedId },
      include: { client: { include: { users: true } } }
    })

    if (!feed) {
      throw new Error("Feed no encontrado")
    }

    // Verificar permisos (el usuario debe ser admin o pertenecer al cliente)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const isClientUser = feed.client.users.some(u => u.id === user.id)
    
    if (!isAdmin && !isClientUser) {
      throw new Error("No autorizado para sincronizar este feed")
    }

    // Sincronizar productos
    const result = await syncProductsFromFeed(feedId, maxProducts)

    // Revalidar el path para actualizar la interfaz
    revalidatePath(`/client/${feed.client.slug}/productos`)

    // Devolver el resultado
    return {
      syncCount: result.totalSynced,
      newProducts: result.newProducts,
      updatedProducts: result.updatedProducts, 
      unchangedProducts: result.unchangedProducts,
      deletedProducts: result.deletedProducts,
      executionTime: result.executionTime
    }
  } catch (error) {
    console.error("Error en sincronización de productos:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Acción del servidor para generar embeddings para productos
 * @param clientId ID del cliente
 * @param maxEmbeddings Número máximo de embeddings a generar (0 para todos)
 * @returns Información sobre los embeddings actualizados, incluyendo tiempo de ejecución
 */
export async function generateEmbeddingsAction(clientId: string, maxEmbeddings: number = 10) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("No autenticado")
    }

    // Verificar que el cliente existe y el usuario tiene acceso
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { users: true }
    })

    if (!client) {
      throw new Error("Cliente no encontrado")
    }

    // Verificar permisos (el usuario debe ser admin o pertenecer al cliente)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const isClientUser = client.users.some(u => u.id === user.id)
    
    if (!isAdmin && !isClientUser) {
      throw new Error("No autorizado para generar embeddings para este cliente")
    }

    // Verificar que el cliente tiene habilitada la funcionalidad de productos
    if (!client.haveProducts) {
      throw new Error("El cliente no tiene habilitada la funcionalidad de productos")
    }

    // Generar embeddings para los productos que lo necesitan
    const result = await generateProductEmbeddings(clientId, false, maxEmbeddings)

    // Revalidar el path para actualizar la interfaz
    revalidatePath(`/client/${client.slug}/productos`)

    // Devolver el resultado
    return {
      updatedCount: result.updatedCount,
      executionTime: result.executionTime
    }
  } catch (error) {
    console.error("Error en generación de embeddings:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Acción del servidor para sincronizar SOLO productos NUEVOS desde un feed
 * Optimizada para entornos serverless con límites de tiempo de ejecución
 * @param feedId ID del feed a sincronizar
 * @param maxProducts Número máximo de productos NUEVOS a sincronizar (0 para todos los nuevos)
 * @returns Estadísticas de la sincronización
 */
export async function syncOnlyNewProductsAction(feedId: string, maxProducts: number = 10) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("No autenticado")
    }

    // Verificar que el feed pertenece a un cliente del usuario
    const feed = await prisma.ecommerceFeed.findUnique({
      where: { id: feedId },
      include: { client: { include: { users: true } } }
    })

    if (!feed) {
      throw new Error("Feed no encontrado")
    }

    // Verificar permisos (el usuario debe ser admin o pertenecer al cliente)
    const isAdmin = user.role === "admin" || user.role === "superadmin"
    const isClientUser = feed.client.users.some(u => u.id === user.id)
    
    if (!isAdmin && !isClientUser) {
      throw new Error("No autorizado para sincronizar este feed")
    }

    // Sincronizar solo productos nuevos
    const result = await syncOnlyNewProducts(feedId, maxProducts)

    // Revalidar el path para actualizar la interfaz
    revalidatePath(`/client/${feed.client.slug}/productos`)

    // Devolver el resultado
    return result
  } catch (error) {
    console.error("Error en sincronización rápida de productos:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
} 