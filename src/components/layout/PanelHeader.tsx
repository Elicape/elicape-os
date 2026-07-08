import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PanelHeaderProps {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ icon: Icon, title, actions, className = '' }: PanelHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700 flex-shrink-0 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <h2 className="text-sm font-semibold text-gray-100 truncate">{title}</h2>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
