# Practice - React Vite CRUD Application

A simple practice repository for building CRUD (Create, Read, Update, Delete) applications using React and Vite.

## Project Structure

```
practice/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Loader.tsx
│   │   ├── items/
│   │   │   ├── ItemList.tsx          # Display list of items (Read)
│   │   │   ├── ItemCreate.tsx        # Form to create new item (Create)
│   │   │   ├── ItemEdit.tsx          # Form to edit existing item (Update)
│   │   │   ├── ItemDelete.tsx        # Confirmation for item deletion (Delete)
│   │   │   └── ItemCard.tsx          # Individual item display component
│   │   └── layout/
│   │       └── Layout.tsx            # Main layout wrapper
│   ├── services/
│   │   └── api.ts                    # API service for CRUD operations
│   ├── hooks/
│   │   └── useItems.ts               # Custom hooks for item management
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── utils/
│   │   └── helpers.ts                # Utility functions
│   ├── pages/
│   │   ├── Home.tsx                  # Home page
│   │   ├── Items.tsx                 # Items listing page
│   │   └── NotFound.tsx              # 404 page
│   ├── App.tsx                       # Main App component with routing
│   ├── App.css                       # App styles
│   ├── main.tsx                      # Application entry point
│   └── index.css                     # Global styles
├── public/                           # Static assets
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Directory Description

### `/src/components/`
Contains all React components organized by feature:
- **common/**: Reusable UI components (Header, Footer, Loader)
- **items/**: CRUD components for managing items
  - `ItemList.tsx`: Displays all items with read functionality
  - `ItemCreate.tsx`: Form for creating new items
  - `ItemEdit.tsx`: Form for updating existing items
  - `ItemDelete.tsx`: Delete confirmation component
  - `ItemCard.tsx`: Individual item display card
- **layout/**: Layout components for page structure

### `/src/services/`
API service layer for backend communication:
- `api.ts`: Contains functions for all CRUD operations (GET, POST, PUT, DELETE)

### `/src/hooks/`
Custom React hooks:
- `useItems.ts`: Hook for managing item state and CRUD operations

### `/src/types/`
TypeScript type definitions and interfaces:
- `index.ts`: Type definitions for items and API responses

### `/src/utils/`
Utility functions and helpers:
- `helpers.ts`: Common utility functions (validation, formatting, etc.)

### `/src/pages/`
Page-level components that use routing:
- `Home.tsx`: Landing page
- `Items.tsx`: Main items page with list view
- `NotFound.tsx`: 404 error page

## CRUD Operations

### Create
- Component: `ItemCreate.tsx`
- Purpose: Form to add new items
- API: POST request to create endpoint

### Read
- Component: `ItemList.tsx`
- Purpose: Display all items or single item details
- API: GET request to fetch items

### Update
- Component: `ItemEdit.tsx`
- Purpose: Form to edit existing items
- API: PUT/PATCH request to update endpoint

### Delete
- Component: `ItemDelete.tsx`
- Purpose: Delete confirmation and removal
- API: DELETE request to delete endpoint

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Key Dependencies

- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios** or **Fetch API**: HTTP requests for CRUD operations

## Best Practices

1. **Component Organization**: Keep components focused and single-purpose
2. **State Management**: Use custom hooks or context for shared state
3. **Type Safety**: Define TypeScript interfaces for all data structures
4. **API Layer**: Centralize API calls in the services directory
5. **Error Handling**: Implement proper error handling for all CRUD operations
6. **Loading States**: Show loading indicators during async operations
7. **Form Validation**: Validate user input before submission
