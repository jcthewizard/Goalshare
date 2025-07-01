# Goalshare

A personal goal-tracking application built with React Native and Expo, allowing users to set, track, and manage their goals with milestones.

## Features

- User authentication with Firebase
- Create and track personal goals
- Add milestones to goals with descriptions and images
- Visual progress tracking with completion percentages
- Goal detail view with swipeable interface (Steps & Timeline)
- Milestone completion animations
- Profile management with progress statistics
- Beautiful and intuitive UI with customizable themes

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac users) or Android Studio (for Android development)
- Firebase account (for authentication)
- MongoDB database (for backend)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:jcthewizard/Goalshare.git
cd Goalshare
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd goalshare-backend
npm install
cd ..
```

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication
   - Add your Firebase configuration to `src/firebase/config.ts`

5. Set up Backend:
   - Configure MongoDB connection in `goalshare-backend/.env`
   - Set your JWT secret and other environment variables

## Running the App

1. Start the backend server:
```bash
cd goalshare-backend
npm start
```

2. In a new terminal, start the frontend development server:
```bash
npm start
```

3. Choose your preferred way to run the app:
   - Press `i` to open in iOS simulator
   - Press `a` to open in Android emulator
   - Scan the QR code with Expo Go app on your physical device
   - Press `w` to open in web browser

## Project Structure

```
goalshare-backend/          # Backend API server
├── controllers/            # API controllers
├── middleware/            # Authentication middleware
├── models/               # Database models
├── routes/               # API routes
├── src/
│   └── config/          # Database configuration
└── server.js            # Main server file

src/                     # Frontend React Native app
├── assets/             # Images and other static assets
├── components/         # Reusable UI components
├── contexts/           # React Context providers (Auth, Goals)
├── firebase/           # Firebase configuration
├── navigation/         # Navigation setup (Home & Profile tabs)
├── screens/            # Screen components
│   ├── HomeScreen.tsx         # Main goals list
│   ├── GoalDetailScreen.tsx   # Goal details with milestones
│   ├── AddGoalScreen.tsx      # Create new goals
│   ├── AddMilestoneScreen.tsx # Add milestones to goals
│   ├── ProfileScreen.tsx     # User profile & statistics
│   ├── LoginScreen.tsx       # Authentication
│   └── RegisterScreen.tsx    # User registration
├── theme/              # Theme configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Goals
- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/:id` - Get specific goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Milestones
- `POST /api/goals/:id/milestones` - Add milestone to goal
- `PUT /api/goals/:id/milestones/:milestone_id` - Update milestone
- `DELETE /api/goals/:id/milestones/:milestone_id` - Delete milestone

## Technologies Used

### Frontend
- React Native
- Expo
- Firebase Authentication
- React Navigation
- React Native Paper
- React Native Gesture Handler
- TypeScript

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- CORS

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.