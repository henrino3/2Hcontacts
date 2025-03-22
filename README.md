# HContacts - Cross-Platform Contact Management App

A comprehensive contact management solution built with React Native and Node.js, offering seamless synchronization across devices and integration with social media platforms.

## Features

- 📱 Cross-platform support (iOS, Android)
- 🔄 Offline functionality with sync
- 🔒 Secure authentication system
- 👥 Comprehensive contact management
- 🔍 Advanced search and filtering
- 🔗 Social media integration
- 📥 Contact import/export capabilities
- 🔄 LinkedIn synchronization

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- Redux/Redux Toolkit
- React Navigation
- SQLite/Realm (local storage)

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- REST API

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/hcontacts.git
cd hcontacts
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Environment Setup
```bash
# Backend (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3000

# Frontend (.env)
API_URL=http://localhost:3000
```

4. Start the development servers
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Project Structure

```
project-structure
├── frontend/                   # React Native app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── screens/           # App screens
│   │   ├── navigation/        # Navigation configuration
│   │   ├── services/          # API and service integrations
│   │   ├── store/            # State management
│   │   ├── utils/            # Utility functions
│   │   └── hooks/            # Custom React hooks
│   └── App.tsx               # Main app component
│
├── backend/                   # Node.js/Express server
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   └── utils/          # Utility functions
│   └── server.ts            # Server entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/) 