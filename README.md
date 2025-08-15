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

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the database schema:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_add_template_categories.sql` (optional)
3. Get your project credentials from Settings → API

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
3. **Deploy**: Click deploy and your app will be live!

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

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

## 💰 Subscription Plans

Our platform offers a range of subscription tiers designed to meet the needs of different users, from individuals to large organizations.

### Individual Plans

#### 🆓 **Free Plan**
The Free Plan is where creativity begins to take shape. With this plan, users can create up to 3 templates per month, perfect for those just starting their design journey or with occasional needs. While exports include a subtle watermark, it's an excellent way to experience the platform's core features without any financial commitment.

#### 🎓 **Student Pro (₵50/month)**
The Student Pro plan is designed for education's creative minds. Students gain access to 30 templates per month and can export up to 150 high-resolution designs without watermarks. This affordable option empowers students to create professional-looking materials for clubs, events, and academic presentations without breaking the bank.

#### 🚀 **Creator Pro (₵100/month)**
The Creator Pro plan is where professional content creation flourishes. With unlimited template creation, 400 monthly exports, and premium features like PDF export and custom font uploads, this plan is perfect for designers, marketers, and content creators who need powerful tools to bring their visions to life and deliver professional results to clients.

### Organization Plans

#### 🏢 **Department Plan (₵200/month)**
The Department Plan transforms how teams collaborate on visual content. With 600 monthly exports, team collaboration features, and custom branding options, this plan helps departments maintain visual consistency while empowering multiple team members to create and modify templates within a unified workspace.

#### ⛪ **Church Plan (₵300/month)**
The Church Plan is a blessing for religious organizations with diverse communication needs. With 1000 monthly exports, specialized event packages, and bulk generation capabilities, churches can efficiently create materials for services, community events, and outreach programs while maintaining a consistent visual identity across all communications.

#### 🎓 **Faculty Plan (₵600/month)**
The Faculty Plan is the comprehensive solution for educational institutions. With 2000 monthly exports, multi-department access, and API integration, this plan allows faculties to centralize their design resources while giving departments the autonomy to create materials that adhere to institutional branding guidelines.

### Special Event Packages

#### 🎓 **Graduation Package (₵400)**
The Graduation Package is a one-time celebration bundle that includes 600 personalized certificates, invitations, and program booklets. This package helps educational institutions create memorable graduation materials with consistent branding and personalization for each graduate.

#### 🎪 **Conference Package (₵600)**
The Conference Package brings professional polish to events with 300 certificates, badges, and promotional flyers. Event organizers can create a cohesive visual experience from registration to completion, enhancing attendee experience and strengthening event branding.

#### 📚 **Semester Package (₵900)**
The Semester Package is the ultimate academic term solution with unlimited personalization for an entire semester. Educational institutions can create all necessary materials—from course outlines to event promotions—with consistent branding and efficient bulk generation capabilities.

### Feature Comparison

| Feature | Free | Student Pro | Creator Pro | Department | Church | Faculty |
|---------|------|-------------|-------------|------------|--------|---------|
| **Monthly Price** | ₵0 | ₵50 | ₵100 | ₵200 | ₵300 | ₵600 |
| **Templates** | 3/month | 30/month | Unlimited | Unlimited | Unlimited | Unlimited |
| **Exports** | 10/month | 150/month | 600/month | 1,200/month | 2,500/month | 6,000/month |
| **High-Res Export** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PDF Export** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Custom Fonts** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Watermark** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Team Members** | 1 | 1 | 1 | 5 | 10 | 20+ |
| **Custom Branding** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Bulk Generation** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Payment Methods

Our platform supports multiple payment methods to accommodate users across Ghana:

1. **Mobile Money** - Pay directly using MTN Mobile Money, Vodafone Cash, or AirtelTigo Money
2. **Credit/Debit Cards** - Secure payments with Visa, Mastercard, or other major cards
3. **Bank Transfer** - Direct bank transfers for organization plans

### How to Upgrade

1. Navigate to **Dashboard → Subscription** in your account
2. Select your desired plan or package
3. Choose your preferred payment method
4. Complete the secure checkout process
5. Enjoy immediate access to your new features!

Your subscription will automatically renew each month unless canceled. You can manage your subscription settings at any time from your dashboard.

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
