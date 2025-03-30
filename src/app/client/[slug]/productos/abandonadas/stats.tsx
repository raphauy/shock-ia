import { AbandonedOrderStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Clock, CheckCircle, AlertTriangle, Banknote } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string;
    description?: string;
    icon?: React.ReactNode;
    className?: string;
}

function StatsCard({ title, value, description, icon, className }: StatsCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

interface AbandonedOrdersStatsProps {
    orders: Array<{
        id: string;
        status: AbandonedOrderStatus;
        importeTotal: any; // Decimal
    }>;
}

export default function AbandonedOrdersStats({ orders }: AbandonedOrdersStatsProps) {
    const totalOrders = orders.length;
    
    // Contar órdenes por estado
    const pendingOrders = orders.filter(order => order.status === AbandonedOrderStatus.PENDIENTE).length;
    const notifiedOrders = orders.filter(order => order.status === AbandonedOrderStatus.RECORDATORIO_ENVIADO).length;
    
    // Calcular total de importes
    const totalValue = orders.reduce((sum, order) => sum + Number(order.importeTotal), 0);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard 
                title="Total de órdenes" 
                value={totalOrders.toString()}
                description="Órdenes abandonadas en total"
                icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            />
            
            <StatsCard 
                title="Pendientes" 
                value={pendingOrders.toString()}
                description="Órdenes sin recordatorio"
                icon={<Clock className="h-4 w-4 text-yellow-500" />}
                className="border-l-4 border-yellow-500"
            />
            
            <StatsCard 
                title="Recordatorio enviado" 
                value={notifiedOrders.toString()}
                description="Clientes ya contactados"
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                className="border-l-4 border-green-500"
            />
            
            <StatsCard 
                title="Valor total" 
                value={formatCurrency(totalValue)}
                description="Suma del valor de todas las órdenes"
                icon={<Banknote className="h-4 w-4 text-primary" />}
                className="border-l-4 border-primary"
            />
            
        </div>
    );
} 