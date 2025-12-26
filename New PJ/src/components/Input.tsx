'use client';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'password';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  className = '',
}: InputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-3 
          bg-white/5 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          ${error ? 'border-red-500' : 'border-white/10'}
        `}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
