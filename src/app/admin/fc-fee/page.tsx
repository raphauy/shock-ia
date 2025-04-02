import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientList from "@/components/ClientList";
import { getClientsByFCImplementation } from "@/services/clientService";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Utilizamos la key para forzar refresco completo
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FCFee() {
  // Verificar acceso del usuario
  const user = await getCurrentUser();
  const email = user?.email?.toLowerCase() || '';
  
  // Solo permitir acceso a usuarios específicos
  if (email !== 'rapha.uy@rapha.uy' && email !== 'joaquin@shock.uy') {
    redirect('/admin'); // Redirigir a los usuarios no autorizados
  }

  const { implementedClients, nonImplementedClients } = await getClientsByFCImplementation();

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de FC Fee</h2>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">Pendientes ({nonImplementedClients.length})</TabsTrigger>
          <TabsTrigger value="implemented">Implementados ({implementedClients.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          <ClientList 
            clients={nonImplementedClients} 
            title="Clientes Pendientes de Implementación FC" 
          />
        </TabsContent>
        
        <TabsContent value="implemented" className="mt-6">
          <ClientList 
            clients={implementedClients} 
            title="Clientes con FC Implementado" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}