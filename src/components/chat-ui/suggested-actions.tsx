'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { memo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

interface SuggestedActionsProps {
  slug: string;
  append: UseChatHelpers['append'];
}

function PureSuggestedActions({ slug, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Herramientas disponibles',
      label: 'qué herramientas puedo usar?',
      action: 'qué herramientas puedo usar?',
    },
    {
      title: 'Chiste de Inteligencia Artificial',
      label: 'dime un chiste sobre inteligencia artificial',
      action: 'dime un chiste sobre inteligencia artificial',
    },
    {
      title: 'Calendario de Google',
      label: 'tengo algún evento en mi calendario principal?',
      action: 'dime si tengo algún evento en mi calendario principal?',
    },
    {
      title: 'Clima en Montevideo',
      label: 'cómo está el clima en Montevideo?',
      action: 'cómo está el clima en Montevideo?',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          key={`suggested-action-${suggestedAction.title}-${index}`} 
          className={index > 1 ? 'hidden sm:block' : 'block'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/client/${slug}/simulator-v2`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
