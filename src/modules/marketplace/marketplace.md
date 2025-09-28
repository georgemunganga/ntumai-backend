# Marketplace API Documentation

## Table of Contents
- [Home & Discovery](#home--discovery)
- [Categories & Brands](#categories--brands)
- [Product Management](#product-management)
- [Cart Management](#cart-management)
- [Checkout & Orders](#checkout--orders)
- [Promotions & Gifts](#promotions--gifts)
- [Missing Features](#missing-or-nice-to-have-features)

---

## Home & Discovery

### 18. Get Home Page Data
- **Endpoint:** `GET /api/customer/home`
- **Description:** Get data for customer home screen
- **Headers:** `tokenid: string` (required)
- **Response:**
 	{
  "banners": [
    {
      "id": "string",
      "imageUrl": "string",
      "title": "string",
      "subtitle": "string",
      "actionText": "string",
      "actionUrl": "string",
      "type": "string"
    }
  ],
  "categories": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "productCount": "number"
    }
  ],
  "trendingProducts": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "discountPercentage": "number",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "store": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "isFavorite": "boolean"
    }
  ],
  "stores": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "rating": "number",
      "productCount": "number"
    }
  ],
  "activeOrders": [  - socket for realtime async data 
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "origin": {
        "address": "string",
        "name": "string"
      },
      "destination": {
        "address": "string",
        "name": "string"
      },
      "createdAt": "string",
      "estimatedDeliveryTime": "string"
    }
  ]
}

### 19. Get Marketplace Data
- **Endpoint:** `GET /api/customer/marketplace`
- **Description:** Get data for marketplace screen
- **Response:**
 	{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "productCount": "number"
    }
  ],
  "banners": [
    {
      "id": "string",
      "imageUrl": "string",
      "title": "string",
      "subtitle": "string",
      "actionText": "string",
      "actionUrl": "string",
      "type": "string"
    }
  ],
  "trendingProducts": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "discountPercentage": "number",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "store": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "isFavorite": "boolean"
    }
  ],
  "stores": [
    {
      "id": "string",
      "name": "string",
 	"vendorid": "string",

"imageUrl": "string",
"rating": "number",
"productCount": "number"
 	
    }
  ]
}

---

## Categories & Brands

### 20. Get Categories
- **Endpoint:** `GET /api/categories`
- **Description:** Get all product categories
- **Response:**
 	{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "productCount": "number",
      "subcategories": [
        {
          "id": "string",
          "name": "string",
          "imageUrl": "string",
          "productCount": "number"
        }
      ]
    }
  ]
}

### 21. Get Category Products
- **Endpoint:** `GET /api/categories/{categoryId}/products`
- **Description:** Get products for a specific category
- **Query Parameters:**
  - `page`: number
  - `limit`: number
  - `sort`: string (price_asc, price_desc, rating, newest)
  - `filter`: string (JSON encoded filter criteria)
- **Response:**
 	{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "discountPercentage": "number",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "store": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "isFavorite": "boolean"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}

### 22. Get Brands
- **Endpoint:** `GET /api/brands`
- **Description:** Get all product brands
- **Response:**
 	{
  "brands": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "productCount": "number"
    }
  ]
}

### 23. Get Brand Products
- **Endpoint:** `GET /api/brands/{brandId}/products`
- **Description:** Get products for a specific brand
- **Query Parameters:**
  - `page`: number
  - `limit`: number
  - `sort`: string (price_asc, price_desc, rating, newest)
  - `filter`: string (JSON encoded filter criteria)
- **Response:**
 	{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "discountPercentage": "number",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "store": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "isFavorite": "boolean"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}

### 24. Search Products
- **Endpoint:** `GET /api/products/search`
- **Description:** Search for products
- **Query Parameters:**
  - `query`: string
  - `page`: number
  - `limit`: number
  - `sort`: string (price_asc, price_desc, rating, newest)
  - `filter`: string (JSON encoded filter criteria)
- **Response:
 	{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "discountPercentage": "number",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "store": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "isFavorite": "boolean"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}

---

## Product Management

