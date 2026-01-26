import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

/**
 * Structured validation error response
 */
export interface ValidationErrorResponse {
  error: string;
  validationErrors: {
    field: string;
    message: string;
  }[];
  timestamp: string;
}

/**
 * Format Zod validation errors into a structured response
 */
export function formatValidationErrors(error: ZodError): ValidationErrorResponse {
  return {
    error: 'Validation failed',
    validationErrors: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate request body against a Zod schema and return structured errors
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or null if validation fails
 *
 * Usage:
 *   const result = await validateRequest(ProjectSchema, payload);
 *   if (!result.success) {
 *     return result.error; // NextResponse with validation errors
 *   }
 *   const validatedData = result.data;
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<
  | { success: true; data: T }
  | { success: false; error: NextResponse<ValidationErrorResponse> }
> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      // Log validation errors for debugging
      console.error('[Validation Error]', {
        timestamp: new Date().toISOString(),
        errors: error.errors,
        data: JSON.stringify(data, null, 2),
      });

      const response = formatValidationErrors(error);
      return {
        success: false,
        error: NextResponse.json(response, { status: 400 }),
      };
    }

    // Unknown error during validation
    console.error('[Validation Error - Unknown]', error);
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Validation failed with unknown error',
          validationErrors: [],
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Create validation error response helper
 * For use in catch blocks when validation fails unexpectedly
 */
export function createValidationErrorResponse(
  message: string,
  field?: string
): NextResponse<ValidationErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      validationErrors: field ? [{ field, message }] : [],
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

