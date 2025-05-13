import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  // Referencia para el último número de mensajes
  const lastMessagesCount = useRef(0);
  
  // Efecto para el scroll inicial al cargar
  useEffect(() => {
    const end = endRef.current;
    if (end) {
      // Hacer scroll al final cuando se monta el componente
      setTimeout(() => {
        end.scrollIntoView({ behavior: 'instant', block: 'end' });
      }, 100);
    }
  }, []);
  
  // Efecto para manejar el scroll automático solo con nuevos mensajes
  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Inicializar el contador con el número actual de mensajes
      const initialMessages = container.querySelectorAll('.group\\/message');
      lastMessagesCount.current = initialMessages.length;
      
      // Solo observamos cambios en la cantidad de mensajes
      const observer = new MutationObserver(() => {
        // Contar el número actual de mensajes
        const messages = container.querySelectorAll('.group\\/message');
        const currentMessagesCount = messages.length;
        
        // Solo hacer scroll si el número de mensajes aumentó
        if (currentMessagesCount > lastMessagesCount.current) {
          // Actualizamos el contador
          lastMessagesCount.current = currentMessagesCount;
          
          // Hacemos scroll al final solo cuando hay un mensaje nuevo
          end.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });

      // Configuramos para observar cambios en todo el árbol para detectar nuevos mensajes
      observer.observe(container, {
        childList: true,  // observar cambios en hijos
        subtree: true,    // observar cambios en todo el árbol
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return [containerRef, endRef];
}
