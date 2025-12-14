
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedContainer({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for smooth motion
      }}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
