import { getClientBySlug } from "@/services/clientService"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { searchClientProducts, getClientProductsCount, countClientProductsBySearch, getClientProductsWithEmbeddingsCount } from "@/services/product-services"
import { Package, Database, PackageOpen, LayoutDashboard } from "lucide-react"
import ProductList from "../components/product-list"
import Pagination from "../components/pagination"
import ItemsPerPage from "../components/items-per-page"
import SearchBox from "../components/search-box"
import Link from "next/link"

type Props = {
  params: {
    slug: string
  },
  searchParams: {
    page?: string
    perPage?: string
    query?: string
  }
}

export default async function TextSearchPage({ params, searchParams }: Props) {
  const { slug } = params
  
  // Configuración de paginación y búsqueda
  const currentPage = parseInt(searchParams.page || "1")
  const itemsPerPage = parseInt(searchParams.perPage || "20")
  const searchQuery = searchParams.query || ""
  
  // Verificar cliente y acceso a productos
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

  // Obtener estadísticas de productos utilizando la capa de servicios
  
  // Obtener conteos
  const totalProductCount = await getClientProductsCount(client.id)
  const filteredProductCount = searchQuery 
    ? await countClientProductsBySearch(client.id, searchQuery)
    : totalProductCount
  
  const productsWithEmbeddings = await getClientProductsWithEmbeddingsCount(client.id)

  // Obtener productos paginados con búsqueda
  const rawProducts = await searchClientProducts(
    client.id,
    searchQuery,
    10, // Valor original para compatibilidad
    currentPage,
    itemsPerPage
  )
  
  // Convertir Decimal a string para evitar problemas de serialización
  const products = rawProducts.map(product => ({
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price?.toString() || "0",
    salePrice: product.salePrice?.toString() || null,
    currency: product.currency,
    brand: product.brand,
    category: product.category,
    availability: product.availability,
    imageUrl: product.imageUrl,
    link: product.link
  }))

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <h1 className="text-3xl font-bold tracking-tight">Listado y Búsqueda de Productos</h1>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Link href={`/client/${slug}/productos`}>
              <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href={`/client/${slug}/productos/semantic-search`}>
              <Button variant="outline">
                <Database className="mr-2 h-4 w-4" />
                Búsqueda Semántica
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground">
          Visualiza y busca productos de tu catálogo por palabras clave
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductCount}</div>
            <p className="text-xs text-muted-foreground">
              Productos en tu catálogo
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
              {Math.round((productsWithEmbeddings / (totalProductCount || 1)) * 100)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />
      
      <SearchBox initialQuery={searchQuery} />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {searchQuery ? (
            <span>
              Mostrando {products.length} de {filteredProductCount} productos para &quot;{searchQuery}&quot; • Página {currentPage} de {Math.ceil(filteredProductCount / itemsPerPage)}
            </span>
          ) : (
            <span>
              Mostrando {products.length} de {totalProductCount} productos • Página {currentPage} de {Math.ceil(totalProductCount / itemsPerPage)}
            </span>
          )}
        </div>
        <ItemsPerPage />
      </div>

      {filteredProductCount === 0 && searchQuery ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            No hay productos que coincidan con &quot;{searchQuery}&quot;. Intenta con otros términos de búsqueda o restablece la búsqueda.
          </p>
          <Link 
            href={`/client/${slug}/productos/text-search`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Mostrar todos los productos
          </Link>
        </div>
      ) : filteredProductCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            No se han encontrado productos en tu catálogo. Sincroniza productos desde tu feed para empezar a utilizarlos.
          </p>
          <Link 
            href={`/client/${slug}/productos`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Ir al Dashboard
          </Link>
        </div>
      ) : (
        <ProductList products={products} showSearchBox={false} />
      )}
      
      {filteredProductCount > 0 && (
        <Pagination 
          totalItems={filteredProductCount} 
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
        />
      )}
    </div>
  )
}