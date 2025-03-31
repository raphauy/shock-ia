import { Orden } from "@/app/client/[slug]/productos/ordenes/types";
import { prisma } from "@/lib/db";
import { AbandonedOrderStatus, ReminderType } from "@prisma/client";
import { createReminder, ReminderSchema, ReminderFormValues } from "./reminder-services";
import { Client } from "@upstash/qstash";
import { format } from "date-fns";
import { getValue } from "./config-services";
import { getOrCreateContact } from "./contact-services";
import { checkValidPhone } from "@/lib/utils";

// QStash setup
const baseUrl = process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL;
const qstashClient = new Client({ token: process.env.QSTASH_TOKEN! });

export async function createAbandonedOrder(clientId: string, order: Orden) {

    if (!order.idOrden || !order.fechaInicio || !order.fechaAbandono || !order.comprador?.nombre || !order.comprador?.telefono || !order.lineas || !order.importeTotal) {
        throw new Error("Faltan campos requeridos, order: " + JSON.stringify(order));
    }

    if (await externalIdExists(clientId, order.idOrden)) {
        throw new Error("Order already exists, externalId: " + order.idOrden);
    }

    const created= await prisma.abandonedOrder.create({
        data: {
            externalId: order.idOrden,
            status: AbandonedOrderStatus.PENDIENTE,
            fechaInicio: new Date(order.fechaInicio),
            fechaAbandono: new Date(order.fechaAbandono),
            compradorNombre: order.comprador?.nombre + " " + order.comprador?.apellido,
            compradorTelefono: order.comprador?.telefono,
            productos: order.lineas.map((linea) => JSON.stringify(linea)),
            impuestos: order.impuestos,
            importeTotal: order.importeTotal,
            clientId: clientId,
        }
    })

    return created;
}

export async function externalIdExists(clientId: string, externalId: string) {
    const order= await prisma.abandonedOrder.findFirst({
        where: {
            clientId: clientId,
            externalId: externalId,
        }
    })
    return order !== null;
}

export async function setAbandonedOrdersTemplate(clientId: string, templateId: string) {
    const feed= await prisma.ecommerceFeed.findFirst({
        where: {
            clientId: clientId,
        }
    })

    if (!feed) {
        throw new Error("Feed not found, clientId: " + clientId);
    }

    const template= await prisma.reminderDefinition.findFirst({
        where: {
            id: templateId,
        }
    })

    if (!template) {
        throw new Error("Template not found, templateId: " + templateId);
    }    

    await prisma.ecommerceFeed.update({
        where: { id: feed.id },
        data: { abandonedOrdersTemplateId: templateId },
    })

    return feed;
}

/**
 * Obtiene la plantilla actualmente configurada para órdenes abandonadas de un cliente
 * @param clientId ID del cliente
 * @returns ID de la plantilla configurada o null si no hay ninguna
 */
export async function getAbandonedOrdersTemplateId(clientId: string): Promise<string | null> {
    const feed = await prisma.ecommerceFeed.findFirst({
        where: {
            clientId: clientId,
        },
        select: {
            abandonedOrdersTemplateId: true
        }
    });

    if (!feed || !feed.abandonedOrdersTemplateId) {
        return null;
    }

    return feed.abandonedOrdersTemplateId;
}

/**
 * Obtiene el tiempo de expiración configurado para órdenes abandonadas de un cliente
 * @param clientId ID del cliente
 * @returns Tiempo de expiración en horas (valor por defecto: 48)
 */
export async function getAbandonedOrdersExpireTime(clientId: string): Promise<number> {
    const feed = await prisma.ecommerceFeed.findFirst({
        where: {
            clientId: clientId,
        },
        select: {
            abandonedOrderExpireTime: true
        }
    });

    if (!feed || !feed.abandonedOrderExpireTime) {
        return 48; // Valor por defecto si no hay configuración
    }

    return feed.abandonedOrderExpireTime;
}

/**
 * Establece el tiempo de expiración para órdenes abandonadas de un cliente
 * @param clientId ID del cliente
 * @param hours Tiempo de expiración en horas
 */
export async function setAbandonedOrdersExpireTime(clientId: string, hours: number): Promise<void> {
    const feed = await prisma.ecommerceFeed.findFirst({
        where: {
            clientId: clientId,
        }
    });

    if (!feed) {
        throw new Error("Feed not found, clientId: " + clientId);
    }

    await prisma.ecommerceFeed.update({
        where: { id: feed.id },
        data: { abandonedOrderExpireTime: hours },
    });
}

