"use client";

import * as React from "react";
import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) => {
  const baseStyles = "font-medium rounded-md transition-colors flex justify-center items-center";
  
  const variantStyles = {
    primary: "bg-button-blue text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "border border-gray-300 text-gray-800 hover:bg-gray-100",
    text: "text-blue-500 hover:bg-gray-100"
  };
  
  const sizeStyles = {
    sm: "text-sm py-1.5 px-3",
    md: "text-base py-2.5 px-5",
    lg: "text-lg py-3 px-6"
  };
  
  const buttonClasses = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${fullWidth ? "w-full" : ""}
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    ${className}
  `;

  if (href && !disabled) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button; 