### 25. Get Product Details
- **Endpoint:** `GET /api/products/{productId}`
- **Description:** Get detailed information about a product
- **Response:**
 	{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "discountedPrice": "number",
  "discountPercentage": "number",
  "images": ["string url", array IF AVAILABLE],
  "rating": "number",
  "reviewCount": "number",
  "store": {
    "id": "string",
    "name": "string",
    "imageUrl": "string",
    "rating": "number"
  },
  "category": {
    "id": "string",
    "name": "string"
  },
  "brand": {
    "id": "string",
    "name": "string"
  },
  "tags": ["string"],
  "variants": [
    {
      "id": "string",
      "name": "string",
      "options": ["string"]
    }
  ],
  "isFavorite": "boolean",
  "isInStock": "boolean",
  "stockQuantity": "number",
  "relatedProducts": [
    {
      "id": "string",
      "name": "string",
      "price": "number",
      "discountedPrice": "number",
      "imageUrl": "string",
      "isFavorite": "boolean"
    }
  ],
  "reviews": [
    {
      "id": "string",
      "user": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "rating": "number",
      "comment": "string",
      "images": ["string"],
      "createdAt": "string"
    }
  ]
}

### 26. Toggle Favorite Product
- **Endpoint:** `POST /api/customer/favorites/toggle`
- **Description:** Add or remove a product from favorites
- **Request:**
 	{
  "productId": "string"
}
- **Response:**
 	{
  "success": true,
  "isFavorite": "boolean",
  "message": "Product added to favorites"
}

### 27. Get Favorite Products
- **Endpoint:** `GET /api/customer/favorites`
- **Description:** Get all favorite products for the current user
- **Query Parameters:**
  - `page`: number
  - `limit`: number
- **Response:
 	{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "discountPercentage": "number",
      "imageUrl": "string",
      "rating": "number",
      "reviewCount": "number",
      "store": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      }
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}

---

## Cart Management

### 28. Add to Cart
- **Endpoint:** `POST /api/customer/cart/add`
- **Description:** Add a product to the cart
- **Request:
 	{
  "productId": "string",
  "quantity": "number",
  "variantOptions": {
    "size": "string",
    "color": "string"
  }
}
–	Response:
 	{
  "success": true,
  "message": "Product added to cart",
  "cart": {
    "items": [
      {
        "id": "string",
        "product": {
          "id": "string",
          "name": "string",
          "price": "number",
          "discountedPrice": "number",
          "imageUrl": "string"
        },
        "quantity": "number",
        "variantOptions": {
          "size": "string",
          "color": "string"
        },
        "subtotal": "number"
      }
    ],
    "subtotal": "number",
    "discount": "number",
    "deliveryFee": "number",
    "tax": "number",
    "total": "number",
    "itemCount": "number"
  }
}

### 29. Update Cart Item
- **Endpoint:** `PUT /api/customer/cart/items/{itemId}`
- **Description:** Update quantity of a cart item
- **Request:
 	{
  "quantity": "number"
}
–	Response:
 	{
  "success": true,
  "message": "Cart updated",
  "cart": {
    "items": [
      {
        "id": "string",
        "product": {
          "id": "string",
          "name": "string",
          "price": "number",
          "discountedPrice": "number",
          "imageUrl": "string"
        },
        "quantity": "number",
        "variantOptions": {
          "size": "string",
          "color": "string"
        },
        "subtotal": "number"
      }
    ],
    "subtotal": "number",
    "discount": "number",
    "deliveryFee": "number",
    "tax": "number",
    "total": "number",
    "itemCount": "number"
  }
}

### 30. Remove from Cart
- **Endpoint:** `DELETE /api/customer/cart/items/{itemId}`
- **Description:** Remove an item from the cart
- **Response:
 	{
  "success": true,
  "message": "Item removed from cart",
  "cart": {
    "items": [
      {
        "id": "string",
        "product": {
          "id": "string",
          "name": "string",
          "price": "number",
          "discountedPrice": "number",
          "imageUrl": "string"
        },
        "quantity": "number",
        "variantOptions": {
          "size": "string",
          "color": "string"
        },
        "subtotal": "number"
      }
    ],
    "subtotal": "number",
    "discount": "number",
    "deliveryFee": "number",
    "tax": "number",
    "total": "number",
    "itemCount": "number"
  }
}
### 31. Get Cart
- **Endpoint:** `GET /api/customer/cart`
- **Description:** Get current user's cart
- **Response:
 	{
  "items": [
    {
      "id": "string",
      "product": {
        "id": "string",
        "name": "string",
        "price": "number",
        "discountedPrice": "number",
        "imageUrl": "string",
        "store": {
          "id": "string",
          "name": "string"
        }
      },
      "quantity": "number",
      "variantOptions": {
        "size": "string",
        "color": "string"
      },
      "subtotal": "number"
    }
  ],
  "subtotal": "number",
  "discount": "number",
  "deliveryFee": "number",
  "tax": "number",
  "total": "number",
  "itemCount": "number"
}

