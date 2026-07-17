import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta?: Record<string, unknown>;
}

interface PaginatedResponse {
  data: unknown;
  meta: Record<string, unknown>;
}

function isPaginatedResponse(value: unknown): value is PaginatedResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    'data' in candidate &&
    !!candidate.meta &&
    typeof candidate.meta === 'object' &&
    !Array.isArray(candidate.meta)
  );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (isPaginatedResponse(result)) {
          return {
            success: true,
            data: result.data as T,
            meta: result.meta,
          };
        }

        return {
          success: true,
          data: result ? (result as T) : null,
        };
      }),
    );
  }
}
