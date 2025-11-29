# Fretiko Admin Panel

A comprehensive Next.js 14 admin panel for managing the Fretiko e-commerce platform with role-based access control, department management, and real-time features.

## Features

- ✅ **Authentication System** - Secure JWT-based authentication
- ✅ **Role-Based Access Control** - Super Admin, Department Head, and Staff roles
- ✅ **Department Management** - 5 departments with granular permissions
- ✅ **Dashboard Overview** - Real-time platform statistics and activity
- ✅ **User Management** - View, suspend, and manage user accounts
- ✅ **Order Monitoring** - Track and manage all platform orders
- ✅ **Dispute Resolution** - Handle customer disputes and issues
- ✅ **Content Moderation** - Approve/reject products, services, and content
- ✅ **Logistics Management** - Rider and delivery coordination
- ✅ **Finance Dashboard** - Revenue tracking and payouts
- ✅ **Analytics** - Platform health and performance metrics
- ✅ **Internal Communication** - Memos and reports system
- ✅ **Audit Logging** - Complete staff action tracking

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **State Management:** Zustand + React Query
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Tables:** TanStack Table

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Fretiko backend running on `http://localhost:3000`

### Installation

1. **Navigate to the admin panel directory:**
   ```bash
   cd fretiko-admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   ```
   
   **Note:** `NEXT_PUBLIC_API_URL` is required. If not set, the app will use `http://localhost:3000` as a fallback in development (with a console warning), but will error in production. Always set this variable in production environments.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

### First Login

1. Use the super admin credentials created during backend setup:
   - **Staff ID:** `FTK-2025-0001` (or email: `admin@fretiko.com`)
   - **Password:** Your configured password

2. You'll be prompted to change your password on first login

3. After password change, you'll be redirected to the dashboard

## Project Structure

```
fretiko-admin/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── login/                # Login page
│   │   ├── change-password/      # Change password page
│   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── users/            # User management
│   │   │   ├── orders/           # Order monitoring
│   │   │   ├── disputes/         # Dispute resolution
│   │   │   ├── content/          # Content moderation
│   │   │   ├── logistics/        # Logistics management
│   │   │   ├── finance/          # Finance dashboard
│   │   │   ├── analytics/        # Analytics
│   │   │   ├── memos/            # Memos system
│   │   │   ├── reports/          # Reports system
│   │   │   ├── staff/            # Staff management
│   │   │   └── audit/            # Audit logs
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── card.tsx
│   │   └── layout/               # Layout components
│   │       ├── Sidebar.tsx       # Navigation sidebar
│   │       └── Header.tsx        # Top header
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── lib/
│   │   ├── api/                  # API clients
│   │   │   ├── client.ts         # Axios client
│   │   │   └── staff.ts          # Staff API
│   │   └── utils.ts              # Utility functions
│   └── types/                    # TypeScript types
│       ├── staff.ts
│       └── department.ts
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Flow

### Login
1. User enters staff ID or email + password
2. API call to `/staff/login`
3. Receive access token + refresh token
4. Store tokens in localStorage
5. Fetch staff profile
6. Redirect based on `mustChangePassword` flag

### Protected Routes
1. Check for access token in localStorage
2. If no token → Redirect to `/login`
3. Fetch staff profile
4. Check permissions
5. Render page content

### Token Refresh
- Automatic token refresh on 401 errors
- Redirect to login if refresh fails

## Role-Based Access

### Super Admin (God Mode)
- Full access to all features
- Can create departments and staff
- Views all data across departments

### Department Head
- Elevated permissions within department
- Can view all department staff
- Can review department reports
- Department-filtered data access

### Staff
- Standard department permissions
- Access based on department permission array
- Cannot view other departments' data

## Departments

1. **Admin & Moderators**
   - Content moderation
   - User management
   - Platform policy enforcement

2. **Customer Care**
   - Support tickets
   - User complaints
   - Issue resolution

3. **Logistics**
   - Rider management
   - Delivery tracking
   - Shipping coordination

4. **HR**
   - Staff management
   - Recruitment
   - Performance reviews

5. **Finance**
   - Revenue tracking
   - Payouts
   - Escrow management

## API Integration

The admin panel communicates with the backend API at `http://localhost:3000`:

### Authentication Endpoints
- `POST /staff/login` - Staff login
- `GET /staff/me` - Get current staff profile
- `PATCH /staff/me/password` - Change password

### Staff Management
- `GET /staff` - List all staff
- `POST /staff` - Create staff
- `PATCH /staff/:id` - Update staff
- `DELETE /staff/:id` - Deactivate staff

### Departments
- `GET /departments` - List departments
- `GET /departments/permissions` - Get all permissions

### More endpoints available for:
- Memos
- Reports
- Audit logs
- User management
- Order monitoring
- And more...

## Security Features

- JWT token authentication
- Automatic token refresh
- httpOnly cookie support (optional)
- Permission-based route guards
- Role-based access control
- Audit logging of all actions

## Development Notes

### Adding New Pages

1. Create page in `src/app/dashboard/[feature]/page.tsx`
2. Add navigation item to `Sidebar.tsx`
3. Set required permissions
4. Implement API calls
5. Add to routing

### Adding New API Endpoints

1. Create API methods in `src/lib/api/[module].ts`
2. Define TypeScript types in `src/types/`
3. Use in components with React Query
4. Handle errors appropriately

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow shadcn/ui component patterns
- Use dark mode compatible colors
- Maintain consistent spacing

## Troubleshooting

### "Failed to fetch profile" error
- Ensure backend is running on `http://localhost:3000`
- Check if access token is valid
- Verify CORS settings on backend

### "Insufficient permissions" error
- Check staff role and department permissions
- Verify permission requirements in `Sidebar.tsx`
- Contact super admin to adjust permissions

### Page not loading
- Clear browser cache and localStorage
- Check console for errors
- Verify API endpoints are responding

## Production Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Set these in your production environment:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

### Deployment Platforms

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Self-hosted with PM2**

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - Fretiko Platform

## Support

For support, contact your system administrator or the development team.

---

**Version:** 1.0.0
**Last Updated:** 2025-10-28
**Status:** Production Ready
