# Dynamic Flyer Platform - Version 2.0

## 🎯 Project Overview

The **Dynamic Flyer Platform** is a premium, multi-tenant SaaS application that has evolved from a single-purpose flyer generator into a comprehensive template management system. It enables **Creators** (designers, marketers, event organizers) to upload flyer designs, define dynamic zones for customization, and share public links for **End-users** to generate personalized flyers.

### What's New in V2.0

- 🔐 **Full Authentication System** - Secure user registration and login
- 🗄️ **Multi-tenant Database** - Each user has their own templates and data
- 🎨 **Template Management** - Create, edit, and share custom flyer templates
- 🔗 **Public Generation** - Share links for others to personalize your templates
- 📊 **Analytics Dashboard** - Track views and generations of your templates
- 🎯 **Premium UX** - Beautiful, modern interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)

### 1. Clone and Install

```bash
git clone <YOUR_GIT_URL>
cd dynamic-flyer-platform
npm install
```

### 2. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the database schema:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Update your environment variables in `src/integrations/supabase/client.ts` with your project credentials

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS
- **Canvas Manipulation**: Fabric.js
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Image Processing**: react-easy-crop

### Database Schema

```sql
-- Core tables
profiles              # User accounts and subscription info
templates             # Flyer templates with frames configuration
template_generations  # Analytics tracking

-- Storage buckets
template-backgrounds  # Template background images
user-uploads         # User uploaded content
generated-flyers     # Final generated flyers
```

### Security

- **Row Level Security (RLS)** on all tables
- **JWT-based authentication** with Supabase Auth
- **Protected routes** for dashboard access
- **Input validation** and sanitization
- **Storage policies** for file access control

## 🎨 User Experience

### For Creators (Template Designers)

1. **Sign Up/Login** - Create account with email/password
2. **Dashboard** - View templates, analytics, and quick actions
3. **Template Editor** - Upload background, define dynamic zones
4. **Share Templates** - Get public links and QR codes
5. **Analytics** - Track views and generations

### For End-Users (Public)

1. **Access Public Link** - No account required
2. **Customize Flyer** - Upload photo, enter text
3. **Real-time Preview** - See changes instantly
4. **Download** - High-quality PNG output

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication forms and layouts
│   ├── dashboard/      # Template management interface
│   ├── editor/         # Canvas-based template editor
│   ├── generator/      # Public flyer generation
│   ├── shared/         # Reusable components
│   └── ui/             # shadcn/ui components
├── hooks/
│   ├── useAuth.ts      # Authentication state management
│   ├── useTemplates.ts # Template operations
│   └── useCanvas.ts    # Canvas utilities
├── lib/
│   ├── supabase.ts     # API functions
│   ├── canvas-utils.ts # Canvas helpers
│   └── validation.ts   # Form validation
├── pages/
│   ├── auth/           # Login/signup pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── TemplateEditor.tsx # Template creation/editing
│   └── PublicGenerator.tsx # Public flyer generation
└── integrations/
    └── supabase/       # Database types and client
```

## 🔄 Development Status

### ✅ Completed (Phase 1-2)

- [x] **Database Schema** - Complete with RLS policies
- [x] **Authentication System** - Sign-up, login, session management
- [x] **API Layer** - Centralized Supabase operations
- [x] **Protected Routes** - Auth-based navigation
- [x] **Beautiful UI** - Modern design with animations

### 🔄 In Progress (Phase 3)

- [ ] **Dashboard Implementation** - Template grid and management
- [ ] **Template Creation Flow** - Step-by-step template builder
- [ ] **Canvas Editor** - Fabric.js integration for frame definition

### 📋 Coming Next (Phase 4-6)

- [ ] **Public Generator** - End-user flyer customization
- [ ] **Analytics Dashboard** - Usage tracking and insights
- [ ] **Premium Features** - QR codes, magic image fit, PDF export

## 🎯 Key Features

### Template Management
- Upload custom flyer backgrounds
- Define image and text frames with drag-and-drop
- Set font properties, colors, and styles
- Save and organize templates

### Public Sharing
- Generate unique shareable links
- QR code generation for easy access
- Mobile-responsive public interface
- No-registration required for end-users

### Analytics & Insights
- Track template views and generations
- Usage analytics per template
- Export and sharing statistics
- User engagement metrics

## 🔧 Configuration

### Environment Variables

Update `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "your-project-url"
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key"
```

### Storage Configuration

The application uses three Supabase storage buckets:
- `template-backgrounds` - Public read, authenticated write
- `user-uploads` - Private access only
- `generated-flyers` - Public read, anyone can insert

## 🤝 Contributing

This project follows a modular architecture with clear separation of concerns:

1. **Components** - Reusable UI components with props interfaces
2. **Hooks** - Custom React hooks for state management
3. **API Layer** - Centralized database operations
4. **Type Safety** - Full TypeScript coverage with Supabase types

## 📊 Performance Goals

- Template creation flow: < 5 minutes
- Public generator load time: < 2 seconds
- Canvas operations: Smooth 60fps
- Uptime target: 99.9%

## 🎨 Design Philosophy

- **Minimalist & Clean** - Focus on content, not UI complexity
- **Intuitive Workflows** - Minimal clicks to achieve goals
- **Responsive Design** - Works beautifully on all devices
- **Accessible** - WCAG compliant with keyboard navigation
- **Premium Feel** - Smooth animations and polish

---

**Legacy V1 Access**: The original UPSA MBA flyer generator remains available at `/editor` for existing users during the transition period.
