"use client"

import { Input } from "@/components/ui/input"
import { Search, PackageOpen } from "lucide-react"
import { useState } from "react"
import ProductCard, { ProductCardProps } from "./product-card"

type Props = {
  products: ProductCardProps[]
  showSearchBox?: boolean
}

export default function ProductList({ products, showSearchBox = true }: Props) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar productos basados en el término de búsqueda
  const filteredProducts = showSearchBox && searchTerm.trim() ? 
    products.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (product.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (product.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    ) : 
    products;

  return (
    <div className="w-full py-6 space-y-6">
      {showSearchBox && (
        <div className="w-full max-w-md mx-auto px-4 relative">
          <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filtrar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      )}
      
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
          {showSearchBox && searchTerm.trim() ? (
            <>
              <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground max-w-md">
                No hay productos que coincidan con &quot;{searchTerm}&quot;. Intenta con otros términos de búsqueda.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
              <p className="text-muted-foreground max-w-md">
                No se encontraron productos para mostrar. Prueba a cambiar los criterios de búsqueda o sincroniza productos desde tu feed.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id}
              {...product}
            />
          ))}
        </div>
      )}
    </div>
  )
} 