"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteFieldAction, createOrUpdateFieldAction, getFieldDAOAction } from "./field-actions"
import { repoFieldSchema, FieldFormValues } from '@/services/field-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldType } from "@/lib/generated/prisma"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CustomFieldDAO } from "@/services/customfield-services"
import { ListGenerator } from "./list-generator"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props= {
  id?: string
  repoId?: string | null | undefined
  eventId?: string | null | undefined
  customFields: CustomFieldDAO[]
  closeDialog: () => void
}

export function FieldForm({ id, repoId, eventId, customFields, closeDialog }: Props) {
  const [initialDataLoading, setInitialDataLoading] = useState(id ? true : false);
  // Estado local para mantener el tipo real
  const [fieldType, setFieldType] = useState<FieldType>("string");
  
  const [initialValues, setInitialValues] = useState<FieldFormValues>({
    name: "",
    type: "string" as FieldType,
    description: "",
    required: true,
    etiquetar: false,
    repositoryId: repoId ?? undefined,
    eventId: eventId ?? undefined,
    linkedCustomFieldId: undefined,
    listOptions: []
  });

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(repoFieldSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (id) {
      setInitialDataLoading(true);
      getFieldDAOAction(id)
        .then(data => {
          if (data) {
            // Establecer el tipo directamente en el estado local
            if (["string", "number", "boolean", "list"].includes(data.type)) {
              setFieldType(data.type as FieldType);
            }
            
            const newValues = {
              repositoryId: data.repositoryId ?? undefined,
              eventId: data.eventId ?? undefined,
              linkedCustomFieldId: data.linkedCustomFieldId ?? undefined,
              name: data.name,
              type: data.type as FieldType,
              description: data.description,
              required: data.required,
              etiquetar: data.etiquetar,
              listOptions: data.listOptions ?? []
            };
            
            setInitialValues(newValues);
            form.reset(newValues)
          }
          setInitialDataLoading(false);
        })
        .catch(() => {
          setInitialDataLoading(false);
        });
    }
  }, [id, form]);
  

  // Actualizar los valores del formulario cuando cambian los valores iniciales
  useEffect(() => {
    if (!initialDataLoading) {
      form.reset(initialValues);
    }
  }, [initialValues, initialDataLoading, form]);

  const [loading, setLoading] = useState(false)

  const [filteredCustomFields, setFilteredCustomFields] = useState<CustomFieldDAO[]>(customFields)

  const watchedType = form.watch("type")
  const watchedListOptions = form.watch("listOptions")

  useEffect(() => {
    const selectedType = watchedType
    if (!selectedType) {
      setFilteredCustomFields(customFields)
    } else {
      setFilteredCustomFields(customFields.filter(field => field.type === selectedType))
    }
  }, [watchedType, customFields])

  const onSubmit = async (data: FieldFormValues) => {
    setLoading(true)
    try {
      // Forzar el tipo correcto desde nuestro estado local
      const formDataWithCorrectType = {
        ...data,
        type: fieldType
      };
      
      await createOrUpdateFieldAction(id ? id : null, formDataWithCorrectType)
      toast({ title: id ? "Campo actualizado" : "Campo creado" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function handleListOptionsChange(options: string[]) {
    form.setValue("listOptions", options)
  }

  if (initialDataLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-md">
      <Form {...form}>
        <ScrollArea className="h-[800px] max-h-[80vh] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
          
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="ej: nombre" {...field} disabled={field.value === "nombre"}/>
                  </FormControl>
                  <FormDescription>Sin espacios y sin tildes ni eñes, para más de una palabra se recomienda camelCase, ej: nombreCompleto</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          
        
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => {                
                return (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          // Actualizar ambos: el estado del formulario y nuestro estado local
                          field.onChange(value);
                          setFieldType(value as FieldType);
                        }} 
                        value={fieldType}
                        defaultValue="string"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(FieldType).map((type) => (
                            <SelectItem key={type} value={type}>{getTypeLabel(type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* add a field for the list options here */}
            {
              watchedType === "list" && 
                <ListGenerator options={watchedListOptions ?? []} onChange={handleListOptionsChange} />
            }
        
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="ej: Nombre completo del lead" {...field} />
                  </FormControl>
                  <FormDescription>Esta descripción es clave para que el LLM pueda entender qué tiene que preguntar al usuario</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          
        
            <FormField
              control={form.control}
              name="required"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="mt-1">Obligatorio</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                  <FormDescription>Si está marcado, el LLM debería insistir en que el usuario responda la información de este campo</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="etiquetar"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="mt-1">Etiquetar</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={watchedType === "number"} />
                    </FormControl>
                  </div>
                  <FormDescription>Si está marcado, cuando se ejecuta esta FC, se agregará una etiqueta con el valor de este campo</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedCustomFieldId"
              render={({ field }) => {
                // Verificar que el valor es válido para el enum
                const safeValue = field.value ? field.value : undefined;
                
                return (
                  <FormItem>
                    <FormLabel>Linkear campo personalizado</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange}
                        value={safeValue}
                      >
                        <FormControl>
                          <SelectTrigger disabled={customFields.length === 0}>
                            <SelectValue placeholder="Selecciona un Campo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCustomFields.map((customField) => (
                            <SelectItem key={customField.id} value={customField.id}>{customField.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          

          <div className="flex justify-end">
              <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
              <Button type="submit" className="w-32 ml-2">
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <p>Guardar</p>}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </Form>
    </div>     
  )
}

type DeleteProps= {
  id: string
  closeDialog: () => void
}

export function DeleteFieldForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteFieldAction(id)
    .then(() => {
      toast({title: "Field deleted" })
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }
  
  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Delete  
      </Button>
    </div>
  )
}

function getTypeLabel(type: FieldType) {
  switch (type) {
    case "string": return "Texto"
    case "number": return "Número"
    case "boolean": return "Booleando (SI/NO)"
    case "list": return "Lista"
    default: return type
  }
}