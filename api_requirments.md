Ntumai Delivery App - API Requirements
Introduction
This document outlines the comprehensive list of APIs required from the backend development team to support the Ntumai Delivery App. The APIs are organized by user role and app section to provide a clear understanding of the data flows and functionality needed to support the mobile application.

Notes:
Kindly note that everything except auth will need the "tokenID": "string",
Riders or vendors all rights to access consumers features as long as they switch roles
Vendors can also choose to request for riders registration by registration and approval (how you want to implement this policy upto you - (ntumai staff)

Authentication APIs
User Authentication
1.	Register User
–	Endpoint: POST /api/auth/register
–	Description: Register a new user with phone number or email : either one of them is  required.  Ui reference pill switch signup with email or phone number
–	Request:
 	{
  "phoneNumber": "string", -required;
 	  "email": "string", -required
  "countryCode": "string", -required
 	
  "deviceId": "string", (if you are recording analytics)
  "deviceType": "string" (if you are recording analytics)

}
–	Response:
 	{
  "success": true,
  "message": "OTP sent successfully",
  "requestId": "string"
}
 	- this will create draft user for onboarding user



2.	Verify OTP
–	Endpoint: POST /api/auth/verify-otp
–	Description: Verify the OTP sent to user’s phone or email : AT LOGIN page OR REREGISTRATION page for new role. Eg want to become a driver from a customer role.
–	Request:
 	{
  "phoneNumber": "string", (should expect full phone with country code concatinated)
 	or
 	"email": "string",


    "otp": "string",
  "requestId": "string" optional if security is not needed now.
}
–	Response:
 	{
  "success": true,
  "isNewUser": true,
  "token": "string" // Only for existing users
}
3.	Complete Registration
–	Endpoint: POST /api/auth/complete-registration
–	Description: Complete user registration after OTP verification
–	Request:
 	{
  "tokenID": "string",

  "password": "string",
  either "phone": "string" or "email": "string" for redentification,
  "userType": "string" // customer, rider, seller
}
–	Response:
 	{
  "success": true,
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "email": "string",
    "userType": "string",
    "createdAt": "string"
  }
}
4.	Login
–	Endpoint: POST /api/auth/login
–	Description: Authenticate user with phone number and password
–	Request:
 	{
  "phoneNumber": "string",
  "countryCode": "string",
 	or
  "email": "string",
 	  "otp": "string",
  "deviceId": "string",
  "deviceType": "string"
}
–	Response:
 	{
  "success": true,
  "tokenid": "string",
  "user": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "email": "string",
    "userType": "string",
    "createdAt": "string"
  }
}
5.	Social Login – please kindly ignore for now save us time
–	Endpoint: POST /api/auth/social-login
–	Description: Authenticate user with social media credentials
–	Request:
 	{
  "provider": "string", // google, facebook, apple
  "token": "string",
  "deviceId": "string",
  "deviceType": "string"
}
–	Response:
 	{
  "success": true,
  "token": "string",
  "isNewUser": false,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "userType": "string",
    "createdAt": "string"
  }
}
6.	Forgot Password
–	Endpoint: POST /api/auth/forgot-password
–	Description: Initiate password reset process
–	Request:
 	{
  "phoneNumber": "string",
  "countryCode": "string"
 	or 
 	  "email": "string",
}
–	Response:
 	{
  "success": true,
  "message": "OTP sent successfully",
  "requestId": "string"
}
7.	Reset Password
–	Endpoint: POST /api/auth/reset-password
–	Description: Reset password after OTP verification
–	Request:
 	{
  "phoneNumber": "string" or "email": "string",
 	
  "countryCode": "string",
  "otp": "string",
  "newPassword": "string",
  "requestId": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Password reset successfully"
}
8.	Refresh Token
–	Endpoint: POST /api/auth/refresh-token
–	Description: Get a new access token using refresh token
–	Request:
 	{
  "refreshToken": "string"
}
–	Response:
 	{
  "success": true,
  "token": "string",
  "refreshToken": "string"
}
9.	Logout
–	Endpoint: POST /api/auth/logout
–	Description: Invalidate user’s current session
–	Request:
 	{
  "deviceId": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Logged out successfully"
}
User Profile APIs
Profile Management
10.	Get User Profile
–	Endpoint: GET /api/users/profile
–	Description: Get current user’s profile information
–	Response:
 	{
  "id": "string",
  "name": "string",
  "phoneNumber": "string",
  "email": "string",
  "profileImage": "string",
  "userType": "string",
  "addresses": [
    {
      "id": "string",
      "type": "string", // home, work, other
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "isDefault": "boolean"
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}
11.	Update User Profile
–	Endpoint: PUT /api/users/profile
–	Description: Update user profile information
–	Request:
 	{
  "name": "string",
  "email": "string",
  "profileImage": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "email": "string",
    "profileImage": "string",
    "userType": "string",
    "updatedAt": "string"
  }
}
12.	Change Password
–	Endpoint: PUT /api/users/change-password
–	Description: Change user’s password
–	Request:
 	{	"tokenid": "string",
  "currentPassword": "string",
  "newPassword": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Password changed successfully"
}
13.	Upload Profile Image  (if you are using a cdn bucket kindly provide image url)
–	Endpoint: POST /api/users/upload-profile-image
–	Description: Upload user profile image
–	Request: Multipart form data with image file
–	Response:
 	{
  "success": true,
  "imageUrl": "string"
}
Address Management
14.	Add Address – user can have as many addresses as they wish to save
–	Endpoint: POST /api/users/addresses
–	Description: Add a new address for the user (kindly add to users list)
–	Request:
 	{ "tokenid": "string",
  "type": "string", // home, work, other
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "isDefault": "boolean"
}
–	Response:
 	{
  "success": true,
  "address": {
    "id": "string",
    "type": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "isDefault": "boolean",
    "createdAt": "string"
  }
}
15.	Update Address
–	Endpoint: PUT /api/users/addresses/{addressId}
–	Description: Update an existing address
–	Request:
 	{ "tokenid": "string",
  "type": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "isDefault": "boolean"
}
–	Response:
 	{
  "success": true,
  "message": "Address updated successfully",
  "address": {
    "id": "string",
    "type": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "latitude": "number",
    "longitude": "number",
    "isDefault": "boolean",
    "updatedAt": "string"
  }
}
16.	Delete Address
–	Endpoint: DELETE /api/users/addresses/{addressId}
–	"tokenid": "string" required,
–	Description: Delete an address
–	Response:
 	{
  "success": true,
  "message": "Address deleted successfully"
}
17.	Get All Addresses 
–	Endpoint: GET /api/users/addresses
–	"tokenid": "string" required,
–	Description: Get all addresses for the current user
–	Response:
 	{
  "addresses": [
    {
      "id": "string",
      "type": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "isDefault": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
Customer APIs
Marketplace
18.	Get Home Page Data
–	Endpoint: GET /api/customer/home
–	Description: Get data for customer home screen
–	"tokenid": "string" required,
–	Response:
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
19.	Get Marketplace Data
–	Endpoint: GET /api/customer/marketplace
–	
–	Description: Get data for marketplace screen
–	Response:
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
20.	Get Categories
–	Endpoint: GET /api/categories
–	Description: Get all product categories
–	Response:
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
21.	Get Category Products
–	Endpoint: GET /api/categories/{categoryId}/products
–	Description: Get products for a specific category
–	Query Parameters:
•	page: number
•	limit: number
•	sort: string (price_asc, price_desc, rating, newest)
•	filter: string (JSON encoded filter criteria)
–	Response:
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
22.	Get Brands
–	Endpoint: GET /api/brands
–	Description: Get all product brands
–	Response:
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
23.	Get Brand Products
–	Endpoint: GET /api/brands/{brandId}/products
–	Description: Get products for a specific brand
–	Query Parameters:
•	page: number
•	limit: number
•	sort: string (price_asc, price_desc, rating, newest)
•	filter: string (JSON encoded filter criteria)
–	Response:
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
24.	Search Products
–	Endpoint: GET /api/products/search
–	Description: Search for products
–	Query Parameters:
•	query: string
•	page: number
•	limit: number
•	sort: string (price_asc, price_desc, rating, newest)
•	filter: string (JSON encoded filter criteria)
–	Response:
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
Product Management
25.	Get Product Details
–	Endpoint: GET /api/products/{productId}
–	Description: Get detailed information about a product
–	Response:
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
26.	Toggle Favorite Product
–	Endpoint: POST /api/customer/favorites/toggle
–	Description: Add or remove a product from favorites
–	Request:
 	{
  "productId": "string"
}
–	Response:
 	{
  "success": true,
  "isFavorite": "boolean",
  "message": "Product added to favorites"
}
27.	Get Favorite Products
–	Endpoint: GET /api/customer/favorites
–	Description: Get all favorite products for the current user
–	Query Parameters:
•	page: number
•	limit: number
–	Response:
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
Cart Management
28.	Add to Cart
–	Endpoint: POST /api/customer/cart/add
–	Description: Add a product to the cart
–	Request:
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
29.	Update Cart Item
–	Endpoint: PUT /api/customer/cart/items/{itemId}
–	Description: Update quantity of a cart item
–	Request:
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
30.	Remove from Cart
–	Endpoint: DELETE /api/customer/cart/items/{itemId}
–	Description: Remove an item from the cart
–	Response:
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
31.	Get Cart
–	Endpoint: GET /api/customer/cart
–	Description: Get current user’s cart
–	Response:
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
32.	Apply Discount Code
–	Endpoint: POST /api/customer/cart/apply-discount
–	Description: Apply a discount code to the cart
–	Request:
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
33.	Remove Discount Code
–	Endpoint: DELETE /api/customer/cart/remove-discount
–	Description: Remove applied discount code from cart
–	Response:
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
Checkout and Orders
34.	Calculate Delivery Fee
–	Endpoint: POST /api/customer/checkout/calculate-delivery
–	Description: Calculate delivery fee based on address
–	Request:
 	{
  "addressId": "string"
}
–	Response:
 	{
  "deliveryFee": "number",
  "estimatedDeliveryTime": "string"
}
35.	Create Order
–	Endpoint: POST /api/customer/orders
–	Description: Create a new order
–	Request:
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
36.	Process Payment
–	Endpoint: POST /api/customer/orders/{orderId}/process-payment
–	Description: Process payment for an order
–	Request:
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
37.	Get Order Details
–	Endpoint: GET /api/customer/orders/{orderId}
–	Description: Get details of a specific order
–	Response:
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
38.	Get Order History
–	Endpoint: GET /api/customer/orders
–	Description: Get order history for current user
–	Query Parameters:
•	page: number
•	limit: number
•	status: string (all, pending, processing, shipped, delivered, cancelled)
–	Response:
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
39.	Track Order
–	Endpoint: GET /api/customer/orders/{orderId}/track
–	Description: Get real-time tracking information for an order
–	Response:
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
40.	Cancel Order
–	Endpoint: POST /api/customer/orders/{orderId}/cancel
–	Description: Cancel an order
–	Request:
 	{
  "reason": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Order cancelled successfully",
  "status": "string"
}
41.	Rate Order
–	Endpoint: POST /api/customer/orders/{orderId}/rate
–	Description: Rate an order and delivery
–	Request:
 	{
  "rating": "number",
  "comment": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Order rated successfully"
}
42.	Rate Products
–	Endpoint: POST /api/customer/products/rate
–	Description: Rate products from an order
–	Request:
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
Promotions and Gifts
43.	Get Promotions
–	Endpoint: GET /api/customer/promotions
–	Description: Get available promotions for the user
–	Query Parameters:
•	category: string
–	Response:
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
44.	Create Gift Card
–	Endpoint: POST /api/customer/gifts
–	Description: Create a gift card for another user
–	Request:
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
45.	Get Gift Card Designs
–	Endpoint: GET /api/customer/gifts/designs
–	Description: Get available gift card designs
–	Response:
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
46.	Get Gift Card History
–	Endpoint: GET /api/customer/gifts
–	Description: Get gift card history for the user
–	Response:
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
Rider APIs  - again please don’t forget tokenId
Rider Dashboard
47.	Get Rider Dashboard Data
–	Endpoint: GET /api/rider/dashboard
–	Description: Get data for rider dashboard
–	Response:
 	{
  "status": "string", // online, offline (simulates them being for orders)
 	 "todayEarnings": "number",
  "weeklyEarnings": "number",
  "completedOrders": "number",
  "acceptanceRate": "number",
  "rating": "number",
  "activeOrders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number",
      "createdAt": "string"
    }
  ],
  "nearbyOrders": [
    {
      "id": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number",
      "expiresAt": "string"
    }
  ]
}
48.	Update Rider Status
–	Endpoint: PUT /api/rider/status
–	Description: Update rider’s online/offline status
–	Request:
 	{
  "status": "string" // online, offline
}
–	Response:
 	{
  "success": true,
  "message": "Status updated successfully",
  "status": "string"
}
49.	Update Rider Location
–	Endpoint: PUT/POST /api/rider/location  (sockets for tracking)
–	Description: Update rider’s current location
–	Request:
 	{
  "latitude": "number",
  "longitude": "number"
}
–	Response:
 	{
  "success": true,
  "message": "Location updated successfully"
}
Order Management for Riders
50.	Get Available Orders
–	Endpoint: GET /api/rider/orders/available
–	Description: Get orders available for pickup
–	Response:
 	{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number",
      "expiresAt": "string"
    }
  ]
}
51.	Accept Order
–	Endpoint: POST /api/rider/orders/{orderId}/accept
–	Description: Accept an available order
–	Response:
 	{
  "success": true,
  "message": "Order accepted successfully",
  "order": {
    "id": "string",
    "trackingId": "string",
    "status": "string",
    "pickupAddress": {
      "address": "string",
      "latitude": "number",
      "longitude": "number"
    },
    "deliveryAddress": {
      "address": "string",
      "latitude": "number",
      "longitude": "number"
    },
    "customer": {
      "name": "string",
      "phoneNumber": "string"
    },
    "items": [
      {
        "name": "string",
        "quantity": "number"
      }
    ],
    "distance": "number",
    "estimatedTime": "string",
    "earnings": "number"
  }
}
52.	Reject Order
–	Endpoint: POST /api/rider/orders/{orderId}/reject
–	Description: Reject an available order
–	Request:
 	{
  "reason": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Order rejected successfully"
}
53.	Get Rider’s Active Orders
–	Endpoint: GET /api/rider/orders/active
–	Description: Get orders currently assigned to the rider
–	Response:
 	{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "customer": {
        "name": "string",
        "phoneNumber": "string"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number"
    }
  ]
}
54.	Get Rider’s Order History
–	Endpoint: GET /api/rider/orders/history
–	Description: Get completed orders history
–	Query Parameters:
•	page: number
•	limit: number
•	startDate: string
•	endDate: string
–	Response:
 	{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "pickupAddress": {
        "address": "string"
      },
      "deliveryAddress": {
        "address": "string"
      },
      "distance": "number",
      "earnings": "number",
      "completedAt": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
55.	Update Order Status
–	Endpoint: PUT /api/rider/orders/{orderId}/status
–	Description: Update the status of an order
–	Request:
 	{
  "status": "string", // arrived_at_pickup, picked_up, in_transit, arrived_at_delivery, delivered
  "latitude": "number",
  "longitude": "number"
}
–	Response:
 	{
  "success": true,
  "message": "Order status updated successfully",
  "status": "string"
}
56.	Get Order Route
–	Endpoint: GET /api/rider/orders/{orderId}/route
–	Description: Get optimized route for order delivery
–	Response:
 	{
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
  "distance": "number",
  "duration": "number",
  "polyline": "string",
  "steps": [
    {
      "instruction": "string",
      "distance": "number",
      "duration": "number",
      "startLocation": {
        "latitude": "number",
        "longitude": "number"
      },
      "endLocation": {
        "latitude": "number",
        "longitude": "number"
      },
      "maneuver": "string"
    }
  ]
}
Earnings and Reports
57.	Get Rider Earnings
–	Endpoint: GET /api/rider/earnings
–	Description: Get rider earnings data
–	Query Parameters:
•	period: string (daily, weekly, monthly)
•	startDate: string
•	endDate: string
–	Response:
 	{
  "summary": {
    "totalEarnings": "number",
    "deliveryEarnings": "number",
    "bonusEarnings": "number",
    "tips": "number",
    "totalOrders": "number",
    "totalDistance": "number"
  },
  "breakdown": [
    {
      "date": "string",
      "earnings": "number",
      "orders": "number"
    }
  ],
  "transactions": [
    {
      "id": "string",
      "orderId": "string",
      "trackingId": "string",
      "amount": "number",
      "type": "string", // delivery, bonus, tip
      "status": "string",
      "createdAt": "string"
    }
  ]
}
58.	Get Rider Performance
–	Endpoint: GET /api/rider/performance
–	Description: Get rider performance metrics
–	Query Parameters:
•	period: string (weekly, monthly)
–	Response:
 	{
  "rating": "number",
  "acceptanceRate": "number",
  "completionRate": "number",
  "averageDeliveryTime": "number",
  "totalOrders": "number",
  "totalDistance": "number",
  "customerFeedback": [
    {
      "rating": "number",
      "comment": "string",
      "date": "string"
    }
  ],
  "improvements": [
    {
      "metric": "string",
      "current": "number",
      "target": "number",
      "suggestion": "string"
    }
  ]
}
Seller APIs
Seller Dashboard
59.	Get Seller Dashboard Data
–	Endpoint: GET /api/seller/dashboard
–	Description: Get data for seller dashboard
–	Response:
 	{
  "summary": {
    "totalSales": "number",
    "totalOrders": "number",
    "averageOrderValue": "number",
    "productViews": "number",
    "conversionRate": "number"
  },
  "salesChart": [
    {
      "date": "string",
      "sales": "number"
    }
  ],
  "recentOrders": [
    {
      "id": "string",
      "trackingId": "string",
      "customer": {
        "name": "string"
      },
      "total": "number",
      "status": "string",
      "createdAt": "string"
    }
  ],
  "topProducts": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "sales": "number",
      "stock": "number"
    }
  ],
  "lowStockProducts": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "stock": "number",
      "threshold": "number"
    }
  ]
}
Product Management for Sellers
60.	Get Seller Products
–	Endpoint: GET /api/seller/products
–	Description: Get all products for the seller
–	Query Parameters:
•	page: number
•	limit: number
•	search: string
•	category: string
•	status: string (active, inactive, out_of_stock)
•	sort: string (newest, bestselling, price_asc, price_desc)
–	Response:
 	{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "discountedPrice": "number",
      "imageUrl": "string",
      "category": {
        "id": "string",
        "name": "string"
      },
      "brand": {
        "id": "string",
        "name": "string"
      },
      "stock": "number",
      "status": "string",
      "rating": "number",
      "sales": "number",
      "createdAt": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
61.	Get Product Details
–	Endpoint: GET /api/seller/products/{productId}
–	Description: Get detailed information about a product
–	Response:
 	{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "discountedPrice": "number",
  "discountPercentage": "number",
  "images": ["string"],
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
  "stock": "number",
  "lowStockThreshold": "number",
  "status": "string",
  "rating": "number",
  "reviewCount": "number",
  "sales": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
62.	Create Product
–	Endpoint: POST /api/seller/products
–	Description: Create a new product
–	Request:
 	{
  "name": "string",
  "description": "string",
  "price": "number",
  "discountedPrice": "number",
  "categoryId": "string",
  "brandId": "string",
  "tags": ["string"],
  "stock": "number",
  "lowStockThreshold": "number",
  "status": "string", // active, inactive
  "variants": [
    {
      "name": "string",
      "options": ["string"]
    }
  ]
}
–	Response:
 	{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "discountedPrice": "number",
    "categoryId": "string",
    "brandId": "string",
    "tags": ["string"],
    "stock": "number",
    "lowStockThreshold": "number",
    "status": "string",
    "createdAt": "string"
  }
}
63.	Update Product
–	Endpoint: PUT /api/seller/products/{productId}
–	Description: Update an existing product
–	Request:
 	{
  "name": "string",
  "description": "string",
  "price": "number",
  "discountedPrice": "number",
  "categoryId": "string",
  "brandId": "string",
  "tags": ["string"],
  "stock": "number",
  "lowStockThreshold": "number",
  "status": "string" // active, inactive
}
–	Response:
 	{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "discountedPrice": "number",
    "categoryId": "string",
    "brandId": "string",
    "tags": ["string"],
    "stock": "number",
    "lowStockThreshold": "number",
    "status": "string",
    "updatedAt": "string"
  }
}
64.	Delete Product
–	Endpoint: DELETE /api/seller/products/{productId}
–	Description: Delete a product
–	Response:
 	{
  "success": true,
  "message": "Product deleted successfully"
}
65.	Upload Product Images
–	Endpoint: POST /api/seller/products/{productId}/images
–	Description: Upload images for a product
–	Request: Multipart form data with image files
–	Response:
 	{
  "success": true,
  "message": "Images uploaded successfully",
  "images": ["string"]
}
66.	Delete Product Image
–	Endpoint: DELETE /api/seller/products/{productId}/images/{imageId}
–	Description: Delete a product image
–	Response:
 	{
  "success": true,
  "message": "Image deleted successfully"
}
67.	Update Product Variants
–	Endpoint: PUT /api/seller/products/{productId}/variants
–	Description: Update product variants
–	Request:
 	{
  "variants": [
    {
      "id": "string", // Optional, for existing variants
      "name": "string",
      "options": ["string"]
    }
  ]
}
–	Response:
 	{
  "success": true,
  "message": "Variants updated successfully",
  "variants": [
    {
      "id": "string",
      "name": "string",
      "options": ["string"]
    }
  ]
}
Category and Brand Management
68.	Get Seller Categories
–	Endpoint: GET /api/seller/categories
–	Description: Get all categories for the seller
–	Response:
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
69.	Create Category
–	Endpoint: POST /api/seller/categories
–	Description: Create a new category
–	Request:
 	{
  "name": "string",
  "parentId": "string", // Optional, for subcategories
  "description": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "id": "string",
    "name": "string",
    "description": "string",
    "parentId": "string",
    "createdAt": "string"
  }
}
70.	Update Category
–	Endpoint: PUT /api/seller/categories/{categoryId}
–	Description: Update an existing category
–	Request:
 	{
  "name": "string",
  "description": "string"
}
–	Response:
 	{
  "success": true,
  "message": "Category updated successfully",
  "category": {
    "id": "string",
    "name": "string",
    "description": "string",
    "updatedAt": "string"
  }
}
71.	Delete Category
–	Endpoint: DELETE /api/seller/categories/{categoryId}
–	Description: Delete a category
–	Response:
 	{
  "success": true,
  "message": "Category deleted successfully"
}
72.	Upload Category Image
–	Endpoint: POST /api/seller/categories/{categoryId}/image
–	Description: Upload image for a category
–	Request: Multipart form data with image file
–	Response:
 	{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "string"
}
73.	Get Seller Brands
–	Endpoint: GET /api/seller/brands
–	Description: Get all brands for the seller
–	Response:
 	{
  "brands": [
    {
      "id": "string",
      "name": "string",
      "imageUrl": "string",
      "description": "string",
      "productCount": "number",
      "featured": "boolean",
      "createdAt": "string"
    }
  ]
}
74.	Create Brand
–	Endpoint: POST /api/seller/brands
–	Description: Create a new brand
–	Request:
 	{
  "name": "string",
  "description": "string",
  "website": "string",
  "featured": "boolean"
}
–	Response:
 	{
  "success": true,
  "message": "Brand created successfully",
  "brand": {
    "id": "string",
    "name": "string",
    "description": "string",
    "website": "string",
    "featured": "boolean",
    "createdAt": "string"
  }
}
75.	Update Brand
–	Endpoint: PUT /api/seller/brands/{brandId}
–	Description: Update an existing brand
–	Request:
 	{
  "name": "string",
  "description": "string",
  "website": "string",
  "featured": "boolean"
}
–	Response:
 	{
  "success": true,
  "message": "Brand updated successfully",
  "brand": {
    "id": "string",
    "name": "string",
    "description": "string",
    "website": "string",
    "featured": "boolean",
    "updatedAt": "string"
  }
}
76.	Delete Brand
–	Endpoint: DELETE /api/seller/brands/{brandId}
–	Description: Delete a brand
–	Response:
 	{
  "success": true,
  "message": "Brand deleted successfully"
}
77.	Upload Brand Logo
–	Endpoint: POST /api/seller/brands/{brandId}/logo
–	Description: Upload logo for a brand
–	Request: Multipart form data with image file
–	Response:
 	{
  "success": true,
  "message": "Logo uploaded successfully",
  "imageUrl": "string"
}
Order Management for Sellers
78.	Get Seller Orders
–	Endpoint: GET /api/seller/orders
–	Description: Get all orders for the seller
–	Query Parameters:
•	page: number
•	limit: number
•	status: string (all, pending, processing, shipped, delivered, cancelled)
•	startDate: string
•	endDate: string
–	Response:
 	{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "customer": {
        "id": "string",
        "name": "string"
      },
      "total": "number",
      "status": "string",
      "paymentStatus": "string",
      "items": [
        {
          "product": {
            "id": "string",
            "name": "string"
          },
          "quantity": "number",
          "price": "number"
        }
      ],
      "createdAt": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
79.	Get Order Details
–	Endpoint: GET /api/seller/orders/{orderId}
–	Description: Get details of a specific order
–	Response:
 	{
  "id": "string",
  "trackingId": "string",
  "customer": {
    "id": "string",
    "name": "string",
    "phoneNumber": "string",
    "email": "string"
  },
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
  "status": "string",
  "address": {
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string"
  },
  "notes": "string",
  "createdAt": "string",
  "timeline": [
    {
      "status": "string",
      "timestamp": "string",
      "description": "string"
    }
  ]
}
80.	Update Order Status
–	Endpoint: PUT /api/seller/orders/{orderId}/status
–	Description: Update the status of an order
–	Request:
 	{
  "status": "string" // processing, shipped, delivered, cancelled
}
–	Response:
 	{
  "success": true,
  "message": "Order status updated successfully",
  "status": "string"
}
Promotion Management
81.	Get Seller Promotions
–	Endpoint: GET /api/seller/promotions
–	Description: Get all promotions for the seller
–	Query Parameters:
•	status: string (active, scheduled, expired)
–	Response:
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
      "usageLimit": "number",
      "usageCount": "number",
      "status": "string",
      "createdAt": "string"
    }
  ]
}
82.	Create Promotion
–	Endpoint: POST /api/seller/promotions
–	Description: Create a new promotion
–	Request:
 	{
  "title": "string",
  "description": "string",
  "code": "string",
  "discountType": "string", // percentage, fixed
  "discountValue": "number",
  "minimumPurchase": "number",
  "validFrom": "string",
  "validTo": "string",
  "usageLimit": "number",
  "applicableProducts": ["string"], // product IDs, empty for all products
  "excludedProducts": ["string"] // product IDs
}
–	Response:
 	{
  "success": true,
  "message": "Promotion created successfully",
  "promotion": {
    "id": "string",
    "title": "string",
    "code": "string",
    "discountType": "string",
    "discountValue": "number",
    "validFrom": "string",
    "validTo": "string",
    "status": "string",
    "createdAt": "string"
  }
}
83.	Update Promotion
–	Endpoint: PUT /api/seller/promotions/{promotionId}
–	Description: Update an existing promotion
–	Request:
 	{
  "title": "string",
  "description": "string",
  "discountType": "string",
  "discountValue": "number",
  "minimumPurchase": "number",
  "validFrom": "string",
  "validTo": "string",
  "usageLimit": "number",
  "applicableProducts": ["string"],
  "excludedProducts": ["string"]
}
–	Response:
 	{
  "success": true,
  "message": "Promotion updated successfully",
  "promotion": {
    "id": "string",
    "title": "string",
    "code": "string",
    "discountType": "string",
    "discountValue": "number",
    "validFrom": "string",
    "validTo": "string",
    "status": "string",
    "updatedAt": "string"
  }
}
84.	Delete Promotion
–	Endpoint: DELETE /api/seller/promotions/{promotionId}
–	Description: Delete a promotion
–	Response:
 	{
  "success": true,
  "message": "Promotion deleted successfully"
}
85.	Upload Promotion Image
–	Endpoint: POST /api/seller/promotions/{promotionId}/image
–	Description: Upload image for a promotion
–	Request: Multipart form data with image file
–	Response:
 	{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "string"
}
Reports and Analytics
86.	Get Sales Report
–	Endpoint: GET /api/seller/reports/sales
–	Description: Get sales report for the seller
–	Query Parameters:
•	period: string (daily, weekly, monthly)
•	startDate: string
•	endDate: string
–	Response:
 	{
  "summary": {
    "totalSales": "number",
    "totalOrders": "number",
    "averageOrderValue": "number",
    "comparisonWithPrevious": "number" // percentage
  },
  "breakdown": [
    {
      "date": "string",
      "sales": "number",
      "orders": "number"
    }
  ],
  "topProducts": [
    {
      "id": "string",
      "name": "string",
      "sales": "number",
      "revenue": "number",
      "percentage": "number"
    }
  ],
  "topCategories": [
    {
      "id": "string",
      "name": "string",
      "sales": "number",
      "revenue": "number",
      "percentage": "number"
    }
  ]
}
87.	Get Order Report
–	Endpoint: GET /api/seller/reports/orders
–	Description: Get order report for the seller
–	Query Parameters:
•	period: string (daily, weekly, monthly)
•	startDate: string
•	endDate: string
–	Response:
 	{
  "summary": {
    "totalOrders": "number",
    "completedOrders": "number",
    "cancelledOrders": "number",
    "averageProcessingTime": "number" // in hours
  },
  "breakdown": [
    {
      "date": "string",
      "orders": "number",
      "completed": "number",
      "cancelled": "number"
    }
  ],
  "statusDistribution": [
    {
      "status": "string",
      "count": "number",
      "percentage": "number"
    }
  ],
  "cancellationReasons": [
    {
      "reason": "string",
      "count": "number",
      "percentage": "number"
    }
  ]
}
88.	Get Payment Report
–	Endpoint: GET /api/seller/reports/payments
–	Description: Get payment report for the seller
–	Query Parameters:
•	period: string (daily, weekly, monthly)
•	startDate: string
•	endDate: string
–	Response:
 	{
  "summary": {
    "totalRevenue": "number",
    "pendingPayments": "number",
    "completedPayments": "number",
    "refunds": "number"
  },
  "breakdown": [
    {
      "date": "string",
      "revenue": "number",
      "refunds": "number"
    }
  ],
  "paymentMethodDistribution": [
    {
      "method": "string",
      "count": "number",
      "amount": "number",
      "percentage": "number"
    }
  ],
  "transactions": [
    {
      "id": "string",
      "orderId": "string",
      "amount": "number",
      "method": "string",
      "status": "string",
      "createdAt": "string"
    }
  ]
}
Notification APIs
89.	Get User Notifications
–	Endpoint: GET /api/notifications
–	Description: Get notifications for the current user
–	Query Parameters:
•	page: number
•	limit: number
•	read: boolean
–	Response:
 	{
  "notifications": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "message": "string",
      "data": {
        "entityId": "string",
        "entityType": "string"
      },
      "read": "boolean",
      "createdAt": "string"
    }
  ],
  "unreadCount": "number",
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
90.	Mark Notification as Read 
–	Endpoint: PUT /api/notifications/{notificationId}/read
–	Description: Mark a notification as read
–	Response:
 	{
  "success": true,
  "message": "Notification marked as read"
}
91.	Mark All Notifications as Read
–	Endpoint: PUT /api/notifications/read-all
–	Description: Mark all notifications as read
–	Response:
 	{
  "success": true,
  "message": "All notifications marked as read"
}
92.	Delete Notification
–	Endpoint: DELETE /api/notifications/{notificationId}
–	Description: Delete a notification
–	Response:
 	{
  "success": true,
  "message": "Notification deleted successfully"
}
93.	Update Notification Settings
–	Endpoint: PUT /api/users/notification-settings
–	Description: Update notification preferences
–	Request:
 	{
  "pushNotifications": "boolean",
  "emailNotifications": "boolean",
  "smsNotifications": "boolean",
  "orderUpdates": "boolean",
  "promotions": "boolean",
  "accountActivity": "boolean"
}
–	Response:
 	{
  "success": true,
  "message": "Notification settings updated successfully",
  "settings": {
    "pushNotifications": "boolean",
    "emailNotifications": "boolean",
    "smsNotifications": "boolean",
    "orderUpdates": "boolean",
    "promotions": "boolean",
    "accountActivity": "boolean",
    "updatedAt": "string"
  }
}
File Upload APIs 
94.	Upload File
–	Endpoint: POST /api/files/upload
–	Description: Upload a file
–	Request: Multipart form data with file
–	Response:
 	{
  "success": true,
  "fileUrl": "string",
  "fileType": "string",
  "fileName": "string",
  "fileSize": "number"
}
95.	Delete File
–	Endpoint: DELETE /api/files/{fileId}
–	Description: Delete a file
–	Response:
 	{
  "success": true,
  "message": "File deleted successfully"
}
Security Considerations Recommendations
1.	Authentication
–	All API endpoints except public ones should require authentication
–	Use JWT (JSON Web Tokens) for authentication
–	Implement token refresh mechanism
–	Set appropriate token expiration times
2.	Authorization
–	Implement role-based access control (RBAC)
–	Ensure users can only access their own data
–	Validate user permissions for each request
3.	Data Validation Recommendation

