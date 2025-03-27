"use client"

import { useState, useEffect, useCallback } from "react"
import { Switch } from "@/components/ui/switch"
import { Loader, AlertCircle, CheckCircle, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

    // Limpiar la URL cuando cambia el cliente
    useEffect(() => {
        setFeedUrl("")
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

        try {
            // Obtenemos el resultado de la validación
            const validation = await validateProductFeedAction(feedUrl)
            
            // Asignamos cada propiedad a su estado correspondiente
            setFeedIsValid(validation.isValid)
            setProductCount(validation.productCount)
            
            if (validation.isValid) {
                toast({
                    title: "Validación exitosa",
                    description: `La URL contiene un feed válido con ${validation.productCount} productos`
                })
            } else {
                toast({
                    title: "Feed inválido",
                    description: "La URL no contiene un feed válido en formato Google Shopping",
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
                
                if (!validation.isValid) {
                    toast({
                        title: "Feed inválido",
                        description: "La URL no contiene un feed válido en formato Google Shopping",
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
                            Ingresa la URL del feed de productos en formato Google Shopping
                        </p>
                        
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="https://ejemplo.com/feed.xml"
                                    value={feedUrl}
                                    onChange={(e) => {
                                        setFeedUrl(e.target.value)
                                        setFeedIsValid(null)
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
                                        </> : 
                                        <><AlertCircle className="w-4 h-4 mr-1" /> Feed inválido</>
                                    }
                                </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                                <strong>Formato esperado:</strong> Google Shopping (XML)
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