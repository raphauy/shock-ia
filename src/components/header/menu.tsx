
import { getCurrentUser } from "@/lib/auth";
import getClients from "@/services/clientService";
import { getUser } from "@/services/userService";
import { ClientSelector, SelectorData } from "./client-selector";
import MenuAdmin from "./menu-admin";
import MenuCliente from "./menu-cliente";

export default async function Menu() {
    
    const user= await getCurrentUser()

    if (!user) return <div></div>

    const clients= await getClients()
    const selectorData: SelectorData[]= clients.map(client => ({slug: client.slug, name: client.name}))

    if (user.role === "admin") 
        return (
            <div className="flex">
                <div className="flex">
                    <ClientSelector selectors={selectorData} />
                    <MenuAdmin />
                </div>
            </div>
        )

    if (user.role === "cliente") {
        const dbUser= await getUser(user.id)
        const clientName= dbUser?.client?.name
        return (
            <div className="flex items-center">
                <p className="text-2xl font-bold"> / {clientName}</p>
                <MenuCliente />
            </div>
        )
    }

    return (
        <div></div>
    );
}
