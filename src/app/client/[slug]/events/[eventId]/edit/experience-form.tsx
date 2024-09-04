// "use client"

// import { Heading } from "@/components/heading"
// import ImageUpload from "@/components/image-upload"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Separator } from "@/components/ui/separator"
// import { Textarea } from "@/components/ui/textarea"
// import { toast } from "@/components/ui/use-toast"
// import { generateSlug } from "@/lib/utils"
// import { CategoryDAO } from "@/services/category-services"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useParams, useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
// import { useForm } from "react-hook-form"
// import { ExperienceDAO, ExperienceFormValues, experienceSchema } from "@/services/experience-services"
// import { createExperienceAction, updateExperienceAction } from "../../experience-actions"
// import { DeleteExperienceDialog } from "../../experience-dialogs"
// import { Loader } from "lucide-react"


// interface ProductFormProps {
//   initialData: ExperienceDAO | null;
//   categories: CategoryDAO[];
// };

// export function ExpeienceForm({ initialData, categories }: ProductFormProps) {

//   const params= useParams()
//   const storeSlug= params.storeSlug as string
//   const router = useRouter();

//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const title = initialData ? 'Editar' : 'Crear' + " experiencia";
//   const description = initialData ? 'Editar una experiencia.' : 'Agregar una nueva experiencia';
//   const toastMessage = initialData ? 'Experiencia actualizada.' : 'Experiencia creada.';
//   const action = initialData ? 'Guardar' : 'Crear';

//   const defaultValues = initialData ? {
//     ...initialData,
//     description: initialData.description || "",
//     price: String(initialData?.price),
//     seatsPerTimeSlot: String(initialData?.seatsPerTimeSlot),
//     discountPrice: String(initialData?.discountPrice),
//     duration: String(initialData?.duration),
//   } : {
//     name: '',
//     slug: '',
//     description: '',
//     images: [],
//     address: '',
//     seatsPerTimeSlot: "1",
//     price: "0",
//     discountPrice: "0",
//     duration: "0",
//     categoryId: '',
//     isFeatured: false,
//     isArchived: false,
//     initialQuantity: "0",
//   }

//   const form = useForm<ExperienceFormValues>({
//     resolver: zodResolver(experienceSchema),
//     defaultValues
//   });
//   const watchName = form.watch("name")
//   const [slug, setSlug] = useState("")

//   useEffect(() => {
//     setSlug(generateSlug(watchName))
//     form.setValue("slug", slug)
//   }, [watchName, slug, form])
  

//   const onSubmit = async (data: ExperienceFormValues) => {
//     try {
//       setLoading(true)
//       data.slug= slug
//       let experience
//       if (initialData) {
//         experience= await updateExperienceAction(initialData.id, data)
//       } else {
//         const categorySlug= categories.find((category) => category.id === data.categoryId)?.slug
//         if (!categorySlug) {
//           toast({ title: "Error", description: "No se pudo crear la experiencia, la categoría no existe.", variant: "destructive" })
//         } else {
//           experience= await createExperienceAction(storeSlug, categorySlug, data)
//         }
//       }
//       toast({ title: toastMessage })
//       const url= experience ? `/experiences/${experience.id}` : `/experiences`
//       router.push(url);
//     } catch (error: any) {
//       toast({ title: "Algo salió mal!", description: error.message, variant: "destructive"})
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//      <div className="flex items-center justify-between">
//         <Heading title={title} description={description} />
//         {initialData && (
//           <DeleteExperienceDialog id={initialData.id} description={`Seguro que deseas eliminar la experiencia ${initialData.name}`} />
//         )}
//       </div>
//       <Separator />
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full bg-white p-2 border rounded-md">
//           <FormField
//             control={form.control}
//             name="images"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Images</FormLabel>
//                 <FormControl>
//                   <ImageUpload 
//                     value={field.value.map((image) => image.url)} 
//                     disabled={loading} 
//                     onChange={(url) => field.onChange([...field.value, { url }])}
//                     onRemove={(url) => field.onChange([...field.value.filter((current) => current.url !== url)])}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <div className="lg:grid lg:grid-cols-2 gap-8 space-y-4">
//           <FormField
//               control={form.control}
//               name="categoryId"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Categoría</FormLabel>
//                   <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue defaultValue={field.value} placeholder="Selecciona una categoría" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {categories.map((category) => (
//                         <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <p></p>
//             <FormField
//               control={form.control}
//               name="slug"
//               render={({ field }) => (
//                 <FormItem className="hidden">
//                   <FormLabel>Slug</FormLabel>
//                   <FormControl >
//                     <Input placeholder="" {...field} disabled={true} value={slug} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="name"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Nombre</FormLabel>
//                   <FormControl>
//                     <Input disabled={loading} placeholder="Nombre de la experiencia" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                   <p>slug: {slug}</p>
//                   </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="address"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Dirección</FormLabel>
//                   <FormControl>
//                     <Input disabled={loading} placeholder="Dirección donde se llevará a cabo la experiencia" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                   </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="description"
//               render={({ field }) => (
//                 <FormItem className="col-span-2">
//                   <FormLabel>Descripción</FormLabel>
//                   <FormControl>
//                     <Textarea rows={6} disabled={loading} placeholder="Descripción de la experiencia" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <div className="lg:flex items-end gap-2 lg:col-span-2 grid">
//               <FormField
//                 control={form.control}
//                 name="price"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Precio</FormLabel>
//                     <FormControl>
//                       <Input type="number" disabled={loading} placeholder="9.99" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                     </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="discountPrice"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Precio con descuento</FormLabel>
//                     <FormControl>
//                       <Input type="number" disabled={loading} placeholder="9.99" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="duration"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Duración en minutos</FormLabel>
//                     <FormControl>
//                       <Input type="number" disabled={loading} placeholder="60" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="seatsPerTimeSlot"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Cupos por experiencia</FormLabel>
//                     <FormControl>
//                       <Input type="number" disabled={loading} placeholder="1" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <FormField
//               control={form.control}
//               name="isFeatured"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                   <FormControl>
//                     <Checkbox
//                       checked={field.value}
//                       // @ts-ignore
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                   <div className="space-y-1 leading-none">
//                     <FormLabel>
//                       Destacado
//                     </FormLabel>
//                     <FormDescription>
//                       Esta experiencia aparecerá en la página principal.
//                     </FormDescription>
//                   </div>
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="isArchived"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                   <FormControl>
//                     <Checkbox
//                       checked={field.value}
//                       // @ts-ignore
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                   <div className="space-y-1 leading-none">
//                     <FormLabel>
//                       Archivado
//                     </FormLabel>
//                     <FormDescription>
//                       Esta experiencia dejará de estar a la venta.
//                     </FormDescription>
//                   </div>
//                 </FormItem>
//               )}
//             />

//           </div>
//           <Button disabled={loading} className="ml-auto w-32 gap-2" type="submit">
//             { loading && <Loader className="w-4 h-4 animate-spin" /> }
//             { action }
//           </Button>
//         </form>
//       </Form>
//     </>
//   );
// };
