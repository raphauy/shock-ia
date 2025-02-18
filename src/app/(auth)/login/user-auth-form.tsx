"use client"

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from 'next-auth/react';
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { validateEmailAction } from "./actions";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const { toast } = useToast()
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const profileFormSchema = z.object({
    email: z.string({required_error: "El mail es obligatorio."}).email(),
  })
  
  type ProfileFormValues = z.infer<typeof profileFormSchema>

  const defaultValues: Partial<ProfileFormValues> = {
    email: ""
  }
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  })

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true)

    const email= values.email.toLowerCase()
    console.log("email " + email);
    console.log("values " + JSON.stringify(values));

    const mailValid = await validateEmailAction(email)
    if (!mailValid) {
      toast({
        title: "Email no encontrado",
        description: "El email no está registrado en SHOCK IA",
      })
      setIsLoading(false)
      return
    }
   
    toast({
      title: "Enviando mail!!!",
    })

    signIn('email', {...values, redirect: false })
    .then((callback) => {
      console.log(callback);
      
      if (callback?.ok) {
        router.push('/emailverify')
      }

      if (callback?.error) {
        toast({
          title: "Algo salió mal",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <p className="text-white">{callback?.error}</p>
            </pre>
          ),
        })
      }
    })
    .finally(() => setIsLoading(false))
  }

  function signGoogle() {
    signIn("google")
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="nombre@email.com" {...field} />
              </FormControl>
              <FormDescription className="text-center">
                Ingresa tu email y te enviaremos un link de acceso
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
          <Button disabled={isLoading} className="w-full whitespace-nowrap">
            {isLoading && (
              <Loader className="animate-spin" />
            )}
            Envíame el link
          </Button>
      </form>
    </Form>
    </div>
  )
}