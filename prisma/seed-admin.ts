import { PrismaClient } from "@prisma/client"



export async function seedAdmin(prisma: PrismaClient) {
  const adminUser = await prisma.user.create({
    data: {
      name: "Rapha",
      email: "rapha.uy@rapha.uy",
      role: "admin"
    },
  })
  return adminUser
}
