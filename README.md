# HackBuddy - Hackathon Team Formation Platform

HackBuddy is a modern web application built with Next.js that helps hackathon participants find teammates based on their skills, interests, and project preferences. It uses VAPI for natural conversation-based onboarding and profile creation.

## Features

- 🎙️ Natural conversation-based onboarding using VAPI
- 👥 Smart team matching based on skills and interests
- 📊 Project experience tracking
- 🤝 Team formation preferences
- 🔒 Secure authentication with Supabase

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (Supabase)
- **AI/ML**: VAPI for conversation processing
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/hackbuddy.git
cd hackbuddy
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_VAPI_API_KEY`

4. Run database migrations
```bash
# Using Supabase CLI
supabase migration up
```

5. Start the development server
```bash
npm run dev
```

## Database Schema

### participant_profiles
- Basic user information
- Skills and interests
- Social links

### participant_projects
- Past project experience
- Technologies used
- Project descriptions

### participant_preferences
- Team size preferences
- Required skills
- Flexibility in team formation

### participant_conversations
- Raw conversation data from VAPI
- Session tracking
- Timestamp information

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.