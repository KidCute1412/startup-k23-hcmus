import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { CategoryModule } from './modules/categories/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GearsModule } from './modules/gears/gears.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { RentalOrdersModule } from './modules/rental-orders/rental-orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { CsrfOriginMiddleware } from './common/middleware/csrf-origin.middleware';
import { MediaModule } from './modules/media/media.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { CreditLimitsModule } from './modules/credit-limits/credit-limits.module';
import { CartsModule } from './modules/carts/carts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Resolve the backend .env even when the app is started from the repo root.
      envFilePath: [
        resolve(__dirname, '../.env'),
        resolve(process.cwd(), '.env'),
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GearsModule,
    CategoryModule,
    WalletsModule,
    RentalOrdersModule,
    MediaModule,
    AdminModule,
    EscrowModule,
    DisputesModule,
    CreditLimitsModule,
    CartsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfOriginMiddleware).forRoutes('*');
  }
}
