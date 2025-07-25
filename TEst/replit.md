# Telegram Chatbot Builder Web Platform

## Overview

This is a full-stack web application for creating and managing Telegram chatbots without coding. The platform allows users to build custom chatbots with visual menu builders, manage bot settings, and track analytics. Built with modern technologies including React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL storage
- **Password Security**: bcrypt for hashing
- **API Design**: RESTful JSON APIs

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe queries
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Components

### Authentication System
- Session-based authentication using express-session
- Secure password hashing with bcrypt
- User registration and login with form validation
- Protected routes with authentication middleware

### Bot Management
- Bot creation with Telegram API integration
- Visual menu builder for creating bot interactions
- Bot settings and customization panel
- Real-time bot preview functionality

### Database Schema
- **Users**: Core user accounts with credentials
- **Bots**: Bot configurations including tokens and menu structures
- **Bot Analytics**: Usage statistics and metrics
- **Bot Interactions**: Conversation logs and user interactions

### UI Components
- Responsive design with mobile-first approach
- Component library using shadcn/ui and Radix UI
- Dark/light theme support via CSS variables
- Toast notifications for user feedback

## Data Flow

1. **User Authentication**: Users register/login → session created → protected routes accessible
2. **Bot Creation**: User provides bot token → validates with Telegram → stores configuration
3. **Menu Building**: Visual editor creates menu structure → stored as JSON in database
4. **Bot Interactions**: Telegram webhooks → process messages → respond based on menu structure
5. **Analytics**: User interactions logged → aggregated for dashboard display

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility
- **drizzle-orm**: Type-safe database queries and migrations
- **express**: Web server framework
- **bcrypt**: Password hashing
- **zod**: Runtime type validation

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code formatting and linting

### Telegram Integration
- Telegram Bot API for bot management
- Webhook support for real-time message processing
- Bot token validation and configuration

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild compiles TypeScript server to `dist/index.js`
- Single deployment artifact containing both frontend and backend

### Environment Configuration
- `NODE_ENV`: Environment mode (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- Session secrets and Telegram API configurations

### Database Management
- Drizzle migrations for schema updates
- Connection pooling for production scalability
- Automatic schema synchronization with `db:push`

### Production Considerations
- Static file serving for frontend assets
- Express error handling middleware
- Database connection management
- Session persistence across server restarts

The application follows a monorepo structure with shared schemas and types between frontend and backend, ensuring type safety across the entire stack. The architecture supports both development and production environments with appropriate tooling and configuration for each.