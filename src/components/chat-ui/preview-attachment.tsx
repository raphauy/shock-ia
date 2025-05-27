import type { Attachment } from 'ai';
import { LoaderIcon } from 'lucide-react';
import Image from 'next/image';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;
  
  // Extraer solo la parte del nombre después de la última barra "/"
  const displayName = name?.includes('/') 
    ? name.substring(name.lastIndexOf('/') + 1) 
    : name;

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
        {contentType ? (
          contentType.startsWith('image') ? (
            <Image
              src={url}
              alt={displayName ?? 'An image attachment'}
              fill
              sizes="(max-width: 80px) 100vw, 80px"
              className="rounded-md object-cover"
              priority={false}
            />
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-zinc-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-600 max-w-20 truncate">{displayName}</div>
    </div>
  );
};
