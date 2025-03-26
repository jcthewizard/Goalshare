# GoalShare API Routes

## Authentication Routes

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/auth/register` | `POST` | Register a new user | No |
| `/api/auth/login` | `POST` | Login with email and password | No |
| `/api/auth/me` | `GET` | Get current user | Yes |
| `/api/auth/logout` | `POST` | Logout user | Yes |

## User Routes

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/users/profile` | `GET` | Get user profile | Yes |
| `/api/users/profile` | `PUT` | Update user profile | Yes |

## Goal Routes

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/goals` | `GET` | Get all goals for current user | Yes |
| `/api/goals` | `POST` | Create a new goal | Yes |
| `/api/goals/:id` | `GET` | Get goal by ID | Yes |
| `/api/goals/:id` | `PUT` | Update a goal | Yes |
| `/api/goals/:id` | `DELETE` | Delete a goal | Yes |
| `/api/goals/:id/milestones` | `POST` | Add milestone to goal | Yes |
| `/api/goals/:id/milestones/:milestone_id` | `PUT` | Update milestone | Yes |
| `/api/goals/:id/milestones/:milestone_id` | `DELETE` | Delete milestone | Yes |

## Social Routes

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/social/feed` | `GET` | Get activity feed | Yes |

## Authentication

Most endpoints require authentication. Include a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Response Format

All responses are in JSON format. Successful responses typically include the data requested, while error responses include an error message.

### Success Response

```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Error Response

```json
{
  "message": "Error message here"
}
``` 