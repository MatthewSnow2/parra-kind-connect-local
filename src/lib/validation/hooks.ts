/**
 * Validation Hooks for React Forms
 *
 * Custom hooks that integrate Zod validation with React Hook Form.
 * Provides type-safe form handling with comprehensive validation.
 *
 * Security Features:
 * - Client-side validation before submission
 * - Real-time error feedback
 * - Type-safe form data
 * - Automatic sanitization
 * - Prevention of double submissions
 *
 * @module validation/hooks
 */

import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback, useState } from 'react';

/**
 * Options for useValidatedForm hook
 */
interface UseValidatedFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
}

/**
 * Enhanced form hook with Zod validation
 *
 * Wraps react-hook-form with Zod validation resolver
 *
 * @param options - Form configuration options
 * @returns React Hook Form instance with Zod validation
 *
 * @example
 * ```tsx
 * const form = useValidatedForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' }
 * });
 * ```
 */
export function useValidatedForm<T extends FieldValues>(
  options: UseValidatedFormOptions<T>
): UseFormReturn<T> {
  const { schema, defaultValues, mode = 'onSubmit', reValidateMode = 'onChange' } = options;

  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    reValidateMode,
  });
}

/**
 * Options for useSecureSubmit hook
 */
interface UseSecureSubmitOptions<T> {
  onSubmit: (data: T) => Promise<void> | void;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

/**
 * Secure form submission hook
 *
 * Prevents double submissions and handles errors gracefully
 *
 * @param options - Submit handler options
 * @returns Submit handler and loading state
 *
 * @example
 * ```tsx
 * const { handleSubmit, isSubmitting } = useSecureSubmit({
 *   onSubmit: async (data) => {
 *     await api.login(data);
 *   },
 *   onError: (error) => toast.error(error.message)
 * });
 * ```
 */
export function useSecureSubmit<T>(options: UseSecureSubmitOptions<T>) {
  const { onSubmit, onError, onSuccess } = options;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = useCallback(
    async (data: T) => {
      if (isSubmitting) {
        return; // Prevent double submission
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onSubmit(data);
        onSuccess?.(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setError(error);
        onError?.(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onSubmit, onError, onSuccess]
  );

  return {
    handleSubmit,
    isSubmitting,
    error,
  };
}

/**
 * Combined hook for validated form with secure submission
 *
 * @param options - Form and submission options
 * @returns Form instance and submit handler
 *
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useValidatedSecureForm({
 *   schema: loginSchema,
 *   defaultValues: { email: '', password: '' },
 *   onSubmit: async (data) => {
 *     await signIn(data.email, data.password);
 *   }
 * });
 *
 * <form onSubmit={form.handleSubmit(handleSubmit)}>
 *   // form fields
 * </form>
 * ```
 */
export function useValidatedSecureForm<T extends FieldValues>(
  options: UseValidatedFormOptions<T> & UseSecureSubmitOptions<T>
) {
  const { schema, defaultValues, mode, reValidateMode, onSubmit, onError, onSuccess } = options;

  const form = useValidatedForm<T>({
    schema,
    defaultValues,
    mode,
    reValidateMode,
  });

  const { handleSubmit, isSubmitting, error } = useSecureSubmit<T>({
    onSubmit,
    onError,
    onSuccess,
  });

  return {
    form,
    handleSubmit,
    isSubmitting,
    error,
  };
}

/**
 * Input sanitization hook
 *
 * Sanitizes input value on change
 *
 * @param sanitizer - Sanitization function
 * @returns Sanitized value and change handler
 *
 * @example
 * ```tsx
 * const { value, onChange } = useSanitizedInput(sanitizeText);
 *
 * <input value={value} onChange={onChange} />
 * ```
 */
export function useSanitizedInput(
  sanitizer: (value: string) => string,
  initialValue: string = ''
) {
  const [value, setValue] = useState(initialValue);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const sanitized = sanitizer(e.target.value);
      setValue(sanitized);
    },
    [sanitizer]
  );

  return {
    value,
    onChange,
    setValue: (newValue: string) => setValue(sanitizer(newValue)),
  };
}

/**
 * Field-level validation hook
 *
 * Validates a single field with Zod schema
 *
 * @param schema - Zod schema for the field
 * @param value - Current field value
 * @returns Validation error if any
 *
 * @example
 * ```tsx
 * const emailError = useFieldValidation(emailSchema, email);
 *
 * {emailError && <span>{emailError}</span>}
 * ```
 */
export function useFieldValidation<T>(schema: z.ZodSchema<T>, value: unknown): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.errors[0]?.message || 'Invalid input';
}

/**
 * Debounced validation hook
 *
 * Validates input with a debounce delay
 *
 * @param schema - Zod schema
 * @param value - Value to validate
 * @param delay - Debounce delay in ms
 * @returns Validation error if any
 *
 * @example
 * ```tsx
 * const emailError = useDebouncedValidation(emailSchema, email, 500);
 * ```
 */
export function useDebouncedValidation<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  delay: number = 300
): string | null {
  const [error, setError] = useState<string | null>(null);

  useCallback(() => {
    const timer = setTimeout(() => {
      const result = schema.safeParse(value);
      setError(result.success ? null : result.error.errors[0]?.message || 'Invalid input');
    }, delay);

    return () => clearTimeout(timer);
  }, [schema, value, delay]);

  return error;
}

