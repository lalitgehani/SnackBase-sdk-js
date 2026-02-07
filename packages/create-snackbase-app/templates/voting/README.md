# {PROJECT_NAME}

A feature request and voting application powered by [SnackBase](https://snackbase.io). Features email authentication, real-time updates, and a voting system for feature requests.

## Features

- **Authentication**: Email/password registration and login using `@snackbase/sdk`
- **Feature Submission**: Users can submit new feature requests
- **Voting System**: Users can upvote features (one vote per user per feature)
- **Real-Time Updates**: Instant updates using SnackBase subscriptions
- **Responsive Design**: Clean UI built with Tailwind CSS v4

## Prerequisites

1.  **SnackBase server** running (Locally or Cloud)
2.  **Collection setup**: You'll need a `features` collection in your SnackBase account.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
VITE_SNACKBASE_URL=http://localhost:8000
```

### 3. Create the "features" Collection

You can create the collection using the SnackBase Admin UI or via API.

**API Example:**

First, login as admin to get an authentication token:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "SY0000",
    "email": "admin@admin.com",
    "password": "Admin@123456"
  }'
```

Then create the collection:

```bash
curl -sL -X POST http://localhost:8000/api/v1/collections/ \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "features",
    "schema": [
      {
        "name": "title",
        "type": "text",
        "required": true
      },
      {
        "name": "description",
        "type": "text",
        "required": true
      },
      {
        "name": "votes",
        "type": "number",
        "default": 0
      },
      {
        "name": "status",
        "type": "text",
        "default": "open"
      },
      {
        "name": "voted_by",
        "type": "json",
        "default": "[]"
      }
    ]
  }'
```

### 4. Configure Collection Permissions

```bash
curl -X PUT http://localhost:8000/api/v1/collections/features/rules \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "list_rule": "",
    "view_rule": "",
    "create_rule": "",
    "update_rule": "",
    "delete_rule": "created_by = @request.auth.id",
    "list_fields": "*",
    "view_fields": "*",
    "create_fields": "[\"title\", \"description\"]",
    "update_fields": "[\"votes\", \"voted_by\"]"
  }'
```

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## License

MIT
