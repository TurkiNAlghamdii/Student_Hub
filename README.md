# Student Hub 🎓

Hey there! Welcome to Student Hub - a one-stop platform I built to make student life easier. This app helps students keep track of courses, chat with classmates, calculate GPA, and stay on top of university events and notifications.

## What can you do with Student Hub?

- 📚 **Browse and search courses** - Find what you need without digging through university websites
- 💬 **Chat** - Discussions about the courses
- 📊 **Calculate your GPA** - Keep track of your academic progress
- 📅 **Check academic calendar** - Never miss important university dates
- 🔔 **Get notifications** - Stay updated with announcements and events
- 🌓 **Switch between light/dark modes** - Easy on the eyes, day or night

## Tech we used

Built this with some cool modern tech:

- **Next.js & React** - For a fast, responsive frontend
- **Supabase** - Handles our database and authentication
- **TailwindCSS** - Makes everything look good without tons of custom CSS
- **TypeScript** - Keeps the code clean and maintainable

## About this app

This is a private application developed for internal use. It's not intended for public distribution or installation.

## Project structure

- `/src/components` - Reusable UI components
- `/src/contexts` - React context providers for state management
- `/src/lib` - Utility functions and API clients
- `/src/pages` - Application routes and API endpoints
- `/src/styles` - Global styles and theme configuration

## Database Schema

The app uses these main tables in Supabase:

- **courses** - Course information and details
- **students** - Student profiles and preferences
- **events** - University events and deadlines
- **notifications** - User notifications and alerts

## Theme System

The app features a robust theme system with both light and dark modes:

- Automatically detects user's system preference on first visit
- Persists theme preference in localStorage
- Prevents flash of incorrect theme during page navigation
- Seamlessly transitions between themes with smooth animations
- All components are theme-aware with consistent styling

## Development Notes

This is an internal project with comprehensive documentation in the codebase:

- All components have detailed JSDoc comments
- Context providers include usage examples
- Utility functions are well-documented
- CSS includes explanatory comments for theming

## License

This project is open source and available under the MIT License.

---

Built with ❤️ for students, by students
