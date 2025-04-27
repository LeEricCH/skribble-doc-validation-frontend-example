import React from "react";

type ProgressBarProps = {
  value: number;
  max?: number;
  color?: "primary" | "success" | "warning" | "error";
  className?: string;
};

const ProgressBar = ({
  value,
  max = 100,
  color = "primary",
  className = "",
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorStyles = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${colorStyles[color]}`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        tabIndex={0}
      />
    </div>
  );
};

export default ProgressBar; 