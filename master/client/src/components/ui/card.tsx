import React from "react";

export const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div
    className={`bg-black/40 border border-green-500/30 rounded-2xl shadow-lg p-6 ${className}`}
  >
    {children}
  </div>
);

export const CardContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = "", children }) => (
  <div className={`text-green-400 ${className}`}>{children}</div>
);
