# ReserveSpace - Club Reservation System

A full-stack application for managing club space reservations. This platform allows clubs to reserve spaces and administrators to efficiently manage resources.

## Features

- **User Authentication**: Separate login for clubs and administrators
- **Club Dashboard**: View and manage reservations
- **Admin Dashboard**: Approve/reject reservation requests and manage spaces
- **Real-time Updates**: Instant notifications for reservation status changes
- **Persistent Database**: All data is stored in a PostgreSQL database via Supabase

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd reservespace
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up Supabase
   - Create a free account at [Supabase](https://supabase.com/)
   - Create a new project
   - Go to SQL Editor and run the SQL from `supabase/schema.sql`
   - Get your API keys from the API settings page

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploying to Vercel with Supabase (Free)

1. Create a [Vercel account](https://vercel.com/signup) if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Run the following command in the project directory:
   ```bash
   vercel
   ```
4. Follow the prompts to deploy your application
5. Set up environment variables in the Vercel dashboard:
   - NEXTAUTH_SECRET (generate a secure random string)
   - NEXTAUTH_URL (your deployed app URL)
   - NEXT_PUBLIC_SUPABASE_URL (your Supabase URL)
   - NEXT_PUBLIC_SUPABASE_ANON_KEY (your Supabase anon key)

### Alternative: One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Freservespace&env=NEXTAUTH_SECRET,NEXTAUTH_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=API%20keys%20needed%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fyourusername%2Freservespace%23environment-variables)

## Setting Up Supabase

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to the SQL Editor in your Supabase dashboard
4. Copy the contents of `supabase/schema.sql` and run it in the SQL Editor
5. This will create all necessary tables and insert sample data

### Supabase Free Tier Limits

The Supabase free tier includes:
- 500MB database storage
- 1GB file storage
- 50MB file uploads
- 100K monthly active users
- 2GB bandwidth
- 2 projects per organization

These limits are more than enough for a small to medium-sized application.

## Demo Credentials

- **Club User**:
  - Email: club@example.com
  - Password: password123

- **Admin User**:
  - Email: admin@example.com
  - Password: password123

## Future Improvements

- Implement email notifications for reservation status changes
- Add a calendar view for better visualization of reservations
- Implement user registration and profile management
- Add analytics for space usage
- Add real-time updates using Supabase Realtime

## License

This project is licensed under the MIT License - see the LICENSE file for details. 