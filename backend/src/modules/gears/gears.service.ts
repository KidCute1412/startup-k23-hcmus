import { Injectable } from '@nestjs/common';
import { GearsRepository } from './gears.repository';

@Injectable()
export class GearsService {
  constructor(private readonly gearsRepository: GearsRepository) {}

  async create(data: any) {
    return this.gearsRepository.create(data);
  }

  async findAll() {
    return this.gearsRepository.findAll();
  }

  async findOne(id: string) {
    return this.gearsRepository.findById(id);
  }

  async update(id: string, data: any) {
    return this.gearsRepository.update(id, data);
  }

  async remove(id: string) {
    return this.gearsRepository.delete(id);
  }
}
