import axios from 'axios';
import { getProductsGoogleSheetFormat } from './google-sheets-service';

/**
 * Función principal de prueba
 */
async function test() {
  console.log('🧪 Iniciando prueba de lectura de Google Sheet...');
  
  // URL de ejemplo de una Google Sheet pública (reemplaza con tu propia URL)
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/14VbmY-Y1Tg6U1Unrz2UBdAoSx3gUg0uptPDun-Bw03E/edit?gid=0#gid=0';
  
  // Probar la función getProductsGoogleSheetFormat
  console.log('\n🧪 PRUEBA DE FUNCIÓN getProductsGoogleSheetFormat:');
  const googleSheetResult = await getProductsGoogleSheetFormat(sheetUrl, 5);
  
  console.log(`Resultado: ${googleSheetResult.products.length} productos, válido: ${googleSheetResult.validation.isValid}`);
  
  if (!googleSheetResult.validation.isValid) {
    console.log('Problemas encontrados:');
    console.log(`- Columnas obligatorias faltantes: ${googleSheetResult.validation.missingRequired.join(', ')}`);
  } else {
    // Mostrar primeros 2 productos como ejemplo
    const sampleSize = Math.min(2, googleSheetResult.products.length);
    console.log(`\n📑 MUESTRA DE PRODUCTOS (${sampleSize}):`);
    
    for (let i = 0; i < sampleSize; i++) {
      console.log(`\nProducto ${i + 1}:`);
      const product = googleSheetResult.products[i];
      console.log({
        id: product.id,
        title: product.title,
        price: `${product.price.value} ${product.price.currency}`,
        imageUrl: product.image_link
      });
    }
  }
}

// Ejecutar la función principal
// test().catch(err => {
//   console.error('❌ Error inesperado:', err);
// });

