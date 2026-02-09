import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  options: { label: string; value: string }[];
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  placeholder = 'Select an option',
  options,
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-slate-300 hover:shadow-sm',
          className
        )}
        disabled={disabled}
      >
        <span className={cn('block truncate', !selectedOption && 'text-slate-500')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className='absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'>
          <div className='p-1'>
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-150',
                  option.value === value && 'bg-slate-100'
                )}
              >
                {option.value === value && (
                  <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
                    <Check className='h-4 w-4' />
                  </span>
                )}
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