–	Validate all input data on the server side
–	Implement request size limits
–	Sanitize user inputs to prevent injection attacks
4.	Rate Limiting Recommendation
–	Implement rate limiting to prevent abuse
–	Set appropriate limits for different endpoints
–	Return proper status codes for rate-limited requests
5.	Error Handling
–	Return consistent error responses
–	Avoid exposing sensitive information in error messages
–	Log errors for monitoring and debugging
6.	HTTPS
–	All API endpoints must be served over HTTPS – TCP ( SOCKETS OR REST)
–	Implement proper SSL/TLS configuration
7.	Sensitive Data Recommendation
–	Never return sensitive data like passwords
–	Encrypt sensitive data in the database
–	Implement proper data masking for PII
API Implementation Guidelines
1.	Versioning (kindly version the apis)
–	Include API version in the URL (e.g., /api/v1/users)
–	Maintain backward compatibility when possible
2.	Response Format
–	Use consistent JSON response format
–	Include status code, message, and data in responses
–	Use proper HTTP status codes
3.	Pagination
–	Implement pagination for list endpoints
–	Include total count, page number, and page size in responses
–	Allow customization of page size
4.	Filtering and Sorting
–	Support filtering by common fields
–	Support sorting by relevant fields
–	Use query parameters for filtering and sorting
5.	Documentation
–	Maintain comprehensive API documentation
–	Include request/response examples
–	Document error codes and messages
6.	Testing
–	Write unit tests for all endpoints
–	Implement integration tests for critical flows
–	Set up automated testing in CI/CD pipeline
Conclusion
This document outlines the comprehensive list of APIs required for the Ntumai Delivery App. The backend development team should implement these APIs following the specified request/response formats and security considerations. Regular communication between frontend and backend teams is essential to ensure smooth integration and functionality.

