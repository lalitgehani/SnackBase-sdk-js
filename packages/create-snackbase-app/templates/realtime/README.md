# {PROJECT_NAME}

{PROJECT_DESCRIPTION}

This project demonstrates SnackBase's real-time subscription capabilities using the `@snackbase/sdk`.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SnackBase
- **State Management**: Zustand
- **Icons**: Lucide React

## Getting Started

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env` file in the root directory (or copy `.env.example`):

    ```env
    VITE_SNACKBASE_URL=your_snackbase_url
    VITE_SNACKBASE_API_KEY=your_api_key
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Features

- **Real-time Updates**: Automatically receives updates when records are created, updated, or deleted.
- **Connection Status**: Visual indicator of the real-time connection state.
- **Activity Log**: Real-time log of events happening in the system.

## Setup SnackBase

To see real-time updates, make sure you have a collection (e.g., `activities`) in your SnackBase instance. This demo subscribes to all events on the specified collections.

For more information, visit the [SnackBase Documentation](https://docs.snackbase.dev).
