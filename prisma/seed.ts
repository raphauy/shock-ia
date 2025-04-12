import { PrismaClient } from "@/lib/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding...")
  
  // const adminUser= await seedAdmin(prisma)
  // console.log({ adminUser })
  
  //await seedModels(prisma)

  //await seedTokensPrice(prisma)

  // development db:
  // const gpt4TurboId= "clvfs48bd000285wuh6j2bxar"
  // await setModelToAllClients(gpt4TurboId, prisma)

  console.log("Seeding complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
