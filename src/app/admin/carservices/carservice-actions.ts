"use server"
  
import { revalidatePath } from "next/cache"
import { CarServiceDAO, CarServiceFormValues, createCarService, updateCarService, getFullCarServiceDAO, deleteCarService } from "@/services/carservice-services"


export async function getCarServiceDAOAction(id: string): Promise<CarServiceDAO | null> {
    return getFullCarServiceDAO(id)
}

export async function createOrUpdateCarServiceAction(id: string | null, data: CarServiceFormValues): Promise<CarServiceDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateCarService(id, data)
    } else {
        updated= await createCarService(data)
    }     

    revalidatePath("/admin/carServices")

    return updated as CarServiceDAO
}

export async function deleteCarServiceAction(id: string): Promise<CarServiceDAO | null> {    
    const deleted= await deleteCarService(id)

    revalidatePath("/admin/carServices")

    return deleted as CarServiceDAO
}

