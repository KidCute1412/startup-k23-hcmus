import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.usersRepository.update(id, data);
  }
}
