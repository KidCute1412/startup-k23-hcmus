import { GearsRepository } from './gears.repository';
import { GearsService } from './gears.service';

describe('GearsService', () => {
  const findMine = jest.fn();
  const repository = {
    findMine,
  } as unknown as GearsRepository;
  const service = new GearsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns every gear state scoped to the authenticated lender', async () => {
    const gears = [
      { id: 'pending', approval_status: 'pending', status: 'available' },
      { id: 'rejected', approval_status: 'rejected', status: 'available' },
      { id: 'delisted', approval_status: 'approved', status: 'delisted' },
    ];
    findMine.mockResolvedValue({
      data: gears as never,
      total: 3,
    });

    await expect(service.findMine('lender-id', 1, 2)).resolves.toEqual({
      data: gears,
      meta: { total: 3, page: 1, limit: 2, totalPages: 2 },
    });
    expect(findMine).toHaveBeenCalledWith({
      lenderId: 'lender-id',
      page: 1,
      limit: 2,
    });
  });
});
