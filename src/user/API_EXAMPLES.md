# Ntumai User Module - API Examples

These examples demonstrate how to use the User module endpoints. All requests require a valid JWT access token in the `Authorization: Bearer <token>` header.

## 1. Get User Profile

```bash
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 2. Update User Profile

```bash
curl -X PATCH http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "John", "lastName": "Doe"}'
```

## 3. Create Address

```bash
curl -X POST http://localhost:3000/api/v1/users/addresses \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "HOME",
    "address": "Plot 10, Addis Ababa Dr",
    "city": "Lusaka",
    "state": "Lusaka",
    "country": "ZM",
    "postalCode": "10101",
    "latitude": -15.3875,
    "longitude": 28.3228,
    "isDefault": true
  }'
```

## 4. Get Addresses

```bash
curl -X GET http://localhost:3000/api/v1/users/addresses \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 5. Register New Role (e.g., as a DRIVER)

First, request an OTP for the user's registered phone/email:

```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"purpose": "register_role", "email": "user@example.com"}'
```

Then, use the OTP to register the new role:

```bash
curl -X POST http://localhost:3000/api/v1/users/register-role \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "DRIVER",
    "otpCode": "123456",
    "challengeId": "<challenge_id_from_otp_request>"
  }'
```

## 6. Switch Role

```bash
curl -X POST http://localhost:3000/api/v1/users/switch-role \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetRole": "DRIVER"}'
```