In addition to our previous conversations on errands, food and marketplace. 

# Ntumai Delivery App - New Features API Documentation (Workflow-Based)

This document outlines the API requirements for new features identified from the provided workflow analysis for the Ntumai Delivery App.

## 1. Task Workflow (Errands, Delivery) APIs

This section details the APIs required to support the "Do a Task" functionality, including task creation, provider assignment, status updates, and user interactions.

### 1.1. Task Creation and Management

**Endpoint:** `POST /api/v1/tasks`

**Description:** Allows a user to create a new task (errand or delivery request).

**Request Body:**
```json
{
  "userId": "user-123-abc",
  "taskType": "delivery",
  "description": "Pick up groceries from SuperMart and deliver to home address.",
  "pickupLocation": {
    "address": "123 SuperMart Rd",
    "latitude": -1.286389,
    "longitude": 36.817223
  },
  "deliveryLocation": {
    "address": "456 Home St",
    "latitude": -1.296389,
    "longitude": 36.827223
  },
  "preferredTime": "2025-08-15T14:00:00Z",
  "paymentMethod": "credit_card"
}
```

**Response Body (Success):**
```json
{
  "taskId": "task-xyz-789",
  "status": "pending_assignment",
  "message": "Task created successfully. Searching for providers."
}
```

**Error Responses:**
- 400 Bad Request: Invalid task details.

