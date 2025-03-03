# Student Hub

A modern web application for university students to access course information, chat with peers, view events, and manage their academic profiles.

## Features

- **Course Search**: Search for courses by code or name
- **Course Details**: View detailed information about each course
- **User Authentication**: Secure login and registration system
- **Profile Management**: Update and manage student profiles
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS with custom CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/student-hub.git
   cd student-hub
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run the development server
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following main tables in Supabase:

- **courses**: Stores course information
- **students**: Stores student profiles
- **events**: Stores university events
- **notifications**: Stores user notifications

## Deployment

This project can be deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Set up the environment variables
4. Deploy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
