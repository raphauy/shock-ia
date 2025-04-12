import { getClientBySlug } from "@/services/clientService"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getClientProducts } from "@/services/product-services"
import { PrismaClient } from "@/lib/generated/prisma"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, RotateCw, Package, Clock, Tag, ExternalLink, Search, List, ShoppingCart } from "lucide-react"
import DashboardActions from "./dashboard-actions"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import Link from "next/link"

// Configuración para extender el tiempo máximo de ejecución
export const maxDuration = 800; // 800 segundos (máximo para plan Pro con Fluid Compute)

type Props = {
    params: {
      slug: string
    } 
}

export default async function ClientProducts({ params }: Props) {
    const { slug } = params

    const client = await getClientBySlug(slug)
    if (!client) {
        notFound()
    }
    if (!client.haveProducts) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Productos no activados</CardTitle>
                        <CardDescription className="text-center">
                            El módulo de productos no está habilitado para este cliente
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Obtener información del feed
    const prisma = new PrismaClient()
    const feed = await prisma.ecommerceFeed.findFirst({
        where: {
            clientId: client.id,
            active: true
        }
    })

    // Obtener estadísticas de productos
    const productCount = await prisma.product.count({
        where: { clientId: client.id }
    })

    const productsWithEmbeddings = await prisma.product.count({
        where: { 
            clientId: client.id,
            embeddingUpdatedAt: { not: null }
        }
    })

    const lastSyncFormatted = feed?.lastSync ? 
        formatDistanceToNow(new Date(feed.lastSync), { 
            addSuffix: true, 
            locale: es 
        }) : 'Nunca'

    // Obtener algunos productos para mostrar
    const rawRecentProducts = await getClientProducts(client.id, 5)
    
    // Convertir los campos Decimal a string para evitar problemas de serialización
    const recentProducts = rawRecentProducts.map(product => ({
        ...product,
        price: product.price?.toString() || "0",
        salePrice: product.salePrice?.toString() || null
    }))
    
    await prisma.$disconnect()

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard de Productos</h1>
                    <p className="text-muted-foreground">
                        Gestiona y monitoriza los productos de tu catálogo
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/client/${slug}/productos/text-search`}>
                        <Button variant="outline">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Todos los productos
                        </Button>
                    </Link>
                    <Link href={`/client/${slug}/productos/semantic-search`}>
                        <Button variant="outline">
                            <Search className="mr-2 h-4 w-4" />
                            Búsqueda Semántica
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {feed?.totalProductsInFeed ? (
                                <>
                                    {Math.round((productCount / feed.totalProductsInFeed) * 100)}% del feed 
                                    <span className="text-xs">({feed.totalProductsInFeed} disponibles)</span>
                                </>
                            ) : (
                                "Productos en tu catálogo"
                            )}
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Con Embeddings</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productsWithEmbeddings}</div>
                        <p className="text-xs text-muted-foreground">
                            {Math.round((productsWithEmbeddings / (productCount || 1)) * 100)}% del total
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Última Sincronización</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lastSyncFormatted}</div>
                        <p className="text-xs text-muted-foreground">
                            Desde: {feed?.url ? new URL(feed.url).hostname : 'No configurado'}
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proveedor</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{feed?.provider || 'No configurado'}</div>
                        <p className="text-xs text-muted-foreground">
                            Formato: {feed?.format || 'N/A'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Vista General</TabsTrigger>
                    <TabsTrigger value="actions">Acciones</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                <Card>
                        <CardHeader>
                            <CardTitle>Información del Feed</CardTitle>
                            <CardDescription>
                                Detalles del origen de datos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {feed ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Nombre</p>
                                            <p className="text-sm text-muted-foreground">{feed.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Proveedor</p>
                                            <p className="text-sm text-muted-foreground">{feed.provider}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium">URL</p>
                                        <p className="text-sm text-muted-foreground break-all">{feed.url}</p>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Estado</p>
                                            <p className="text-sm text-muted-foreground">{feed.active ? 'Activo' : 'Inactivo'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Formato</p>
                                            <p className="text-sm text-muted-foreground">{feed.format}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium">Productos en Feed vs Base de Datos</p>
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <p className="text-xs font-medium">En Feed:</p>
                                                <p className="text-sm">{feed.totalProductsInFeed || "Desconocido"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium">En Base de Datos:</p>
                                                <p className="text-sm">{productCount}</p>
                                            </div>
                                        </div>
                                        {feed.totalProductsInFeed > 0 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div 
                                                        className="bg-primary h-2.5 rounded-full" 
                                                        style={{ 
                                                            width: `${Math.min(Math.round((productCount / feed.totalProductsInFeed) * 100), 100)}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                                    {Math.round((productCount / feed.totalProductsInFeed) * 100)}% sincronizado
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No hay feed configurado</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos Recientes</CardTitle>
                            <CardDescription>
                                Últimos {recentProducts.length} productos sincronizados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentProducts.length > 0 ? (
                                <div className="space-y-4">
                                    {recentProducts.map((product) => (
                                        <div key={product.id} className="flex items-center gap-4">
                                            <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                                                <Image 
                                                    src={product.imageUrl || "/images/placeholder-product.png"} 
                                                    alt={product.title}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover"
                                                    unoptimized={true}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                {product.link ? (
                                                    <Link href={product.link} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="link" className="h-auto p-0 text-sm font-medium leading-none">
                                                            {product.title}
                                                            <ExternalLink className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <p className="text-sm font-medium">{product.title}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {product.price} {product.currency} • {product.availability}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No hay productos sincronizados</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Link href={`/client/${slug}/productos/text-search`} className="w-full">
                                <Button variant="outline" className="w-full" disabled={!feed}>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Ver todos los productos
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                </TabsContent>

                <TabsContent value="actions">
                    <DashboardActions feed={feed} clientId={client.id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}