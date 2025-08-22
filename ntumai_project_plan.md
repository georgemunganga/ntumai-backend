# Ntumai Delivery App: Comprehensive Project Plan

## 1. Project Overview and Scope

This document outlines the comprehensive project plan for the development of the Ntumai Delivery App. The application aims to provide a robust platform for various delivery services, including general errands, marketplace purchases, and specialized food ordering with live tracking. The plan encompasses backend development using NestJS, frontend development for both user and administrative interfaces, database design, API specifications, and deployment strategies.

### 1.1. Core Objectives

*   To develop a scalable, high-performance, and secure delivery application.
*   To provide a seamless user experience for ordering and tracking deliveries.
*   To empower businesses with efficient tools for managing products, orders, and promotions.
*   To enable real-time communication and tracking capabilities.
*   To establish a flexible architecture that supports future feature expansion and integration.

### 1.2. Key Features and Functionalities

Based on the initial UI/UX analysis and subsequent discussions, the Ntumai Delivery App will include the following major feature sets:

#### 1.2.1. User Authentication and Profile Management

*   User registration (email/phone, password)
*   Phone verification (OTP)
*   User login and session management (JWT)
*   Password reset functionality
*   User profile creation and management (personal details, addresses)
*   Account settings (notifications, preferences)

#### 1.2.2. Product and Store Management

*   Product listing and detailed views
*   Product search and filtering
*   Store browsing and information display
*   Admin functionalities for creating, updating, and deleting products
*   Management of product variants and media uploads

#### 1.2.3. Marketplace Management

*   Dashboard for marketplace administrators/vendors
*   Brand management (create, edit, delete brands)
*   Category management (create, edit, delete categories)
*   Promotion and discount code management (create, edit, delete promotions, apply promo codes to cart)
*   Access to sales, order, and payment reports

#### 1.2.4. Shopping Cart and Checkout

*   Adding/removing items to/from cart
*   Cart summary and total calculation
*   Checkout process (delivery/pickup options, payment method selection)
*   Order confirmation and history

#### 1.2.5. Delivery and Order Tracking

*   Real-time driver location tracking on a map
*   Order status updates (preparation, packing, out for delivery, delivered)
*   Route management for drivers
*   Scheduled deliveries for future time slots

#### 1.2.6. Task Workflow (Errands and General Deliveries)

*   User-initiated task creation (describing task, pickup/delivery locations)
*   System shows available task providers/drivers
*   User books a provider
*   Task provider accepts/declines
*   Task status updates (arrived, in progress, completed)
*   Task cancellation and refund handling
*   User rating and review of task providers

#### 1.2.7. Food Ordering with Live Tracking (Specialized Workflow)

*   Browse food stores/restaurants with menus and ratings
*   Filter by cuisine, price range, dietary preferences
*   Add food items to cart with customization options (add-ons, modifiers)
*   Estimated prep time display
*   Live tracking UI with detailed stages (Order Received, Preparing, Packing, Out for Delivery, Delivered)
*   Countdown timers for prep/delivery ETA
*   Post-delivery rating and review for food and delivery
*   Option to reorder or save as favorite

#### 1.2.8. Communication and Notifications

*   In-app chat between users and drivers/stores/restaurants
*   Push notifications and SMS updates for order/task status changes
*   Alerts for delays in food preparation or delivery

#### 1.2.9. Payment and Earnings Management

*   Integration with various payment gateways
*   Management of payment methods
*   Earnings tracking for drivers/vendors
*   Option to tip delivery drivers

#### 1.2.10. Loyalty Program and Rewards

*   Earning loyalty points for purchases
*   Redeeming points for rewards (vouchers, free delivery)

#### 1.2.11. Advanced Search and Filtering

*   Comprehensive search for products and stores
*   Advanced filtering options (price range, rating, categories, brands, delivery radius)

### 1.3. Out of Scope for Initial MVP

*   Complex recommendation engines (beyond basic search/filters)
*   Multi-language support (initially English only)
*   Offline mode functionality
*   Advanced analytics dashboards for end-users (basic reports for admins are in scope)
*   Integration with external CRM or ERP systems (can be added in future phases)

## 2. System Architecture and Database Design

