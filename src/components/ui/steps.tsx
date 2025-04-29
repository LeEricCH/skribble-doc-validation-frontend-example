import React from "react";
import { cn } from "@/lib/utils";

type StepsProps = {
  value: number;
  children: React.ReactNode;
  className?: string;
};

const Steps = ({ value, children, className }: StepsProps) => {
  const childArray = React.Children.toArray(children);
  const steps = childArray.filter(
    (child) => React.isValidElement(child) && child.type === Step
  );

  return (
    <div className={cn("flex items-start", className)}>
      {steps.map((step, index) => {
        if (!React.isValidElement(step)) return null;

        const isActive = index === value;
        const isCompleted = index < value;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            {React.cloneElement(step, {
              isActive,
              isCompleted,
              stepNumber: index + 1,
              ...step.props,
            })}
            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-[2px] mt-4 mx-2",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

type StepProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  stepNumber?: number;
  className?: string;
};

const Step = ({
  title,
  description,
  icon,
  isActive = false,
  isCompleted = false,
  stepNumber,
  className,
}: StepProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        isActive && "text-primary",
        !isActive && !isCompleted && "text-muted-foreground",
        className
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2",
          isActive
            ? "border-primary bg-background text-primary"
            : isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground bg-background text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : icon ? (
          icon
        ) : (
          <span className="text-sm">{stepNumber}</span>
        )}
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div
            className={cn(
              "text-xs",
              isActive
                ? "text-muted-foreground"
                : "text-muted-foreground/60"
            )}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

export { Steps, Step }; 