### 32. Apply Discount Code
- **Endpoint:** `POST /api/customer/cart/apply-discount`
- **Description:** Apply a discount code to the cart
- **Request:
 	{
  "code": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Discount applied successfully",
  "discount": {
    "code": "string",
    "amount": "number",
    "type": "string" // percentage, fixed
  },
  "cart": {
    "subtotal": "number",
    "discount": "number",
    "deliveryFee": "number",
    "tax": "number",
    "total": "number"
  }
}

### 33. Remove Discount Code
- **Endpoint:** `DELETE /api/customer/cart/remove-discount`
- **Description:** Remove applied discount code from cart
- **Response:
 	{
  "success": true,
  "message": "Discount removed",
  "cart": {
    "subtotal": "number",
    "discount": "number",
    "deliveryFee": "number",
    "tax": "number",
    "total": "number"
  }
}

---

## Checkout & Orders

### 34. Calculate Delivery Fee
- **Endpoint:** `POST /api/customer/checkout/calculate-delivery`
- **Description:** Calculate delivery fee based on address
- **Request:
 	{
  "addressId": "string"
}
–	Response:
 	{
  "deliveryFee": "number",
  "estimatedDeliveryTime": "string"
}

### 35. Create Order
- **Endpoint:** `POST /api/customer/orders`
- **Description:** Create a new order
- **Request:
 	{
  "addressId": "string",
  "paymentMethod": "string", // cash_on_delivery, card, paypal
  "notes": "string",
  "discountCode": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "string",
    "trackingId": "string",
    "status": "string",
    "items": [
      {
        "product": {
          "id": "string",
          "name": "string",
          "imageUrl": "string"
        },
        "quantity": "number",
        "price": "number",
        "subtotal": "number"
      }
    ],
    "subtotal": "number",
    "discount": "number",
    "deliveryFee": "number",
    "tax": "number",
    "total": "number",
    "paymentMethod": "string",
    "paymentStatus": "string",
    "address": {
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string"
    },
    "createdAt": "string",
    "estimatedDeliveryTime": "string"
  }
}

### 36. Process Payment
- **Endpoint:** `POST /api/customer/orders/{orderId}/process-payment`
- **Description:** Process payment for an order
- **Request:
 	{
  "paymentMethod": "string",
  "paymentDetails": {
    "cardNumber": "string",
    "expiryMonth": "string",
    "expiryYear": "string",
    "cvv": "string",
    "cardHolderName": "string"
  }
}
–	Response:
 	{
  "success": true,
  "message": "Payment processed successfully",
  "paymentStatus": "string",
  "transactionId": "string"
}

### 37. Get Order Details
- **Endpoint:** `GET /api/customer/orders/{orderId}`
- **Description:** Get details of a specific order
- **Response:
 	{
  "id": "string",
  "trackingId": "string",
  "status": "string",
  "items": [
    {
      "product": {
        "id": "string",
        "name": "string",
        "imageUrl": "string"
      },
      "quantity": "number",
      "price": "number",
      "subtotal": "number"
    }
  ],
  "subtotal": "number",
  "discount": "number",
  "deliveryFee": "number",
  "tax": "number",
  "total": "number",
  "paymentMethod": "string",
  "paymentStatus": "string",
  "address": {
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string"
  },
  "notes": "string",
  "createdAt": "string",
  "estimatedDeliveryTime": "string",
  "deliveryStatus": {
    "status": "string",
    "currentLocation": {
      "latitude": "number",
      "longitude": "number"
    },
    "rider": {
      "id": "string",
      "name": "string",
      "phoneNumber": "string",
      "imageUrl": "string",
      "rating": "number"
    },
    "timeline": [
      {
        "status": "string",
        "timestamp": "string",
        "description": "string"
      }
    ]
  }
}

### 38. Get Order History
- **Endpoint:** `GET /api/customer/orders`
- **Description:** Get order history for current user
- **Query Parameters:**
  - `page`: number
  - `limit`: number
  - `status`: string (all, pending, processing, shipped, delivered, cancelled)
- **Response:
 	{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "total": "number",
      "itemCount": "number",
      "createdAt": "string",
      "estimatedDeliveryTime": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}