### 2.1. Overall Architecture: Monolithic (Initial) with Microservices Vision

Given the current request for a single database and the need to get a functional application quickly, the initial architecture will be a **monolithic NestJS application**. This approach simplifies development, deployment, and management in the early stages. However, the design will incorporate modularity and clear domain boundaries to facilitate a smooth transition to a microservices architecture in future phases as the application scales and grows in complexity.

#### 2.1.1. Key Architectural Principles

*   **Modularity:** Application divided into distinct NestJS modules, each representing a bounded context (e.g., Auth, User, Product, Order, Payment, Delivery, Task, Chat, Loyalty, Search, Scheduling, Admin).
*   **Layered Architecture:** Clear separation of concerns (Controllers, Services, Repositories/Data Access Objects, DTOs).
*   **Domain-Driven Design (DDD) Principles:** Focusing on the core business domain and modeling entities, aggregates, and value objects appropriately.
*   **API-First Approach:** All functionalities exposed via well-defined RESTful APIs, with WebSocket support for real-time features.
*   **Scalability Considerations:** While monolithic initially, design choices will anticipate future horizontal scaling (e.g., stateless services, externalized configuration).
*   **Security by Design:** Implementing authentication, authorization, input validation, and data encryption from the outset.

### 2.2. Database Design: Single Relational Database

For the initial phase, a **single relational database** (e.g., PostgreSQL) will be used. This simplifies data management and ensures strong transactional consistency across related domains. The database schema will be designed with normalization where appropriate, but also with denormalization for frequently queried data to optimize performance.

#### 2.2.1. Key Entities and Relationships

*   **Users:** (id, email, phone, password_hash, full_name, role, created_at, updated_at)
    *   Roles: Customer, Driver, Vendor, Admin
*   **Products:** (id, name, description, price, category_id, brand_id, store_id, stock, image_urls, created_at, updated_at)
*   **ProductVariants:** (id, product_id, name, options, sku, additional_price)
*   **Categories:** (id, name, parent_category_id)
*   **Brands:** (id, name, logo_url)
*   **Stores/Restaurants:** (id, name, address, contact_info, rating, delivery_fee, min_order_value, type (store/restaurant))
*   **Orders:** (id, user_id, store_id/restaurant_id, status, total_amount, payment_status, delivery_address_id, scheduled_delivery_time, created_at, updated_at)
*   **OrderItems:** (id, order_id, product_id, quantity, price, customization_details)
*   **Payments:** (id, order_id/task_id, user_id, amount, currency, status, transaction_id, payment_method, created_at)
*   **DeliveryAssignments:** (id, order_id/task_id, driver_id, status, pickup_location, delivery_location, route_details, estimated_arrival_time)
*   **Tasks:** (id, user_id, task_type, description, pickup_location, delivery_location, status, assigned_driver_id, created_at, updated_at)
*   **Notifications:** (id, user_id, type, message, read_status, created_at)
*   **Chats:** (id, order_id/task_id, sender_id, receiver_id, message, timestamp)
*   **LoyaltyPoints:** (id, user_id, points_balance, last_updated)
*   **Rewards:** (id, name, description, points_required, type, value)
*   **Promotions:** (id, title, description, discount_type, value, start_date, end_date, applicable_to)
*   **Reviews/Ratings:** (id, entity_id, entity_type, user_id, rating, comment, created_at)

#### 2.2.2. Data Dictionary

A detailed data dictionary will be maintained for each table, specifying column names, data types, constraints, and relationships. This will ensure data integrity and serve as a clear reference for developers.

### 2.3. API Design Principles

*   **RESTful APIs:** Primary communication will be via RESTful endpoints for most operations.
*   **WebSocket APIs:** Used for real-time functionalities such as live driver tracking, in-app chat, and live order status updates.
*   **Clear Naming Conventions:** Consistent and intuitive naming for endpoints and resources.
*   **Versioninng:** APIs will be versioned (e.g., `/api/v1/`) to allow for future changes without breaking existing clients.
*   **Request/Response DTOs:** Strict Data Transfer Objects (DTOs) for all API requests and responses to ensure data consistency and validation.
*   **Standard Error Handling:** Consistent error codes and response formats for all API errors.
*   **Authentication and Authorization:** JWT-based authentication for securing all API endpoints, with role-based access control (RBAC) implemented at the API level.

