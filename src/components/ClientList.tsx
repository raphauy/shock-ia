import { Client, User } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import FCImplementationToggle from "./FCImplementationToggle";
import ClientFunctionsDialog from "./ClientFunctionsDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Extendemos el tipo Client para incluir las relaciones y propiedades adicionales que necesitamos
interface ClientWithRelations extends Client {
  users?: User[];
  model?: { name?: string } | null;
  fcCount: number;
  repoCount: number;
  lastFunctionDate: Date | null;
}

interface ClientListProps {
  clients: ClientWithRelations[];
  title: string;
}

export default function ClientList({ clients, title }: ClientListProps) {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">{title} ({clients.length})</h3>
        {clients.length === 0 ? (
          <p className="text-muted-foreground">No hay clientes en esta categoría</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>FC #</TableHead>
                <TableHead>Fecha Última FC</TableHead>
                <TableHead>Funciones</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.repoCount}</TableCell>
                  <TableCell>
                    {client.lastFunctionDate 
                      ? format(client.lastFunctionDate, "d MMM yyyy", { locale: es }) 
                      : "No hay funciones"}
                  </TableCell>
                  <TableCell>
                    <ClientFunctionsDialog 
                      clientId={client.id} 
                      clientName={client.name} 
                    />
                  </TableCell>
                  <TableCell>
                    <FCImplementationToggle 
                      client={client} 
                      initialState={client.fcImplemented} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 