/**
 * Procesa una orden abandonada, verificando si debe ser expirada o 
 * creando un recordatorio para ser enviado
 * @param orderId ID de la orden abandonada
 * @returns La orden actualizada
 */
export async function processAbandonedOrder(orderId: string) {
    // 1. Buscar la orden
    const order = await prisma.abandonedOrder.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        console.error(`❌ Orden abandonada no encontrada. ID: ${orderId}`);
        throw new Error(`Orden abandonada no encontrada: ${orderId}`);
    }

    // 2. Verificar que está en estado PENDIENTE
    if (order.status !== AbandonedOrderStatus.PENDIENTE) {
        console.error(`❌ Orden no está en estado PENDIENTE. Estado actual: ${order.status}, ID: ${orderId}`);
        throw new Error(`No se puede procesar la orden, no está en estado PENDIENTE. Estado actual: ${order.status}`);
    }

    // 3. Obtener la plantilla configurada para el cliente
    const templateId = await getAbandonedOrdersTemplateId(order.clientId);
    if (!templateId) {
        console.error(`❌ No hay plantilla configurada para el cliente: ${order.clientId}`);
        throw new Error(`No hay plantilla configurada para el cliente ${order.clientId}`);
    }

    // 4. Verificar si la orden está expirada
    const now = new Date();
    const abandonmentTime = order.fechaAbandono;
    const hoursElapsed = (now.getTime() - abandonmentTime.getTime()) / (1000 * 60 * 60);
    
    // Obtener el tiempo de expiración configurado para este cliente
    const expireTimeHours = await getAbandonedOrdersExpireTime(order.clientId);

    if (hoursElapsed > expireTimeHours) {
        console.log(`ℹ️ Orden marcada como EXPIRADA. Han pasado ${Math.floor(hoursElapsed)} horas desde el abandono.`);
        // Marcar como expirada y terminar
        const updatedOrder = await prisma.abandonedOrder.update({
            where: { id: order.id },
            data: { status: AbandonedOrderStatus.EXPIRADA }
        });
        // Convertir valores Decimal a números regulares para evitar el error
        // "Only plain objects can be passed to Client Components from Server Components"
        return {
            ...updatedOrder,
            importeTotal: Number(updatedOrder.importeTotal),
            impuestos: updatedOrder.impuestos ? Number(updatedOrder.impuestos) : null,
        };
    }

    // 5. Obtener la plantilla de recordatorio
    const reminderTemplate = await prisma.reminderDefinition.findUnique({
        where: { id: templateId }
    });

    if (!reminderTemplate) {
        console.error(`❌ No se encontró la plantilla de recordatorio. ID: ${templateId}`);
        throw new Error(`No se encontró la plantilla de recordatorio: ${templateId}`);
    }

    // Verificar que la plantilla es para recordatorios futuros
    if (reminderTemplate.past) {
        console.error(`❌ La plantilla configurada es para recordatorios pasados (past=true), pero se requiere una plantilla para recordatorios futuros (past=false). ID: ${templateId}`);
        throw new Error(`La plantilla configurada es para recordatorios pasados. Debe ser una plantilla para recordatorios futuros (past = false)`);
    }

    // Verificar que la plantilla tenga un valor de minutesDelay
    if (!reminderTemplate.minutesDelay) {
        console.error(`❌ La plantilla no tiene configurado el tiempo de retraso (minutesDelay). ID: ${templateId}`);
        throw new Error(`La plantilla no tiene configurado el tiempo de retraso (minutesDelay)`);
    }

    // 6. Preparar el teléfono en formato internacional y buscar o crear el contacto
    let contact;
    try {
        // Limpiar el número de teléfono (eliminar espacios, /, etc. pero mantener el +)
        let cleanPhone = order.compradorTelefono.replace(/[\s\-\(\)]/g, '');
        
        // Asegurar que el teléfono tenga formato internacional con +
        if (!cleanPhone.startsWith('+')) {
            // Si empieza con 0, reemplazar por +598
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '+598' + cleanPhone.substring(1);
            } 
            // Si empieza con 9, agregar +598
            else if (cleanPhone.startsWith('9')) {
                cleanPhone = '+598' + cleanPhone;
            } 
            // Otros casos, simplemente agregar +
            else {
                cleanPhone = '+' + cleanPhone;
            }
        }
        
        // Verificar si el teléfono tiene un formato válido
        if (!checkValidPhone(cleanPhone)) {
            console.error(`❌ El número de teléfono no tiene un formato válido: ${cleanPhone}`);
            throw new Error(`El número de teléfono no tiene un formato válido: ${cleanPhone}`);
        }

        console.log(`🔍 Buscando o creando contacto para teléfono: ${cleanPhone}`);
        contact = await getOrCreateContact(
            order.clientId, 
            cleanPhone,
            order.compradorNombre
        );
        console.log(`✅ Contacto encontrado/creado: ${contact.id} - ${contact.name}`);
    } catch (error: any) {
        // En caso de error, marcar la orden como ERROR
        console.error(`❌ Error al buscar/crear contacto: ${error.message}`);
        await markAbandonedOrderAsError(order.id, `Error al buscar/crear contacto: ${error.message}`);
        throw error;
    }

    // 7. Calcular la fecha del recordatorio (fechaAbandono + minutesDelay)
    const reminderDate = new Date(order.fechaAbandono);
    reminderDate.setMinutes(reminderDate.getMinutes() + reminderTemplate.minutesDelay);
    console.log(`📆 Recordatorio programado para: ${format(reminderDate, "dd/MM/yyyy HH:mm")}`);

    // 8. Crear el recordatorio
    try {
        // Crear el recordatorio con el tipo correcto
        const reminderData: ReminderFormValues = {
            eventTime: order.fechaAbandono,
            contactId: contact.id,
            reminderDefinitionId: reminderTemplate.id,
            eventName: "Orden abandonada",
            type: ReminderType.ABANDONED_ORDER,
            abandonedOrderId: order.id
        };
        
        const reminder = await createReminder(reminderData);
        console.log(`✅ Recordatorio creado con ID: ${reminder.id}`);

        // 9. Actualizar la orden con el estado RECORDATORIO_PROGRAMADO
        const updatedOrder = await prisma.abandonedOrder.update({
            where: { id: order.id },
            data: { 
                status: AbandonedOrderStatus.RECORDATORIO_PROGRAMADO,
                fechaRecordatorio: reminderDate
            }
        });

        console.log(`✅ Orden actualizada a estado RECORDATORIO_PROGRAMADO. ID: ${order.id}`);
        // Convertir valores Decimal a números regulares para evitar el error
        // "Only plain objects can be passed to Client Components from Server Components"
        return {
            ...updatedOrder,
            importeTotal: Number(updatedOrder.importeTotal),
            impuestos: updatedOrder.impuestos ? Number(updatedOrder.impuestos) : null,
        };
    } catch (error: any) {
        // En caso de error, actualizar el estado de la orden
        console.error(`❌ Error al crear recordatorio: ${error.message}`);
        await markAbandonedOrderAsError(order.id, `Error al crear recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene una orden abandonada por su ID
 * @param orderId ID de la orden abandonada
 * @returns La orden abandonada o null si no existe
 */
export async function getAbandonedOrderById(orderId: string) {
    try {
        const order = await prisma.abandonedOrder.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            console.log(`ℹ️ Orden abandonada no encontrada. ID: ${orderId}`);
            return null;
        }

        // Convertir valores Decimal a números regulares para evitar el error
        // "Only plain objects can be passed to Client Components from Server Components"
        return {
            ...order,
            importeTotal: Number(order.importeTotal),
            impuestos: order.impuestos ? Number(order.impuestos) : null,
        };
    } catch (error: any) {
        console.error(`❌ Error al obtener orden abandonada: ${error.message}`);
        throw error;
    }
}

/**
 * Actualiza una orden abandonada a estado EXPIRADA
 * @param orderId ID de la orden abandonada
 * @returns La orden actualizada
 */
export async function markAbandonedOrderAsExpired(orderId: string) {
    try {
        const updatedOrder = await prisma.abandonedOrder.update({
            where: { id: orderId },
            data: { 
                status: AbandonedOrderStatus.EXPIRADA,
            }
        });
        
        // Convertir valores Decimal a números regulares
        return {
            ...updatedOrder,
            importeTotal: Number(updatedOrder.importeTotal),
            impuestos: updatedOrder.impuestos ? Number(updatedOrder.impuestos) : null,
        };
    } catch (error: any) {
        console.error(`❌ Error al marcar orden como expirada: ${error.message}`);
        throw error;
    }
}

/**
 * Actualiza una orden abandonada a estado RECORDATORIO_ENVIADO
 * @param orderId ID de la orden abandonada
 * @returns La orden actualizada
 */
export async function markAbandonedOrderAsReminderSent(orderId: string, conversationId: string) {
    try {
        const updatedOrder = await prisma.abandonedOrder.update({
            where: { id: orderId },
            data: { 
                status: AbandonedOrderStatus.RECORDATORIO_ENVIADO,
                // La fecha updatedAt se actualizará automáticamente
                conversationId: conversationId
            }
        });
        
        // Convertir valores Decimal a números regulares
        return {
            ...updatedOrder,
            importeTotal: Number(updatedOrder.importeTotal),
            impuestos: updatedOrder.impuestos ? Number(updatedOrder.impuestos) : null,
        };
    } catch (error: any) {
        console.error(`❌ Error al marcar orden como recordatorio enviado: ${error.message}`);
        throw error;
    }
}

/**
 * Actualiza una orden abandonada a estado ERROR
 * @param orderId ID de la orden abandonada
 * @param error Mensaje de error opcional
 * @returns La orden actualizada
 */
export async function markAbandonedOrderAsError(orderId: string, error?: string) {
    try {
        const updatedOrder = await prisma.abandonedOrder.update({
            where: { id: orderId },
            data: { 
                status: AbandonedOrderStatus.ERROR,
                error: error || "Error desconocido"
            }
        });
        
        // Convertir valores Decimal a números regulares
        return {
            ...updatedOrder,
            importeTotal: Number(updatedOrder.importeTotal),
            impuestos: updatedOrder.impuestos ? Number(updatedOrder.impuestos) : null,
        };
    } catch (error: any) {
        console.error(`❌ Error al marcar orden como error: ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene todas las órdenes abandonadas de un cliente
 * @param clientId ID del cliente
 * @param page Número de página (opcional, por defecto: 1)
 * @param limit Cantidad de elementos por página (opcional, por defecto: 10)
 * @param filter Texto para filtrar por nombre o teléfono del comprador (opcional)
 * @returns Lista de órdenes abandonadas del cliente con metadatos de paginación
 */
export async function getAbandonedOrdersByClientId(
    clientId: string, 
    page: number = 1, 
    limit: number = 10,
    filter?: string
) {
    try {
        // Preparar condiciones de búsqueda
        const whereCondition: any = { clientId };

        // Agregar filtro si está presente
        if (filter && filter.trim() !== '') {
            whereCondition.OR = [
                { compradorNombre: { contains: filter, mode: 'insensitive' } },
                { compradorTelefono: { contains: filter, mode: 'insensitive' } },
                { externalId: { contains: filter, mode: 'insensitive' } }
            ];
        }
        
        // Calcular el índice de inicio para la paginación
        const skip = (page - 1) * limit;
        
        // Obtener el total de órdenes para la paginación
        const totalCount = await prisma.abandonedOrder.count({
            where: whereCondition
        });
        
        // Obtener las órdenes con paginación
        const orders = await prisma.abandonedOrder.findMany({
            where: whereCondition,
            orderBy: { fechaAbandono: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                externalId: true,
                status: true,
                fechaInicio: true,
                fechaAbandono: true,
                fechaRecordatorio: true,
                compradorNombre: true,
                compradorTelefono: true,
                productos: true,
                importeTotal: true,
                impuestos: true,
                error: true,
                conversationId: true,
                clientId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // Convertir valores Decimal a números regulares
        const formattedOrders = orders.map(order => ({
            ...order,
            importeTotal: Number(order.importeTotal),
            impuestos: order.impuestos ? Number(order.impuestos) : null,
        }));

        // Devolver datos paginados con metadatos
        return {
            data: formattedOrders,
            meta: {
                totalItems: totalCount,
                itemsPerPage: limit,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                filter: filter || null
            }
        };
    } catch (error: any) {
        console.error(`❌ Error al obtener órdenes abandonadas: ${error.message}`);
        throw error;
    }
}