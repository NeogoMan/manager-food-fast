import React from 'react';

const SettingsSection = ({ title, description, icon, children }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        {icon && <span className="text-orange-600 dark:text-orange-500">{icon}</span>}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