## 3. API Development and Backend Implementation (NestJS)

### 3.1. Module Breakdown (NestJS)

The backend will be structured into distinct NestJS modules, each encapsulating its domain logic, controllers, services, and repositories. This modularity supports clear separation of concerns and facilitates future microservices migration.

*   **AuthModule:** Handles user authentication, registration, login, password reset, and phone verification.
    *   Controllers: `AuthController`
    *   Services: `AuthService`, `JwtService`
    *   DTOs: `RegisterUserDto`, `LoginUserDto`, `ResetPasswordDto`
*   **UserModule:** Manages user profiles, roles, and permissions.
    *   Controllers: `UserController`
    *   Services: `UserService`
    *   DTOs: `CreateUserDto`, `UpdateUserDto`
*   **ProductModule:** Manages product information, categories, brands, and product variants.
    *   Controllers: `ProductController`, `CategoryController`, `BrandController`
    *   Services: `ProductService`, `CategoryService`, `BrandService`
    *   DTOs: `CreateProductDto`, `UpdateProductDto`, `CreateCategoryDto`, `CreateBrandDto`
*   **OrderModule:** Handles order creation, status updates, order history, and cart management.
    *   Controllers: `OrderController`, `CartController`
    *   Services: `OrderService`, `CartService`
    *   DTOs: `CreateOrderDto`, `UpdateOrderStatusDto`
*   **PaymentModule:** Integrates with payment gateways, manages transactions, and refunds.
    *   Controllers: `PaymentController`
    *   Services: `PaymentService`
    *   DTOs: `ProcessPaymentDto`
*   **DeliveryModule:** Manages delivery assignments, driver tracking, route optimization, and delivery status updates.
    *   Controllers: `DeliveryController`
    *   Services: `DeliveryService`
    *   DTOs: `AssignDeliveryDto`, `UpdateDeliveryStatusDto`
*   **TaskModule:** Manages errand/task creation, assignment, status updates, and related workflows.
    *   Controllers: `TaskController`
    *   Services: `TaskService`
    *   DTOs: `CreateTaskDto`, `UpdateTaskStatusDto`
*   **ChatModule:** Handles real-time messaging between users, drivers, and stores/restaurants.
    *   Controllers: `ChatController` (for REST endpoints)
    *   Gateways: `ChatGateway` (for WebSockets)
    *   Services: `ChatService`
    *   DTOs: `SendMessageDto`
*   **LoyaltyModule:** Manages loyalty points, rewards, and redemption processes.
    *   Controllers: `LoyaltyController`, `RewardController`
    *   Services: `LoyaltyService`, `RewardService`
    *   DTOs: `RedeemRewardDto`
*   **SearchModule:** Provides advanced search and filtering capabilities for products and stores.
    *   Controllers: `SearchController`
    *   Services: `SearchService`
    *   DTOs: `ProductSearchDto`, `StoreSearchDto`
*   **SchedulingModule:** Manages available delivery slots and scheduled deliveries.
    *   Controllers: `SchedulingController`
    *   Services: `SchedulingService`
    *   DTOs: `ScheduleDeliveryDto`
*   **AdminModule:** (Dedicated module within the monolithic app for admin APIs)
    *   Controllers: `AdminUserController`, `AdminProductController`, `AdminOrderController`, `AdminPromotionController`, `AdminReportController`
    *   Services: `AdminService` (orchestrates calls to other services/repositories)

### 3.2. API Endpoint Specifications (REST and WebSockets)

Detailed API specifications for each module will be developed, including:

*   **HTTP Methods:** GET, POST, PUT, DELETE, PATCH
*   **Endpoints:** Clear and consistent URI paths.
*   **Request/Response Payloads:** JSON format with defined schemas.
*   **Query Parameters:** For filtering, sorting, and pagination.
*   **Authentication and Authorization:** JWT token requirements and role-based access.
*   **Error Handling:** Specific error codes and messages.

**WebSocket Endpoints:**

*   `/ws/driver-tracking`: For real-time driver location updates.
*   `/ws/chat`: For real-time in-app messaging.
*   `/ws/order-status`: For real-time order status updates.

