Authentication APIs
User Authentication
1. Register User

Endpoint: POST /api/auth/register

Description: Register a new user using either phone number or email. UI can offer a pill switch for signup via email or phone number.

Request:

{
  "phoneNumber": "string",        // required if using phone
  "email": "string",              // required if using email
  "countryCode": "string",        // required
  "deviceId": "string",           // optional, for analytics
  "deviceType": "string"          // optional, for analytics
}


Response:

{
  "success": true,
  "message": "OTP sent successfully",
  "requestId": "string"
}


Notes: Creates a draft user for onboarding.

2. Verify OTP

Endpoint: POST /api/auth/verify-otp

Description: Verify OTP sent to phone or email. Used on login or re-registration (e.g., switching roles).

Request:

{
  "phoneNumber": "string",       // full phone with country code OR
  "email": "string",
  "otp": "string",
  "requestId": "string"          // optional
}


Response:

{
  "success": true,
  "isNewUser": true,
  "token": "string"              // Only for existing users
}

3. Complete Registration

Endpoint: POST /api/auth/complete-registration

Description: Complete registration after OTP verification.

Request:

{
  "tokenID": "string",
  "password": "string",
  "phone": "string",            // OR email: "string"
  "userType": "string"          // e.g., customer, rider, seller
}


Response:

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

4. Login

Endpoint: POST /api/auth/login

Description: Authenticate user with phone/email and password or OTP.

Request:

{
  "phoneNumber": "string",      // OR
  "countryCode": "string",      // required if phone
  "email": "string",            // optional
  "otp": "string",              // optional
  "deviceId": "string",
  "deviceType": "string"
}


Response:

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

5. Social Login

(Ignore for now; implementation postponed)

6. Forgot Password

Endpoint: POST /api/auth/forgot-password

Description: Initiate password reset process.

Request:

{
  "phoneNumber": "string",     // OR
  "countryCode": "string",
  "email": "string"
}


Response:

{
  "success": true,
  "message": "OTP sent successfully",
  "requestId": "string"
}

7. Reset Password

Endpoint: POST /api/auth/reset-password

Description: Reset password after OTP verification.

Request:

{
  "phoneNumber": "string",     // OR email: "string"
  "countryCode": "string",
  "otp": "string",
  "newPassword": "string",
  "requestId": "string"
}


Response:

{
  "success": true,
  "message": "Password reset successfully"
}

8. Refresh Token

Endpoint: POST /api/auth/refresh-token

Description: Get a new access token using refresh token.

Request:

{
  "refreshToken": "string"
}


Response:

{
  "success": true,
  "token": "string",
  "refreshToken": "string"
}

9. Logout

Endpoint: POST /api/auth/logout

Description: Invalidate user’s current session.

Request:

{
  "deviceId": "string"
}


Response:

{
  "success": true,
  "message": "Logged out successfully"
}

User Profile APIs
Profile Management
10. Get User Profile

Endpoint: GET /api/users/profile

Description: Get current user’s profile.

Response:

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
      "type": "string",       // home, work, other
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "latitude": "number",
      "longitude": "number",
      "isDefault": true
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}

11. Update User Profile

Endpoint: PUT /api/users/profile

Description: Update user profile information.

Request:

{
  "name": "string",
  "email": "string",
  "profileImage": "string"
}


Response:

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

12. Change Password

Endpoint: PUT /api/users/change-password

Description: Change user’s password.

Request:

{
  "tokenid": "string",
  "currentPassword": "string",
  "newPassword": "string"
}


Response:

{
  "success": true,
  "message": "Password changed successfully"
}

13. Upload Profile Image

Endpoint: POST /api/users/upload-profile-image

Description: Upload profile image (returns image URL if using CDN).

Request: Multipart form data with image file.

Response:

{
  "success": true,
  "imageUrl": "string"
}

Address Management
14. Add Address

Endpoint: POST /api/users/addresses

Description: Add a new address.

Request:

{
  "tokenid": "string",
  "type": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "isDefault": true
}


Response:

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
    "isDefault": true,
    "createdAt": "string"
  }
}

15. Update Address

Endpoint: PUT /api/users/addresses/{addressId}

Description: Update an existing address.

Request:

{
  "tokenid": "string",
  "type": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "latitude": "number",
  "longitude": "number",
  "isDefault": true
}


Response:

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
    "isDefault": true,
    "updatedAt": "string"
  }
}

16. Delete Address

Endpoint: DELETE /api/users/addresses/{addressId}

Description: Delete an address.

Request:

{
  "tokenid": "string"
}


Response:

{
  "success": true,
  "message": "Address deleted successfully"
}

17. Get All Addresses

Endpoint: GET /api/users/addresses

Description: Get all addresses for the current user.

Request:

{
  "tokenid": "string"
}


Response:

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
      "isDefault": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
