'use client';

interface TextAreaProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function TextArea({
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  rows = 4,
  maxLength,
  className = '',
}: TextAreaProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 
          bg-white/5 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          resize-y
          ${error ? 'border-red-500' : 'border-white/10'}
        `}
      />
      <div className="flex justify-between text-xs text-gray-400">
        {error && <span className="text-red-400">{error}</span>}
        {maxLength && (
          <span className="ml-auto">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