**Endpoint:** `GET /api/v1/tasks/{taskId}`

**Description:** Retrieves details of a specific task.

**Endpoint:** `PUT /api/v1/tasks/{taskId}/cancel`

**Description:** Allows a user to cancel a pending task.

### 1.2. Task Provider Assignment

**Endpoint:** `GET /api/v1/tasks/{taskId}/available-providers`

**Description:** Retrieves a list of available task providers for a given task.

**Endpoint:** `POST /api/v1/tasks/{taskId}/assign-provider`

**Description:** Assigns a selected provider to a task.

**Request Body:**
```json
{
  "providerId": "provider-abc-123"
}
```

### 1.3. Task Status Updates

**Endpoint:** `PUT /api/v1/tasks/{taskId}/status`

**Description:** Updates the status of a task (e.g., `accepted`, `in_progress`, `arrived`, `completed`).

**Request Body:**
```json
{
  "status": "in_progress",
  "location": {
    "latitude": -1.286389,
    "longitude": 36.817223
  }
}
```

### 1.4. Task Notifications

**Endpoint:** `POST /api/v1/notifications/send`

**Description:** Sends a notification to a user or provider about a task status change.

**Request Body:**
```json
{
  "recipientId": "user-123-abc",
  "type": "task_status_update",
  "message": "Your task #task-xyz-789 is now in progress.",
  "taskId": "task-xyz-789"
}
```

