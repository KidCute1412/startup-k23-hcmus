import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export enum GearCatalogSort {
  relevance = 'relevance',
  newest = 'newest',
  priceAsc = 'priceAsc',
  priceDesc = 'priceDesc',
  ratingDesc = 'ratingDesc',
}

@ValidatorConstraint({ name: 'validGearPriceRange', async: false })
class ValidGearPriceRange implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as GetGearsQueryDto;
    return (
      dto.minPrice === undefined ||
      dto.maxPrice === undefined ||
      dto.minPrice <= dto.maxPrice
    );
  }

  defaultMessage(): string {
    return 'minPrice must not be greater than maxPrice';
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalTrimmedString(value: unknown): unknown {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function optionalCategoryId(value: unknown): unknown {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'all' || trimmed === 'undefined')
    return undefined;
  return UUID_REGEX.test(trimmed) ? trimmed : undefined;
}

function optionalSort(value: unknown): unknown {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'default' || trimmed === 'undefined')
    return undefined;
  return Object.values(GearCatalogSort).includes(trimmed as GearCatalogSort)
    ? trimmed
    : undefined;
}

function optionalNumber(value: unknown): unknown {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

export class GetGearsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @Transform(({ value }) => optionalTrimmedString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @Transform(({ value }) => optionalCategoryId(value))
  @IsOptional()
  @IsUUID('loose')
  categoryId?: string;

  @Transform(({ value }) => optionalNumber(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Transform(({ value }) => optionalNumber(value))
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Validate(ValidGearPriceRange)
  maxPrice?: number;

  @Transform(({ value }) => optionalSort(value))
  @IsOptional()
  @IsEnum(GearCatalogSort)
  sort?: GearCatalogSort;

  get resolvedSort(): GearCatalogSort {
    return (
      this.sort ??
      (this.search ? GearCatalogSort.relevance : GearCatalogSort.newest)
    );
  }
}
