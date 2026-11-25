import React from 'react';

export interface FormFieldOption {
  label: string;
  value: string;
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}) => (
  <div className="space-y-1">
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-[#0B1F3A]"
    >
      {label}
      {required && <span className="text-rose-600 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
    {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
  </div>
);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  monospace?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  monospace,
  className = '',
  ...props
}) => (
  <input
    {...props}
    className={`w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors ${
      monospace ? 'font-mono tabular-nums' : ''
    } ${className}`}
  />
);

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: FormFieldOption[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
  options,
  className = '',
  ...props
}) => (
  <select
    {...props}
    className={`w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors cursor-pointer ${className}`}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export const FormTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors ${className}`}
  />
);

interface FormActionsProps {
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save Record',
  isSubmitting = false,
}) => (
  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
    {onCancel && (
      <button
        type="button"
        onClick={onCancel}
        className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
      >
        {cancelLabel}
      </button>
    )}
    <button
      type="submit"
      disabled={isSubmitting}
      className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132E54] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
    >
      {isSubmitting ? 'Saving...' : submitLabel}
    </button>
  </div>
);

interface EnterpriseFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const EnterpriseForm: React.FC<EnterpriseFormProps> = ({
  onSubmit,
  children,
  className = '',
}) => (
  <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
    {children}
  </form>
);
