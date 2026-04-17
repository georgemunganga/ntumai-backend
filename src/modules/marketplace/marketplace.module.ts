import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { CatalogService } from './catalog/application/services/catalog.service';
import { CartService } from './cart/application/services/cart.service';
import { OrderService } from './orders/application/services/order.service';
import { VendorService } from './vendor/application/services/vendor.service';
import { PromotionService } from './promotions/application/services/promotion.service';
import { ReviewService } from './reviews/application/services/review.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { TrackingModule } from '../tracking/tracking.module';
import { ChatModule } from '../chat/chat.module';
// import { AuthModule } from '../auth/auth.module'; // AuthModule is imported in app.module, no need here

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    DeliveriesModule,
    TrackingModule,
    ChatModule,
  ],
  controllers: [MarketplaceController],
  providers: [
    CatalogService,
    CartService,
    OrderService,
    VendorService,
    PromotionService,
    ReviewService,
  ],
  exports: [
    CatalogService,
    CartService,
    OrderService,
    VendorService,
    PromotionService,
    ReviewService,
  ],
})
export class MarketplaceModule {}