/**
 * Multi-step form validation hook
 *
 * Manages validation across multiple form steps
 *
 * @param schemas - Array of Zod schemas for each step
 * @returns Current step, validation, and navigation functions
 *
 * @example
 * ```tsx
 * const { currentStep, goToNextStep, goToPreviousStep, validateStep } =
 *   useMultiStepValidation([step1Schema, step2Schema, step3Schema]);
 * ```
 */
export function useMultiStepValidation<T extends FieldValues>(schemas: z.ZodSchema<any>[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<number, any>>({});

  const validateStep = useCallback(
    (data: any): boolean => {
      const schema = schemas[currentStep];
      if (!schema) return true;

      const result = schema.safeParse(data);
      if (result.success) {
        setStepData((prev) => ({ ...prev, [currentStep]: data }));
        return true;
      }
      return false;
    },
    [currentStep, schemas]
  );

  const goToNextStep = useCallback(() => {
    if (currentStep < schemas.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, schemas.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setStepData({});
  }, []);

  const getAllData = useCallback(() => {
    return Object.values(stepData).reduce((acc, data) => ({ ...acc, ...data }), {});
  }, [stepData]);

  return {
    currentStep,
    totalSteps: schemas.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === schemas.length - 1,
    validateStep,
    goToNextStep,
    goToPreviousStep,
    reset,
    getAllData,
    stepData,
  };
}

/**
 * Real-time validation hook
 *
 * Validates input in real-time as user types
 *
 * @param schema - Zod schema
 * @returns Validation state and handlers
 *
 * @example
 * ```tsx
 * const { value, error, onChange, isValid } =
 *   useRealTimeValidation(emailSchema);
 * ```
 */
export function useRealTimeValidation<T>(schema: z.ZodSchema<T>, initialValue: any = '') {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    (val: any) => {
      const result = schema.safeParse(val);
      if (result.success) {
        setError(null);
        return true;
      } else {
        setError(result.error.errors[0]?.message || 'Invalid input');
        return false;
      }
    },
    [schema]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      if (touched) {
        validate(newValue);
      }
    },
    [touched, validate]
  );

  const onBlur = useCallback(() => {
    setTouched(true);
    validate(value);
  }, [value, validate]);

  return {
    value,
    error: touched ? error : null,
    onChange,
    onBlur,
    isValid: error === null,
    touched,
    setValue: (newValue: any) => {
      setValue(newValue);
      if (touched) validate(newValue);
    },
  };
}

/**
 * Form dirty state hook
 *
 * Tracks if form has unsaved changes
 *
 * @param form - React Hook Form instance
 * @returns Whether form has unsaved changes
 */
export function useFormDirty<T extends FieldValues>(form: UseFormReturn<T>): boolean {
  return form.formState.isDirty;
}

/**
 * Unsaved changes warning hook
 *
 * Warns user before leaving page with unsaved changes
 *
 * @param isDirty - Whether form has unsaved changes
 * @param message - Warning message
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) {
  useCallback(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
}

/**
 * Validation error formatter hook
 *
 * Formats Zod errors for display
 *
 * @param errors - Zod validation errors
 * @returns Formatted error messages
 */
export function useFormattedErrors(errors: z.ZodError | null): Record<string, string> {
  if (!errors) return {};

  const formatted: Record<string, string> = {};

  for (const error of errors.errors) {
    const path = error.path.join('.');
    formatted[path] = error.message;
  }

  return formatted;
}
