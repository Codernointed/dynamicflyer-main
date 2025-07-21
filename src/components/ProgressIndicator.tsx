
import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps }) => {
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
        
        {/* Completed Progress Line */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ 
            width: `${
              (steps.filter(step => step.completed).length / (steps.length - 1)) * 100
            }%` 
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute top-1/2 left-0 h-0.5 bg-foreground -translate-y-1/2 z-0"
        />
        
        {/* Steps */}
        {steps.map((step) => (
          <div
            key={step.id}
            className="z-10 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: step.id * 0.1 }}
              className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${
                step.completed
                  ? "bg-foreground text-background"
                  : step.current
                  ? "border-2 border-foreground bg-white"
                  : "border-2 border-border bg-white"
              }`}
            >
              {step.completed ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{step.id}</span>
              )}
            </motion.div>
            <span
              className={`text-xs font-medium ${
                step.current ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
