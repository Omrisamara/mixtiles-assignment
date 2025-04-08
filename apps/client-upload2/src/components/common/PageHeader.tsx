import React, { ReactNode } from 'react';
import BackButton from './BackButton';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackClick?: () => void;
  actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = true,
  backButtonLabel,
  onBackClick,
  actions,
}) => {
  return (
    <div className="mb-6">
      {showBackButton && (
        <BackButton label={backButtonLabel} onClick={onBackClick} />
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader; 