### 39. Track Order
- **Endpoint:** `GET /api/customer/orders/{orderId}/track`
- **Description:** Get real-time tracking information for an order
- **Response:
 	{
  "orderId": "string",
  "trackingId": "string",
  "status": "string",
  "estimatedDeliveryTime": "string",
  "currentLocation": {
    "latitude": "number",
    "longitude": "number"
  },
  "origin": {
    "address": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "destination": {
    "address": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "rider": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "imageUrl": "string",
    "rating": "number"
  },
  "timeline": [
    {
      "status": "string",
      "timestamp": "string",
      "description": "string"
    }
  ]
}

### 40. Cancel Order
- **Endpoint:** `POST /api/customer/orders/{orderId}/cancel`
- **Description:** Cancel an order
- **Request:
 	{
  "reason": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Order cancelled successfully",
  "status": "string"
}

### 41. Rate Order
- **Endpoint:** `POST /api/customer/orders/{orderId}/rate`
- **Description:** Rate an order and delivery
- **Request:
 	{
  "rating": "number",
  "comment": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Order rated successfully"
}

### 42. Rate Products
- **Endpoint:** `POST /api/customer/products/rate`
- **Description:** Rate products from an order
- **Request:
 	{
  "orderId": "string",
  "ratings": [
    {
      "productId": "string",
      "rating": "number",
      "comment": "string",
      "images": ["string"] // Base64 encoded images
    }
  ]
}
–	Response:
 	{
  "success": true,
  "message": "Products rated successfully"
}

---

## Promotions & Gifts

### 43. Get Promotions
- **Endpoint:** `GET /api/customer/promotions`
- **Description:** Get available promotions for the user
- **Query Parameters:**
  - `category`: string
- **Response:
 	{
  "promotions": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "imageUrl": "string",
      "code": "string",
      "discountType": "string", // percentage, fixed
      "discountValue": "number",
      "minimumPurchase": "number",
      "validFrom": "string",
      "validTo": "string",
      "termsAndConditions": "string",
      "category": "string"
    }
  ]
}

### 44. Create Gift Card
- **Endpoint:** `POST /api/customer/gifts`
- **Description:** Create a gift card for another user
- **Request:
 	{
  "designId": "string",
  "amount": "number",
  "recipientName": "string",
  "recipientEmail": "string",
  "recipientPhone": "string",
  "message": "string",
  "deliveryDate": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Gift card created successfully",
  "giftCard": {
    "id": "string",
    "code": "string",
    "amount": "number",
    "recipientName": "string",
    "message": "string",
    "deliveryDate": "string",
    "status": "string",
    "createdAt": "string"
  }
}

### 45. Get Gift Card Designs
- **Endpoint:** `GET /api/customer/gifts/designs`
- **Description:** Get available gift card designs
- **Response:
 	{
  "designs": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "previewUrl": "string"
    }
  ]
}

### 46. Get Gift Card History
- **Endpoint:** `GET /api/customer/gifts`
- **Description:** Get gift card history for the user
- **Response:
 	{
  "sent": [
    {
      "id": "string",
      "code": "string",
      "amount": "number",
      "recipientName": "string",
      "message": "string",
      "deliveryDate": "string",
      "status": "string",
      "createdAt": "string"
    }
  ],
  "received": [
    {
      "id": "string",
      "code": "string",
      "amount": "number",
      "senderName": "string",
      "message": "string",
      "deliveryDate": "string",
      "status": "string",
      "createdAt": "string"
    }
  ]
}


Marketplace — Missing or Nice-to-Have Features
🔍 Discovery / Browsing

Personalized Recommendations

Endpoint: GET /api/customer/recommendations

Based on user history, favorites, location, or trending in their area.

Recently Viewed Products

Useful for quick return to past browsed items.

Store Details

GET /api/stores/{storeId}

Right now, you list stores but no endpoint for full store page (opening hours, delivery options, store policies, min order value, delivery fee rules).

#### Wishlist (not just favorites)
- **Description:** Favorites are single-click, but a wishlist can be structured differently (saved for later, grouped)

### 🛍️ Product Management

#### Stock Alerts
- **Description:** "Notify me when back in stock" → endpoint for subscribing to stock notifications

#### Dynamic Pricing / Flash Sales
- **Description:** Products that change price for a limited time

#### Product Bundles / Combos
- **Description:** e.g., "Buy 1 get 1 free," "Meal deal," "Bundle discount"

### 🛒 Cart & Checkout

#### Multiple Store Cart Rules
- **Description:** Uber Eats / DoorDash often restrict carts to one store. If multi-store is allowed, you'll need cart grouping:
```json
"cart": {
  "storeId": "string",
  "items": [...]
}
```

