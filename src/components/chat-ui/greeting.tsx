import { motion } from 'framer-motion';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto px-8 w-full flex flex-col items-center justify-center text-center"
    >
      <motion.div
        className="text-2xl font-semibold"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Bienvenido a <span className="text-shock-color font-bold">Asistime.ai</span>
      </motion.div>
      <motion.div
        className="text-2xl text-zinc-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}        
      >
        Cómo puedo ayudarte hoy?
      </motion.div>
    </div>
  );
};
