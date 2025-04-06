"use client"

import { useState, useEffect, useCallback } from "react"
import { Switch } from "@/components/ui/switch"
import { Loader, AlertCircle, CheckCircle, Save, ExternalLink, Info } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
    checkClientHasOrderFunctionAction,
    createProductFeedAction, 
    getProductFeedAction, 
    setHaveOrderFunctionAction, 
    setHaveProductsAction, 
    validateProductFeedAction 
} from "./(crud)/actions"

interface Props {
    clientId: string
    haveProducts: boolean
}

export default function ProductsConfig({ clientId, haveProducts: initialHaveProducts }: Props) {
    const [loadingHaveProducts, setLoadingHaveProducts] = useState(false)
    const [loadingFeed, setLoadingFeed] = useState(false)
    const [fetchingUrl, setFetchingUrl] = useState(false)
    const [haveProducts, setHaveProducts] = useState(initialHaveProducts)
    const [feedUrl, setFeedUrl] = useState("")
    const [feedIsValid, setFeedIsValid] = useState<boolean | null>(null)
    const [productCount, setProductCount] = useState<number>(0)
    const [haveOrderFunction, setHaveOrderFunction] = useState(false)
    const [loadingOrderFunction, setLoadingOrderFunction] = useState(false)
    const [checkingOrderFunction, setCheckingOrderFunction] = useState(false)
    const [validationDetails, setValidationDetails] = useState<{
        missingRequired?: string[];
        missingOptional?: string[];
        unknown?: string[];
        provider?: string;
    } | null>(null)

    // Determinar el tipo de proveedor basado en la URL
    const detectProvider = (url: string): string => {
        if (url.includes('docs.google.com/spreadsheets')) {
            return "Google Sheets";
        }
        return "Fenicio";
    }

    // Limpiar la URL cuando cambia el cliente
    useEffect(() => {
        setFeedUrl("")
        // Reiniciar los estados de validación
        setFeedIsValid(null)
        setProductCount(0)
        setValidationDetails(null)
    }, [clientId])

    // Carga la URL del feed si existe
    const loadFeedUrl = useCallback(async () => {
        setFetchingUrl(true)
        try {
            const url = await getProductFeedAction(clientId)
            if (url) {
                setFeedUrl(url)
            } else {
                // Asegurarse de que la URL esté vacía si no hay feed
                setFeedUrl("")
            }
        } catch (error) {
            console.error("Error al cargar URL del feed:", error)
            setFeedUrl("")
        } finally {
            setFetchingUrl(false)
        }
    }, [clientId]);

    // Verificar si el cliente tiene la función buscarOrden activada
    const checkOrderFunction = useCallback(async () => {
        setCheckingOrderFunction(true)
        try {
            const hasOrderFunction = await checkClientHasOrderFunctionAction(clientId)
            setHaveOrderFunction(hasOrderFunction)
        } catch (error) {
            console.error("Error al verificar función de órdenes:", error)
            setHaveOrderFunction(false)
        } finally {
            setCheckingOrderFunction(false)
        }
    }, [clientId])

    // Siempre verificamos el estado de la función buscarOrden al cargar el componente
    // o cuando cambia el clientId, independientemente del estado de productos
    useEffect(() => {
        checkOrderFunction()
    }, [clientId, checkOrderFunction])

    // Sincronizar el estado con las props cuando cambian
    useEffect(() => {
        setHaveProducts(initialHaveProducts)
        
        // Si está habilitado, cargamos la URL del feed
        if (initialHaveProducts) {
            loadFeedUrl()
        } else {
            // Si no está habilitado, aseguramos que la URL esté vacía
            setFeedUrl("")
        }
    }, [initialHaveProducts, loadFeedUrl, clientId])

    // Función para activar/desactivar productos para un cliente
    const handleHaveProductsChange = async (checked: boolean) => {
        setLoadingHaveProducts(true)
        try {
            await setHaveProductsAction(clientId, checked)
            setHaveProducts(checked)
            
            // Si se desactivan los productos, también desactivamos la función de órdenes
            if (!checked) {
                // Desactivamos la función en la base de datos y actualizamos el estado local
                await setHaveOrderFunctionAction(clientId, false)
                setHaveOrderFunction(false)
            }
            
            toast({
                title: checked ? "Productos activados" : "Productos desactivados",
                description: checked 
                    ? "Los productos han sido activados correctamente" 
                    : "Los productos han sido desactivados correctamente",
            })
        } catch (error) {
            console.error("Error al cambiar estado de productos:", error)
            toast({
                title: "Error",
                description: "Error al cambiar estado de productos",
                variant: "destructive"
            })
        } finally {
            setLoadingHaveProducts(false)
        }
    }
    
    // Función para activar/desactivar la función buscarOrden
    const handleHaveOrderFunctionChange = async (checked: boolean) => {
        setLoadingOrderFunction(true)
        try {
            await setHaveOrderFunctionAction(clientId, checked)
            setHaveOrderFunction(checked)
            toast({
                title: checked ? "Función buscarOrden activada" : "Función buscarOrden desactivada",
                description: checked 
                    ? "La función buscarOrden ha sido activada correctamente" 
                    : "La función buscarOrden ha sido desactivada correctamente",
            })
        } catch (error) {
            console.error("Error al cambiar estado de la función buscarOrden:", error)
            toast({
                title: "Error",
                description: "Error al cambiar estado de la función buscarOrden",
                variant: "destructive"
            })
        } finally {
            setLoadingOrderFunction(false)
        }
    }

    // Función para validar la URL del feed
    const handleValidateUrl = async () => {
        if (!feedUrl.trim()) {
            toast({
                title: "Error",
                description: "Por favor, ingresa una URL válida",
                variant: "destructive"
            })
            return
        }

        setLoadingFeed(true)
        setFeedIsValid(null)
        setProductCount(0)
        setValidationDetails(null)

        try {
            // Obtenemos el resultado de la validación
            const validation = await validateProductFeedAction(feedUrl)
            
            // Asignamos cada propiedad a su estado correspondiente
            setFeedIsValid(validation.isValid)
            setProductCount(validation.productCount)
            
            // Guardamos los detalles de validación si están disponibles
            if (validation.validationDetails) {
                setValidationDetails({
                    ...validation.validationDetails,
                    provider: detectProvider(feedUrl)
                })
            } else {
                setValidationDetails({
                    provider: detectProvider(feedUrl)
                })
            }
            
            if (validation.isValid) {
                toast({
                    title: "Validación exitosa",
                    description: `La URL contiene un feed válido con ${validation.productCount} productos`
                })
            } else {
                // Mensaje específico según el tipo de proveedor
                const provider = detectProvider(feedUrl)
                let errorMessage = ""
                
                if (provider === "Google Sheets") {
                    errorMessage = validation.validationDetails?.missingRequired?.length 
                        ? `Faltan columnas obligatorias: ${validation.validationDetails.missingRequired.join(", ")}`
                        : "El formato de la hoja de cálculo no es válido o la hoja no es accesible"
                } else {
                    errorMessage = "La URL no contiene un feed válido en formato Google Shopping"
                }
                
                toast({
                    title: "Feed inválido",
                    description: errorMessage,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("Error al validar feed:", error)
            toast({
                title: "Error",
                description: "Error al validar la URL del feed",
                variant: "destructive"
            })
            setFeedIsValid(false)
            setProductCount(0)
            setValidationDetails(null)
        } finally {
            setLoadingFeed(false)
        }
    }

    // Función para crear o actualizar el feed de productos
    const handleCreateFeed = async () => {
        if (!feedUrl.trim()) {
            toast({
                title: "Error",
                description: "Por favor, ingresa una URL válida",
                variant: "destructive"
            })
            return
        }

        // Si no se ha validado, validamos primero
        if (feedIsValid === null) {
            setLoadingFeed(true)
            try {
                const validation = await validateProductFeedAction(feedUrl)
                setFeedIsValid(validation.isValid)
                setProductCount(validation.productCount)
                
                // Guardamos los detalles de validación si están disponibles
                if (validation.validationDetails) {
                    setValidationDetails({
                        ...validation.validationDetails,
                        provider: detectProvider(feedUrl)
                    })
                } else {
                    setValidationDetails({
                        provider: detectProvider(feedUrl)
                    })
                }
                
                if (!validation.isValid) {
                    // Mensaje específico según el tipo de proveedor
                    const provider = detectProvider(feedUrl)
                    let errorMessage = ""
                    
                    if (provider === "Google Sheets") {
                        errorMessage = validation.validationDetails?.missingRequired?.length 
                            ? `Faltan columnas obligatorias: ${validation.validationDetails.missingRequired.join(", ")}`
                            : "El formato de la hoja de cálculo no es válido o la hoja no es accesible"
                    } else {
                        errorMessage = "La URL no contiene un feed válido en formato Google Shopping"
                    }
                    
                    toast({
                        title: "Feed inválido",
                        description: errorMessage,
                        variant: "destructive"
                    })
                    setLoadingFeed(false)
                    return
                }
            } catch (error) {
                console.error("Error al validar feed:", error)
                toast({
                    title: "Error",
                    description: "Error al validar la URL del feed",
                    variant: "destructive"
                })
                setLoadingFeed(false)
                return
            }
            setLoadingFeed(false)
        } else if (feedIsValid === false) {
            toast({
                title: "Error",
                description: "No se puede crear el feed porque la URL no es válida",
                variant: "destructive"
            })
            return
        }

        setLoadingFeed(true)
        try {
            const result = await createProductFeedAction(clientId, feedUrl)
            
            if (result) {
                toast({
                    title: "Operación exitosa",
                    description: "Feed de productos creado/actualizado correctamente"
                })
                setFeedIsValid(true)
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo crear el feed de productos",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("Error al crear feed:", error)
            toast({
                title: "Error",
                description: "Error al crear el feed de productos",
                variant: "destructive"
            })
        } finally {
            setLoadingFeed(false)
        }
    }

    // Renderiza los detalles de validación para Google Sheets
    const renderValidationDetails = () => {
        if (!validationDetails || validationDetails.provider !== "Google Sheets") return null;
        
        return (
            <div className="text-xs space-y-1 mt-2 p-2 border rounded-md bg-muted/30">
                <p className="font-medium">Detalles de validación:</p>
                {validationDetails.missingRequired && validationDetails.missingRequired.length > 0 && (
                    <p className="text-destructive">
                        <span className="font-medium">Columnas obligatorias faltantes:</span> {validationDetails.missingRequired.join(", ")}
                    </p>
                )}
                {validationDetails.missingOptional && validationDetails.missingOptional.length > 0 && (
                    <p className="text-amber-500">
                        <span className="font-medium">Columnas opcionales faltantes:</span> {validationDetails.missingOptional.join(", ")}
                    </p>
                )}
                <p className="text-xs italic mt-1">
                    Las columnas obligatorias son: id, title, description, price
                </p>
                <p className="text-xs mt-1">
                    <Link href="https://docs.google.com/spreadsheets/d/14VbmY-Y1Tg6U1Unrz2UBdAoSx3gUg0uptPDun-Bw03E/edit?gid=0" target="_blank" rel="noopener noreferrer">
                        <Button variant="link" className="h-auto p-0 text-xs">
                            Ver ejemplo de hoja de cálculo
                            <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                    </Link>
                </p>
            </div>
        );
    };

    return (
        <div className="w-full p-4 border rounded-lg space-y-4">
            <p className="text-lg font-bold mb-4">Configuración de Productos:</p>
            <div className="flex items-center space-x-2">
                <Switch 
                    checked={haveProducts} 
                    onCheckedChange={handleHaveProductsChange}
                    disabled={loadingHaveProducts}
                />
                <span>Habilitar productos</span>
                {loadingHaveProducts && <Loader className="w-4 h-4 animate-spin ml-2" />}
            </div>

            {/* La configuración del feed solo se muestra si haveProducts es true */}
            {haveProducts && (
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Feed de productos</h3>
                        <p className="text-xs text-muted-foreground">
                            Ingresa la URL del feed de productos (Google Shopping XML o Google Sheets)
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1 mb-2">
                            <Link href="https://docs.google.com/spreadsheets/d/14VbmY-Y1Tg6U1Unrz2UBdAoSx3gUg0uptPDun-Bw03E/edit?gid=0" target="_blank" rel="noopener noreferrer">
                                <Button variant="link" className="h-auto p-0 text-xs">
                                    Ver planilla de ejemplo de Google Sheets con el formato requerido
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="start" className="max-w-[450px]">
                                        <div className="space-y-2 p-1">
                                            <p className="font-semibold">Columnas de la plantilla:</p>
                                            <div>
                                                <p className="font-medium text-destructive text-sm">Obligatorias:</p>
                                                <ul className="list-disc pl-5 text-xs">
                                                    <li><strong>id</strong>: Identificador único del producto</li>
                                                    <li><strong>title</strong>: Título o nombre del producto</li>
                                                    <li><strong>description</strong>: Descripción del producto</li>
                                                    <li><strong>price</strong>: Precio (solo números)</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-medium text-amber-500 text-sm">Opcionales:</p>
                                                <ul className="list-disc pl-5 text-xs">
                                                    <li><strong>image_link</strong>: URL de la imagen principal</li>
                                                    <li><strong>currency</strong>: Moneda (ej. UYU, USD)</li>
                                                    <li><strong>availability</strong>: Disponibilidad (ej. in stock)</li>
                                                    <li><strong>brand</strong>: Marca del producto</li>
                                                    <li><strong>condition</strong>: Condición (ej. new, used)</li>
                                                    <li><strong>link</strong>: URL de la página del producto</li>
                                                    <li><strong>additional_image_links</strong>: URLs de imágenes adicionales (separadas por | )</li>
                                                    <li><strong>size</strong>: Talla o tamaño</li>
                                                    <li><strong>category</strong>: Categoría del producto</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="https://ejemplo.com/feed.xml o https://docs.google.com/spreadsheets/..."
                                    value={feedUrl}
                                    onChange={(e) => {
                                        setFeedUrl(e.target.value)
                                        setFeedIsValid(null)
                                        setValidationDetails(null)
                                    }}
                                    className="flex-grow"
                                    disabled={fetchingUrl}
                                />
                                <Button 
                                    variant="outline"
                                    onClick={handleValidateUrl} 
                                    disabled={loadingFeed || !feedUrl || fetchingUrl}
                                    className="w-48"
                                >
                                    {loadingFeed ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Validar feed
                                </Button>
                                <Button 
                                    onClick={handleCreateFeed} 
                                    disabled={loadingFeed || !feedUrl || fetchingUrl || (feedIsValid === false)}
                                    className="w-48"
                                >
                                    {loadingFeed ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Guardar feed
                                </Button>
                            </div>
                            
                            {feedIsValid !== null && (
                                <div className={`flex items-center text-xs ${feedIsValid ? 'text-green-500' : 'text-destructive'}`}>
                                    {feedIsValid ? 
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-1" /> 
                                            Feed válido - {productCount} productos detectados
                                            {validationDetails?.provider && ` (Proveedor: ${validationDetails.provider})`}
                                        </> : 
                                        <>
                                            <AlertCircle className="w-4 h-4 mr-1" /> 
                                            Feed inválido 
                                            {validationDetails?.provider && ` (Proveedor: ${validationDetails.provider})`}
                                        </>
                                    }
                                </div>
                            )}
                            
                            {/* Mostrar detalles de validación para Google Sheets */}
                            {!feedIsValid && renderValidationDetails()}
                            
                            <p className="text-xs text-muted-foreground">
                                <strong>Formatos soportados:</strong> Google Shopping (XML) y Google Sheets
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Switch para la función buscarOrden - Siempre visible pero deshabilitado si haveProducts es false */}
            <div className="pt-2 border-t">
                <div className="flex items-center space-x-2">
                    <Switch 
                        checked={haveOrderFunction} 
                        onCheckedChange={handleHaveOrderFunctionChange}
                        disabled={loadingOrderFunction || !haveProducts || checkingOrderFunction}
                    />
                    <span>Agregar la FC buscarOrden</span>
                    {(loadingOrderFunction || checkingOrderFunction) && <Loader className="w-4 h-4 animate-spin ml-2" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {checkingOrderFunction ? 
                        "Verificando estado de la función..." :
                        haveProducts ? 
                            "Habilita la función buscarOrden para permitir consultas sobre el estado de pedidos" :
                            "Debes habilitar primero los productos para poder usar esta función"
                    }
                </p>
            </div>
        </div>
    )
} 