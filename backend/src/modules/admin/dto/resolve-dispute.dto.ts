import {
  IsEnum,
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
          if (
            dto.resolutionType !== ResolutionType.renter_compensation &&
            dto.resolutionType !== ResolutionType.lender_compensation &&
            dto.resolutionType !== ResolutionType.deposit_deduct
          ) {
            return value === undefined;
          }
          return (
            typeof value === 'number' && Number.isInteger(value) && value > 0
          );
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as ResolveDisputeDto;
          return dto.resolutionType !== ResolutionType.deposit_deduct
            ? `deductAmount is not allowed for ${dto.resolutionType}`
            : 'deductAmount must be a positive integer for compensation settlement';
        },
      },
    });
  };
}

export class ResolveDisputeDto {
  @IsEnum(ResolutionType)
  resolutionType: ResolutionType;

  @IsValidDeductAmount()
  deductAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
