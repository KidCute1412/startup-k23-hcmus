import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export enum ResolutionType {
  renter_compensation = 'renter_compensation',
  lender_compensation = 'lender_compensation',
  no_action = 'no_action',
  /** @deprecated Use renter_compensation. Kept for persisted dispute records. */
  refund = 'refund',
  /** @deprecated Use lender_compensation. Kept for persisted dispute records. */
  deposit_deduct = 'deposit_deduct',
}

const REQUEST_RESOLUTION_TYPES = [
  ResolutionType.renter_compensation,
  ResolutionType.lender_compensation,
  ResolutionType.no_action,
] as const;

function IsValidDeductAmount(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidDeductAmount',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const dto = args.object as ResolveDisputeDto;
          if (!REQUEST_RESOLUTION_TYPES.includes(dto.resolutionType)) {
            return true;
          }
          if (dto.resolutionType === ResolutionType.no_action) {
            return value === undefined;
          }
          return (
            typeof value === 'number' && Number.isInteger(value) && value > 0
          );
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as ResolveDisputeDto;
          return dto.resolutionType === ResolutionType.no_action
            ? `deductAmount is not allowed for ${dto.resolutionType}`
            : 'deductAmount must be a positive integer for compensation settlement';
        },
      },
    });
  };
}

export class ResolveDisputeDto {
  @IsIn(REQUEST_RESOLUTION_TYPES)
  resolutionType: ResolutionType;

  @IsValidDeductAmount()
  deductAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
