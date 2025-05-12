import { tool } from 'ai';
import { z } from 'zod';
import { getDocumentDAO } from '../../services/document-services';

export const getDocumentTool= {
    getDocument: tool({
        description: 'Devuelve la información completa de un documento a partir de su id. Los documentos pueden utilizarse para responder a las peticiones del usuario.".',
        parameters: z.object({
            docId: z.string().describe('El identificador del documento que se quiere consultar'),
        }),
        execute: async ({ docId }) => {
          const document= await obtenerDocumento(docId)
          return document
        },
    }),
}

export type DocumentResult= {
    documentId: string
    documentName: string
    documentDescription: string | null
    content: string | null
}

export async function obtenerDocumento(id: string) {
    const document= await getDocumentDAO(id)
    if (!document) return "Document not found"
    console.log(`\tgetDocument: doc: ${document.name}`)
  
    const res: DocumentResult= {
        documentId: document.id,
        documentName: document.name,
        documentDescription: document.description ?? null,
        content: document.textContent ?? null,
    }
    return res
  }
  