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
  refund = 'refund',
  deposit_deduct = 'deposit_deduct',
  no_action = 'no_action',
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
          if (dto.resolutionType !== ResolutionType.deposit_deduct) {
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
            : 'deductAmount must be a positive integer for deposit_deduct';
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