### 1.5. Payment Integration

**Endpoint:** `POST /api/v1/payments/process-task-payment`

**Description:** Processes payment for a completed task.

**Request Body:**
```json
{
  "taskId": "task-xyz-789",
  "amount": 15.50,
  "currency": "USD",
  "paymentMethodId": "card-123"
}
```

### 1.6. User Rating and Review

**Endpoint:** `POST /api/v1/tasks/{taskId}/rate-provider`

**Description:** Allows a user to rate and review a task provider after task completion.

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent service! Very fast and efficient."
}
```

### 1.7. Chat between User and Task Provider

**Endpoint:** `POST /api/v1/task-chat/send-message`

**Description:** Sends a message between a user and a task provider for a specific task.

**Request Body:**
```json
{
  "taskId": "task-xyz-789",
  "senderId": "user-123-abc",
  "receiverId": "provider-abc-123",
  "message": "Could you please buy organic milk?"
}
```

**Endpoint:** `GET /api/v1/task-chat/history/{taskId}`

**Description:** Retrieves the chat history for a specific task.



## 2. Marketplace Stores Workflow APIs

This section outlines the APIs required to enhance the marketplace store experience, focusing on live inventory, customer support chat, promotions, and order history.

### 2.1. Live Inventory Updates

**Endpoint:** `GET /api/v1/stores/{storeId}/products/{productId}/inventory`

**Description:** Retrieves the real-time stock availability for a specific product in a given store.

**Response Body (Success):**
```json
{
  "productId": "prod-abc-123",
  "storeId": "store-xyz-789",
  "availableStock": 15,
  "lastUpdated": "2025-08-08T16:00:00Z"
}
```

**Error Responses:**
- 404 Not Found: Product or store not found.

### 2.2. Customer Support Chat

**Endpoint:** `POST /api/v1/store-chat/send-message`

**Description:** Sends a message from a user to a store's customer support.

**Request Body:**
```json
{
  "storeId": "store-xyz-789",
  "userId": "user-123-abc",
  "message": "I have a question about my recent order."
}
```

**Response Body (Success):**
```json
{
  "messageId": "msg-789-ghi",
  "timestamp": "2025-08-08T16:05:00Z",
  "status": "sent"
}
```

**Endpoint:** `GET /api/v1/store-chat/history/{storeId}/{userId}`

**Description:** Retrieves the chat history between a user and a store's customer support.

### 2.3. Promo Codes and Discounts

**Endpoint:** `GET /api/v1/promo-codes/{code}`

**Description:** Validates a promo code and returns its details.

**Response Body (Success):**
```json
{
  "promoCodeId": "promo-1",
  "code": "SUMMER20",
  "discountType": "percentage",
  "value": 20,
  "minOrderValue": 50.00,
  "expiryDate": "2025-08-31T23:59:59Z"
}
```

**Error Responses:**
- 404 Not Found: Promo code not found.
- 410 Gone: Promo code expired.

**Endpoint:** `POST /api/v1/cart/apply-promo`

**Description:** Applies a promo code to the current user's cart.

**Request Body:**
```json
{
  "promoCode": "SUMMER20",
  "cartId": "cart-abc-123"
}
```

**Response Body (Success):**
```json
{
  "cartId": "cart-abc-123",
  "discountApplied": 10.00,
  "newTotalPrice": 40.00,
  "message": "Promo code applied successfully."
}
```

### 2.4. Order History for Repeat Purchases

**Endpoint:** `GET /api/v1/users/{userId}/order-history`

**Description:** Retrieves a user's past order history.

**Query Parameters:**
- `page`: Page number for pagination
- `limit`: Number of orders per page

**Response Body (Success):**
```json
{
  "orders": [
    {
      "orderId": "order-123-xyz",
      "orderDate": "2025-07-20T10:30:00Z",
      "totalAmount": 55.00,
      "status": "delivered",
      "items": [
        {
          "productId": "prod-1",
          "name": "Milk",
          "quantity": 1
        }
      ]
    }
  ],
  "totalPages": 5,
  "currentPage": 1
}
```



## 3. Food Ordering with Live Tracking APIs

This section focuses on APIs to support the unique UI and workflow for food ordering, emphasizing real-time updates and enhanced user interaction.

### 3.1. Restaurant and Menu Browsing

**Endpoint:** `GET /api/v1/restaurants`

**Description:** Retrieves a list of restaurants with filtering options.

**Query Parameters:**
- `cuisine`: Filter by cuisine type (e.g., "Italian", "Chinese")
- `priceRange`: Filter by price range (e.g., "$", "$$")
- `dietaryPreferences`: Filter by dietary preferences (e.g., "vegetarian", "gluten-free")
- `rating`: Minimum average rating

**Response Body (Success):**
```json
{
  "restaurants": [
    {
      "restaurantId": "rest-1",
      "name": "Pizza Palace",
      "cuisine": "Italian",
      "averageRating": 4.5,
      "deliveryTime": "30-45 min"
    }
  ]
}
```

**Endpoint:** `GET /api/v1/restaurants/{restaurantId}/menu`

**Description:** Retrieves the menu for a specific restaurant, including categories and items.

### 3.2. Food Item Customization

**Endpoint:** `GET /api/v1/menu-items/{itemId}/options`

**Description:** Retrieves customization options (e.g., add-ons, modifiers) for a specific menu item.

**Response Body (Success):**
```json
{
  "itemId": "item-1",
  "customizationOptions": [
    {
      "optionGroup": "Cheese",
      "type": "single_select",
      "options": [
        {"name": "Extra Cheese", "price": 1.50},
        {"name": "No Cheese", "price": 0.00}
      ]
    },
    {
      "optionGroup": "Toppings",
      "type": "multi_select",
      "options": [
        {"name": "Mushrooms", "price": 1.00},
        {"name": "Onions", "price": 0.75}
      ]
    }
  ]
}
```

### 3.3. Order Confirmation and Live Status

**Endpoint:** `GET /api/v1/orders/{orderId}/live-status`

**Description:** Retrieves the live status and progress of a food order.

**Response Body (Success):**
```json
{
  "orderId": "order-food-123",
  "currentStatus": "preparing",
  "statusHistory": [
    {"status": "received", "timestamp": "2025-08-08T17:00:00Z"},
    {"status": "preparing", "timestamp": "2025-08-08T17:10:00Z"}
  ],
  "estimatedPrepTimeRemaining": "15 minutes",
  "estimatedDeliveryTime": "2025-08-08T17:45:00Z",
  "driverLocation": {
    "latitude": -1.286389,
    "longitude": 36.817223
  }
}
```

### 3.4. Real-time Chat with Restaurant/Courier

**Endpoint:** `POST /api/v1/food-chat/send-message`

**Description:** Sends a message between a user and the restaurant or courier for a food order.

**Request Body:**
```json
{
  "orderId": "order-food-123",
  "senderId": "user-123-abc",
  "receiverType": "restaurant",
  "receiverId": "rest-1",
  "message": "Can I get extra napkins?"
}
```

**Endpoint:** `GET /api/v1/food-chat/history/{orderId}`

**Description:** Retrieves the chat history for a specific food order.

### 3.5. Handling Delays

**Endpoint:** `POST /api/v1/orders/{orderId}/report-delay`

**Description:** Allows a restaurant or courier to report a delay for an order.

**Request Body:**
```json
{
  "reason": "High volume",
  "estimatedAdditionalTime": "10 minutes"
}
```

### 3.6. Order Modifications (within grace period)

**Endpoint:** `PUT /api/v1/orders/{orderId}/modify`

**Description:** Allows modification of an order within a defined grace period.

**Request Body:**
```json
{
  "action": "add_item",
  "itemId": "item-456",
  "quantity": 1
}
```

### 3.7. Tipping/Bonus Payment to Delivery Driver

**Endpoint:** `POST /api/v1/payments/tip-driver`

**Description:** Allows a user to add a tip or bonus payment to the delivery driver after order completion.

**Request Body:**
```json
{
  "orderId": "order-food-123",
  "driverId": "driver-abc-789",
  "amount": 5.00,
  "currency": "USD"
}
```

### 3.8. Loyalty/Rewards Integration

(Note: APIs for Loyalty Program and Rewards were previously documented in `new_features_api_documentation.md`. These APIs would be reused here for integration with food ordering, allowing users to earn points on food purchases and redeem rewards for food orders.)

**Relevant Endpoints (from previous documentation):**
- `GET /api/v1/users/{userId}/loyalty-points`
- `GET /api/v1/rewards`
- `POST /api/v1/users/{userId}/redeem-reward`





 
