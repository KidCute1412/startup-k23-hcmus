import { ApprovalStatusType, GearStatusType, UserRole } from '@prisma/client';
import { CartsRepository } from './carts.repository';
import { CartsService } from './carts.service';

describe('CartsService', () => {
  const renter = {
    id: 'renter-id',
    email: 'renter@test.com',
    role: UserRole.renter,
  };
  const gear = {
    id: '30000000-0000-0000-0000-000000000001',
    lender_id: 'lender-id',
    status: GearStatusType.available,
    approval_status: ApprovalStatusType.approved,
    rent_price_per_day: 100000,
    value: 2000000,
  };
  let repository: Record<string, jest.Mock>;
  let service: CartsService;

  beforeEach(() => {
    repository = {
      getOrCreate: jest.fn(),
      findGear: jest.fn().mockResolvedValue(gear),
      hasOverlap: jest.fn().mockResolvedValue(false),
      upsertItem: jest.fn(),
      findOwnedItem: jest.fn(),
      deleteItem: jest.fn(),
      clear: jest.fn(),
    };
    service = new CartsService(repository as unknown as CartsRepository);
  });

  it('creates and maps an empty cart on first read', async () => {
    repository.getOrCreate.mockResolvedValue({
      id: 'cart-id',
      items: [],
      created_at: new Date(),
      updated_at: new Date(),
      renter_id: renter.id,
    });
    await expect(service.get(renter)).resolves.toMatchObject({
      id: 'cart-id',
      items: [],
    });
    expect(repository.getOrCreate).toHaveBeenCalledWith(renter.id);
  });

  it('rejects every cart operation for a non-renter', async () => {
    await expect(
      service.get({ ...renter, role: UserRole.admin }),
    ).rejects.toMatchObject({
      status: 403,
      response: { error: 'RENTER_ONLY' },
    });
  });

  it('rejects an invalid date range before querying gear', async () => {
    await expect(
      service.upsert(renter, gear.id, {
        startDate: '2027-08-05',
        endDate: '2027-08-01',
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_DATE_RANGE' },
    });
    expect(repository.findGear).not.toHaveBeenCalled();
  });

  it('rejects an overlapping rental period', async () => {
    repository.hasOverlap.mockResolvedValue(true);
    await expect(
      service.upsert(renter, gear.id, {
        startDate: '2027-08-01',
        endDate: '2027-08-05',
      }),
    ).rejects.toMatchObject({
      status: 409,
      response: { error: 'GEAR_UNAVAILABLE_FOR_PERIOD' },
    });
  });
});
