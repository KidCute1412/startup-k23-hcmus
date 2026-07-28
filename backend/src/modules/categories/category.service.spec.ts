import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  it('maps parent_id to parentId for public category output', async () => {
    const repository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'child',
          parent_id: 'parent',
          name: 'Child',
          slug: 'child',
          description: null,
        },
      ]),
    } as unknown as CategoryRepository;
    await expect(new CategoryService(repository).findAll()).resolves.toEqual([
      {
        id: 'child',
        parentId: 'parent',
        name: 'Child',
        slug: 'child',
        description: null,
      },
    ]);
  });
});
