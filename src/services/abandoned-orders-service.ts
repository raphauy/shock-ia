import { Orden } from "@/app/client/[slug]/productos/ordenes/types";
import { prisma } from "@/lib/db";
import { AbandonedOrderStatus } from "@prisma/client";

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