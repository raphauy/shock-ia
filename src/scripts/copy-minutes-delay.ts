import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando la copia de valores de minutesBefore a minutesDelay...');

  // Buscar todas las definiciones de recordatorio donde minutesDelay aún no se ha establecido
  const definitionsToUpdate = await prisma.reminderDefinition.findMany({
    where: {
      minutesDelay: null,
    },
  });

  if (definitionsToUpdate.length === 0) {
    console.log('No hay definiciones de recordatorio que necesiten actualizarse.');
    return;
  }

  console.log(`Se encontraron ${definitionsToUpdate.length} definiciones para actualizar.`);

  // Crear una transacción para actualizar todas las definiciones encontradas
  const updatePromises = definitionsToUpdate.map((definition) =>
    prisma.reminderDefinition.update({
      where: { id: definition.id },
      data: { minutesDelay: definition.minutesBefore },
    })
  );

  try {
    // Ejecutar todas las actualizaciones en una transacción
    await prisma.$transaction(updatePromises);
    console.log(`¡Éxito! Se actualizaron ${definitionsToUpdate.length} definiciones.`);
  } catch (error) {
    console.error('Error al actualizar las definiciones:', error);
    throw error; // Re-lanzar el error para detener el proceso si algo falla
  }
}

main()
  .catch((e) => {
    console.error('Ocurrió un error al ejecutar el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Script finalizado.');
  });
