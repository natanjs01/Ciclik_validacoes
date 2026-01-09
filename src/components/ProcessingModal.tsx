import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Package, QrCode } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  stage: 'scanning' | 'validating' | 'fetching' | 'complete';
  itemCount?: number;
}

export function ProcessingModal({ isOpen, stage, itemCount = 0 }: ProcessingModalProps) {
  const stages = [
    {
      id: 'scanning',
      label: 'Lendo QR Code',
      icon: QrCode,
      description: 'Decodificando informações...'
    },
    {
      id: 'validating',
      label: 'Validando Nota',
      icon: CheckCircle2,
      description: 'Verificando autenticidade...'
    },
    {
      id: 'fetching',
      label: 'Buscando Itens',
      icon: Package,
      description: itemCount > 0 ? `${itemCount} produtos encontrados` : 'Carregando produtos...'
    }
  ];

  const getCurrentStageIndex = () => {
    const index = stages.findIndex(s => s.id === stage);
    return index === -1 ? 0 : index;
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Processando Nota Fiscal
              </h2>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto processamos os dados...
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              {stages.map((stageItem, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const Icon = stageItem.icon;

                return (
                  <motion.div
                    key={stageItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-primary/10 border-2 border-primary'
                        : isCompleted
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-muted/30 border border-transparent'
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
                        >
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </motion.div>
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </motion.div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm mb-1 ${
                          isCurrent
                            ? 'text-primary'
                            : isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stageItem.label}
                      </h3>
                      <p
                        className={`text-xs ${
                          isCurrent ? 'text-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {stageItem.description}
                      </p>
                    </div>

                    {/* Loading indicator for current stage */}
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-shrink-0"
                      >
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                              className="w-1.5 h-1.5 rounded-full bg-primary"
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Este processo pode levar alguns segundos...
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
