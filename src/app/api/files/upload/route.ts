import getSession from '@/lib/auth';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'El archivo debe ser menor a 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'El archivo debe ser una imagen JPEG o PNG',
    }),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const clientSlug = formData.get('clientSlug') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!clientSlug) {
      return NextResponse.json({ error: 'Client slug is required' }, { status: 400 });
    }


    // Sanitizar el clientSlug para evitar problemas con caracteres especiales
    const sanitizedClientSlug = clientSlug.replace(/[^a-zA-Z0-9-_]/g, '');

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      // Usar el clientSlug en la ruta para organizar por cliente
      const data = await put(`${sanitizedClientSlug}/${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      
      // Manejar específicamente el error de blob ya existente
      if (error instanceof Error && error.message.includes('This blob already exists')) {
        console.log('Blob already exists, trying to upload with random suffix');
        // Intentar con un nombre único agregando timestamp
        try {
          
          const data = await put(`${sanitizedClientSlug}/${filename}`, fileBuffer, {
            access: 'public',
            addRandomSuffix: true,
          });
          
          return NextResponse.json(data);
        } catch (retryError) {
          console.error('Error in retry upload:', retryError);
          return NextResponse.json({ error: 'Upload failed after retry' }, { status: 500 });
        }
      } else {
              console.error('Error uploading file:', error);
      }
      
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('General error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
