"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RepositoryFormValues, repositorySchema } from "@/services/repository-services";
import { createRepositoryAndAssociateAction } from "./fc-actions";

type Props = {
  clientId: string
}

export function CreateFCDialog({ clientId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositorySchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: RepositoryFormValues) => {
    setLoading(true);
    try {
      const created = await createRepositoryAndAssociateAction(data.name, clientId);
      if (!created) {
        toast({ title: "Error", description: "Error al crear la FC", variant: "destructive" });
        return;
      }
      toast({ title: "FC creada con éxito" });
      closeDialog();
      router.push(`/admin/config?clientId=${clientId}&fcId=${created.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          <PlusCircle size={22} className="mr-2"/>
          Crear FC
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva FC</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-white rounded-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la FC" {...field} />
                    </FormControl>
                    <FormDescription>
                      El nombre de la FC, lo podrás cambiar después
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button onClick={closeDialog} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
                <Button type="submit" className="w-32 ml-2">
                  {loading ? <Loader className="h-4 w-4 animate-spin" /> : <p>Guardar</p>}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 