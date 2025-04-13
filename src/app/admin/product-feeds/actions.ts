"use server"

import { updateAllFeeds } from "@/services/products-updater";
import { updateFeedAutomation } from "@/services/product-services";
import { revalidatePath } from "next/cache";

export async function updateFeedAutomationAction(feedId: string, automateSync: boolean) {
  try {
    await updateFeedAutomation(feedId, automateSync);
    
    // Revalidamos la ruta de la página de feeds para que se actualice automáticamente
    revalidatePath('/admin/product-feeds');
    
    return { success: true };
  } catch (error) {
    console.error("Error updating feed automation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function syncProductsAction() {
  try {
    const result = await updateAllFeeds();
    
    // Si no hay feeds procesados y hay errores, podría ser por restricción de horario
    if (result.processedFeeds === 0 && result.errors.length > 0) {
      return {
        success: false,
        error: result.errors[0],
        data: result
      };
    }
    
    revalidatePath("/admin/product-feeds");
    return { 
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Error syncing products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