### 3.3. Third-Party Integrations

*   **Payment Gateways:** Stripe, Flutterwave, or other regional payment providers.
*   **Mapping Services:** Google Maps API for location services, route optimization, and live tracking.
*   **SMS/Email Services:** Twilio, SendGrid, or similar for notifications.
*   **Push Notifications:** Firebase Cloud Messaging (FCM) for mobile push notifications.

### 3.4. Authentication and Authorization Strategy

*   **JWT (JSON Web Tokens):** Used for stateless authentication. Tokens will be issued upon successful login and sent with subsequent requests.
*   **Refresh Tokens:** Implemented to securely manage token expiry and renewal.
*   **Role-Based Access Control (RBAC):** Users will be assigned roles (Customer, Driver, Vendor, Admin), and access to API endpoints will be restricted based on these roles.
*   **Phone/Email Verification:** Implemented during registration and for sensitive actions.

### 3.5. Error Handling and Logging

*   **Centralized Error Handling:** NestJS exception filters will be used to standardize error responses across the application.
*   **Logging:** Winston or Pino will be integrated for structured logging, with different log levels (debug, info, warn, error). Logs will be sent to a centralized logging system (e.g., ELK Stack).
*   **Monitoring:** Prometheus and Grafana will be set up to collect and visualize application metrics (request rates, error rates, latency, resource utilization).

## 4. Frontend Development

### 4.1. User-Facing Mobile Application (React Native)

*   **Technology Stack:** React Native with Expo for rapid development and NativeWind for styling.
*   **State Management:** Zustand or Jotai for efficient and scalable state management.
*   **UI Components:** Development of a consistent design system with reusable UI components (Button, Input, Card, ListItem, Modal, Avatar, Rating, Tag).
*   **Responsive Layouts:** Implementation using `react-native-responsive-screen` or Flexbox.
*   **Features:** All user-facing functionalities outlined in Section 1.2, including authentication flows, product browsing, cart, checkout, order tracking, task creation, food ordering, chat, loyalty, and profile management.
*   **Real-time Updates:** Integration with WebSocket APIs for live tracking, chat, and order status.

### 4.2. Admin Dashboard Web Application (React/Angular/Vue - TBD, but likely React)

*   **Technology Stack:** A modern JavaScript framework (e.g., React with Next.js or a similar setup for server-side rendering/static site generation).
*   **UI/UX:** Intuitive and efficient interface for administrative tasks.
*   **Features:** All admin functionalities outlined in Section 1.2, including user management, product approval, order management, promotion configuration, and report viewing.
*   **Data Visualization:** Integration of charting libraries for displaying reports and analytics.

## 5. Quality Assurance and Testing Strategy

*   **Unit Testing:** Comprehensive unit tests for all backend services, controllers, and utility functions using Jest.
*   **Integration Testing:** Testing the interaction between different modules and with the database to ensure data flow and business logic correctness.
*   **End-to-End (E2E) Testing:** Automated E2E tests for critical user flows (e.g., user registration, order placement, delivery tracking, payment processing) using tools like Cypress or Playwright.
*   **API Testing:** Automated testing of all REST and WebSocket API endpoints using tools like Postman (for manual/collection) and automated frameworks (e.g., Supertest with Jest).
*   **Performance Testing:** Load testing to ensure the application can handle anticipated user loads and peak traffic.
*   **Security Testing:** Regular security audits, penetration testing, and vulnerability scanning.
*   **Manual Testing:** Exploratory testing, usability testing, and cross-device compatibility testing.

## 6. Deployment and Operations Plan

### 6.1. Containerization (Docker)

*   All backend services (NestJS application) will be containerized using Docker. This ensures consistent environments across development, staging, and production.
*   Frontend applications (mobile and admin) will also be containerized for consistent build and deployment.

### 6.2. CI/CD Pipeline

*   **Continuous Integration:** Automated builds and tests will be triggered on every code commit to a version control system (e.g., Git).
*   **Continuous Delivery/Deployment:** Automated deployment to staging and production environments upon successful CI builds and passing tests.
*   **Tools:** GitHub Actions, GitLab CI/CD, Jenkins, or similar platforms.