#### Saved Carts / Multiple Carts
- **Description:** Allow customers to save a cart for later checkout

#### Tip Rider/Vendor
- **Endpoint:** `POST /api/customer/orders/{orderId}/tip`
- **Description:** At checkout or after order delivery

#### Split Payment
- **Description:** Pay part with wallet/gift card, part with card

### 🚚 Orders

#### Reorder
- **Endpoint:** `POST /api/customer/orders/{orderId}/reorder`
- **Description:** Lets customer reorder the same basket

#### Scheduled Orders
- **Description:** Place an order to be delivered later (e.g. tomorrow 6pm)

#### Order Modification
- **Description:** Cancel/edit items before preparation starts (some platforms support this)

### ⭐ Ratings & Reviews

#### Review Photos/Videos
- **Description:** You already allow images, but video is becoming common

#### Like/Dislike a Review
- **Description:** Helps surface useful reviews

### 🎁 Promotions, Gifts & Loyalty

#### Loyalty Points
- **Description:** Earn points on purchases, redeem for discounts

#### Referral Program
- **Description:** Invite friends → earn credits

#### Promo Eligibility
- **Description:** Endpoint to check if a promo is valid for user/store/product before applying

### 🔔 Notifications & Realtime

#### Push Notifications API
- **Description:** New promotions, order updates, delivery status

#### Sockets for Inventory
- **Description:** e.g., "Only 2 left in stock" → realtime sync

### ⚡ Suggested Extra Endpoints

- `GET /api/stores/{storeId}` → store detail page
- `GET /api/customer/recommendations` → personalized recommendations
- `POST /api/customer/orders/{orderId}/tip` → add tip
- `POST /api/customer/orders/{orderId}/reorder` → quick reorder
- `POST /api/customer/orders/{orderId}/schedule` → scheduled orders
- `GET /api/customer/wishlist` & `POST /api/customer/wishlist/toggle`
- `POST /api/customer/notifications/test` → notification management

---

## Additional API Considerations

*The "tiny" things that usually break customer experience later - important gaps that might have been missed in the APIs:*

### 🏪 Store / Vendor APIs

- **Store Tags / Categories** (e.g. Fast Food, Groceries, Pharmacy → for filtering)
- **Search / Filter inside store** (API for searching meals/products within one store)
- **Store Status** → not just open/closed, but also busy or preorder (restaurants often need this)
- **Vendor Policies** → return policy (shops), cancellation rules (restaurants)
- **Store Metrics** → delivery time average, order completion rate, reliability score

### 📦 Product APIs

- **Nutritional Info / Ingredients** (restaurants, optional)
- **Allergens / Restrictions** (important for food)
- **Discounts / Offers** (buy 1 get 1, percentage off)
- **Variants** (size, flavor, pack size, color → e.g. Coke 300ml vs 500ml)
- **Product Reviews & Ratings** (per product, not just store)
- **Stock Handling** (real-time "out of stock" flags, reserved qty on checkout)

### 👤 Customer / Cart APIs

- **Save for Later / Favorites** (Wishlist)
- **Recently Ordered / Reorder**
- **Custom Notes per Item** (e.g. "No onions", "Gift wrap this")
- **Cart Validation** (check if store open, stock still available, price updated)
- **Multi-Store Cart Handling** (are you allowing cross-store carts or 1 store per order?)

### ⭐ Reviews / Ratings APIs

#### Store Reviews
- Add review (rating + comment + images)
- Get all reviews (paginated)
- Summary (avg rating + counts per star)
- Product Reviews (optional but nice)

### 🛠 Vendor Control APIs (Backoffice-facing)

- Update store hours
- Pause store temporarily (holiday, restock)
- Mark items as unavailable quickly
- Promotions / featured items

### 🧭 Utility APIs

- **Geo Search** (stores/products near user's location)
- **Sort & Filter** (by rating, delivery time, price, distance)
- **Recommendation API** (popular items, bestsellers, trending meals)

### Summary of Key Missing Elements

The tiny but important things that might have been missed:

- **Variants & discounts** (product side)
- **Notes / preferences per order item** (customer side)
- **Store categories & tags** (discovery side)
- **Reviews/ratings** (trust layer)
- **Policies & metrics** (vendor side)

---

*This comprehensive marketplace documentation now covers all current API endpoints and identifies key areas for future development and enhancement.*