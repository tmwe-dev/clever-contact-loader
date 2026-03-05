import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ImportStepperProps {
  currentStep: number;
  steps: { label: string; description: string }[];
}

export default function ImportStepper({ currentStep, steps }: ImportStepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                className={`
                  flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold transition-colors duration-300
                  ${isDone ? 'bg-success text-success-foreground' : ''}
                  ${isActive ? 'bg-accent text-accent-foreground shadow-glow-accent' : ''}
                  ${!isDone && !isActive ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </motion.div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground hidden md:block">{step.description}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 md:w-24 h-0.5 mx-2 mt-[-20px] transition-colors duration-300 ${
                i < currentStep ? 'bg-success' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