### 6.3. Cloud Infrastructure

*   **Cloud Provider:** AWS, Google Cloud Platform (GCP), or Azure (decision to be made based on specific requirements and existing infrastructure).
*   **Compute:** EC2 instances (AWS), Compute Engine (GCP), or similar for hosting the NestJS backend and potentially frontend static files.
*   **Database:** Managed database services (e.g., AWS RDS PostgreSQL, Google Cloud SQL for PostgreSQL) for ease of management, scalability, and high availability.
*   **Caching:** Managed Redis service (e.g., AWS ElastiCache for Redis, Google Cloud Memorystore for Redis).
*   **Load Balancing:** Application Load Balancers (ALB) to distribute traffic across multiple instances of the backend.
*   **Content Delivery Network (CDN):** For serving frontend assets and media files (e.g., CloudFront, Cloudflare).

### 6.4. Monitoring and Alerting

*   **Application Performance Monitoring (APM):** Tools like New Relic, Datadog, or AWS CloudWatch for deep insights into application performance.
*   **Log Management:** Centralized log aggregation and analysis (e.g., ELK Stack, Grafana Loki).
*   **Alerting:** Configuration of alerts for critical errors, performance degradation, and security incidents.

### 6.5. Database Migrations

*   A robust database migration tool (e.g., TypeORM Migrations, Prisma Migrate) will be used to manage schema changes in a controlled and versioned manner.

## 7. Project Timeline (High-Level Estimate)

(Note: A detailed timeline will require further breakdown into sprints and task assignments. This is a high-level estimate for major phases.)

*   **Phase 1: Planning & Setup (2-3 weeks)**
    *   Detailed requirements gathering and finalization.
    *   Architecture design and technology stack confirmation.
    *   Database schema design.
    *   Project setup, CI/CD pipeline initial configuration.
*   **Phase 2: Core Backend Development (8-12 weeks)**
    *   Authentication and User Management.
    *   Product and Store Management.
    *   Order and Cart Management.
    *   Payment Integration.
    *   Initial Delivery and Task Management.
    *   Core API development and testing.
*   **Phase 3: Frontend Development - User App (8-12 weeks)**
    *   UI/UX implementation for core user flows.
    *   Integration with backend APIs.
    *   Real-time features (tracking, chat).
*   **Phase 4: Frontend Development - Admin Dashboard (6-8 weeks)**
    *   UI/UX implementation for administrative tasks.
    *   Integration with admin APIs.
    *   Reporting dashboards.
*   **Phase 5: Advanced Features & Refinements (6-10 weeks)**
    *   Food Ordering specialized workflow.
    *   Loyalty Program.
    *   Advanced Search and Filtering.
    *   Scheduled Deliveries.
    *   Comprehensive Chat functionalities.
    *   Performance optimizations and security enhancements.
*   **Phase 6: Testing, QA & Deployment (4-6 weeks)**
    *   Full system testing (integration, E2E, performance, security).
    *   Bug fixing and stabilization.
    *   Deployment to production environment.
    *   User Acceptance Testing (UAT).

## 8. Conclusion

This comprehensive project plan provides a roadmap for developing the Ntumai Delivery App. By adhering to modular design principles, leveraging a robust technology stack like NestJS, and implementing a phased development approach, we aim to deliver a high-quality, scalable, and feature-rich application that meets the diverse needs of its users and administrators. Regular communication, iterative development, and continuous testing will be key to the successful execution of this plan.





### 3.6. Path Aliasing

To maintain a clean and organized import structure, path aliasing will be configured in `tsconfig.json` (for NestJS) and Babel/Metro (for React Native). This will allow for cleaner imports like `@/modules/users` instead of long relative paths, improving code readability and maintainability.

### 6.6. Database Migrations and Seed Data

**Prisma Migrations:** Prisma will be used as the ORM, and its migration capabilities will be leveraged to manage database schema changes in a controlled and versioned manner. This ensures that database updates are applied consistently across all environments.

**Seed Data:** A seeding mechanism will be implemented to populate the database with essential initial data, such as default user roles (customer, driver, vendor, admin), an initial admin user, and sample product data for development and testing purposes.


