import { getInactiveOpenConversations, setInactiveOpenConversationsAsPending } from '../src/services/chatwoot';

describe('Funciones de Chatwoot', () => {
  // Usa el accountId 1 por defecto, o la variable de entorno si está definida
  const accountId = Number(process.env.CHATWOOT_TEST_ACCOUNT_ID) || 7;

  // Asegurarse de tener los valores de entorno correctos antes de cada prueba
  beforeAll(() => {
    // Verificar que las variables de entorno necesarias estén configuradas
    if (!process.env.CHATWOOT_URL || !process.env.CHATWOOT_ACCESS_TOKEN) {
      console.warn('⚠️ CHATWOOT_URL o CHATWOOT_ACCESS_TOKEN no están configurados. Algunas pruebas pueden fallar.');
    }
  });

  describe('getInactiveOpenConversations', () => {
    it('debería devolver un array de objetos con información de conversaciones inactivas abiertas', async () => {
      const result = await getInactiveOpenConversations(accountId);
      
      // Verificar que devuelve un array (puede estar vacío según estado real)
      expect(Array.isArray(result)).toBe(true);
      
      // Verificar que si hay elementos, sean objetos con id, contactName y phoneNumber
      if (result.length > 0) {
        expect(typeof result[0]).toBe('object');
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('contactName');
        expect(result[0]).toHaveProperty('phoneNumber');
        expect(typeof result[0].id).toBe('number');
      }
      
      console.log(`Se encontraron ${result.length} conversaciones inactivas abiertas`);
    });
  });

  describe('setInactiveOpenConversationsAsPending', () => {
    it('debería procesar correctamente las conversaciones inactivas', async () => {
      // Ejecutar la función real
      const result = await setInactiveOpenConversationsAsPending(accountId);
      
      // Verificar que devuelve un array (puede estar vacío según estado real)
      expect(Array.isArray(result)).toBe(true);
      
      console.log(`Se actualizaron ${result.length} conversaciones a estado 'pending'`);
      
      // Si hay resultados, verificar la estructura
      if (result.length > 0) {
        // Verificar estructura del objeto
        expect(result[0]).toHaveProperty('conversationId');
        expect(result[0]).toHaveProperty('contactName');
        expect(result[0]).toHaveProperty('contactPhone');
        
        // Verificar tipos
        expect(typeof result[0].conversationId).toBe('number');
        expect(typeof result[0].contactName).toBe('string');
        expect(typeof result[0].contactPhone).toBe('string');
        
        // Imprimir un ejemplo de los datos devueltos
        console.log('Ejemplo de conversación actualizada:', result[0]);
      }
    });
  });
}); 