import { UserFormValues } from "@/app/admin/users/(crud)/userForm";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export type UserDAO = {
  id: string
  name: string
  email: string
  role: string
  emailVerified: Date
  image: string
  clientId: string
}

export const ClientUserSchema = z.object({
	name: z.string().min(1, "name is required."),
	email: z.string().email("Invalid email address"),
	clientId: z.string().min(1, "clientId is required."),
})

export type ClientUserFormValues = z.infer<typeof ClientUserSchema>

export default async function getUsers() {

  const found = await prisma.user.findMany({
    orderBy: {
      email: 'asc',
    },
    include: {
      client: true
    }
  })

  return found;
}

export async function getUsersOfClient(clientId: string) {

  const found = await prisma.user.findMany({
    where: {
      clientId
    },
    orderBy: {
      email: 'asc',
    },
    include: {
      client: true
    }
  })

  return found;
}


export async function getUser(id: string) {

  const found = await prisma.user.findUnique({
    where: {
      id
    },
    include: {
      client: true
    }
  })

  return found
}

export async function createUser(data: UserFormValues) {
  
  const created= await prisma.user.create({
    data: {
      name: data.nombre,
      email: data.email,      
      role: data.rol,
      clientId: data.clienteId ? data.clienteId : undefined
    }
  })

  return created
}

export async function editUser(id: string, data: UserFormValues) {
  console.log(data);
  
  const created= await prisma.user.update({
    where: {
      id
    },
    data: {
      name: data.nombre,
      email: data.email,      
      role: data.rol,
      clientId: data.clienteId ? data.clienteId : undefined
    }
  })

  return created
}

export async function deleteUser(id: string) {
  
  const deleted= await prisma.user.delete({
    where: {
      id
    },
  })

  return deleted
}

export async function getUserByEmail(email: string) {
  const found= await prisma.user.findUnique({
    where: {
      email
    }
  })
  return found
}

export async function getNonComercialUsersDAO(clientId: string): Promise<UserDAO[]> {
  const found= await prisma.user.findMany({
    where: {
      clientId,
      comercial: null
    }
  })
  return found as UserDAO[]
}

export async function getClientUsersDAO(clientId: string): Promise<UserDAO[]> {
  const found= await prisma.user.findMany({
    where: {
      clientId,
      role: "cliente"
    }
  })
  return found as UserDAO[]
}

export async function getUserDAO(id: string): Promise<UserDAO> {
  const found= await prisma.user.findUnique({
    where: {
      id
    }
  })
  return found as UserDAO
}

export async function createClientUser(data: ClientUserFormValues) {
  try {
    const created= await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: "cliente",
        clientId: data.clientId
      }
    })
    return created
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error("El email ya existe")
    }
    console.error('Error:', error)
    throw new Error("Error al crear el usuario")
  }
}

export async function updateClientUser(id: string, data: ClientUserFormValues) {
  try {
    const updated= await prisma.user.update({
      where: {
        id
    },
    data: {
      name: data.name,
      email: data.email,
      role: "cliente",
      clientId: data.clientId
    }
    })
    return updated
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error("El email ya existe")
    }
    console.error('Error:', error)
    throw new Error("Error al actualizar el usuario")
  }
}

export async function validateEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  return user !== null;
}