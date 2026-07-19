import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoryModule } from './modules/categories/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GearsModule } from './modules/gears/gears.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { RentalOrdersModule } from './modules/rental-orders/rental-orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { EscrowModule } from './modules/escrow/escrow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GearsModule,
    CategoryModule,
    WalletsModule,
    RentalOrdersModule,
    AdminModule,
    EscrowModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
