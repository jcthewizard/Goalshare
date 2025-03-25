# Goalshare

A social goal-tracking application built with React Native and Expo, allowing users to set, track, and share their goals with friends.

## Features

- User authentication with Firebase
- Create and track personal goals
- Add milestones to goals
- Social feed to see friends' goals
- Comment and interact with friends' goals
- Profile management
- Beautiful and intuitive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac users) or Android Studio (for Android development)
- Firebase account (for authentication)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:jcthewizard/Goalshare.git
cd Goalshare
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication
   - Add your Firebase configuration to `src/firebase/config.ts`

## Running the App

1. Start the development server:
```bash
npm start
```

2. Choose your preferred way to run the app:
   - Press `i` to open in iOS simulator
   - Press `a` to open in Android emulator
   - Scan the QR code with Expo Go app on your physical device
   - Press `w` to open in web browser

## Project Structure

```
src/
├── assets/         # Images and other static assets
├── components/     # Reusable UI components
├── contexts/       # React Context providers
├── firebase/       # Firebase configuration
├── navigation/     # Navigation setup
├── screens/        # Screen components
├── theme/          # Theme configuration
└── types/          # TypeScript type definitions
```

## Technologies Used

- React Native
- Expo
- Firebase Authentication
- React Navigation
- React Native Paper
- TypeScript

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.