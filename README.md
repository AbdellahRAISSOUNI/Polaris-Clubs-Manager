# Polaris Clubs Manager

A comprehensive club management system for universities and organizations, allowing clubs to reserve spaces, manage events, and administrators to oversee all activities.

## Features

- **Club Dashboard**: Clubs can view and manage their reservations
- **Space Reservations**: Book spaces for club activities and events
- **Admin Panel**: Administrators can approve/reject reservations and manage clubs
- **Analytics**: Track space utilization and club activities
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Supabase (PostgreSQL + Auth)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/polaris-clubs-manager.git
   cd polaris-clubs-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the environment variables
4. Deploy!

## License

MIT 