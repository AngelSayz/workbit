# WorkBit Mobile App

A clean, modern React Native app for WorkBit workspace management built with Expo and NativeWind.

## 🚀 Features

- ✅ **Authentication** - Login with backend integration
- ✅ **Dashboard** - Overview of spaces and reservations  
- ✅ **Spaces** - Browse available workspaces by date
- ✅ **Reservations** - View and manage user reservations
- ✅ **Profile** - User information and logout
- ✅ **NativeWind** - Tailwind CSS for React Native
- ✅ **Real API Integration** - Connected to Azure backend

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Styling**: NativeWind (Tailwind CSS for RN)
- **Navigation**: React Navigation v6
- **State Management**: React Context
- **Storage**: AsyncStorage
- **Backend**: Azure-hosted .NET API

## 📱 Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.js       # Custom button with NativeWind
│   ├── Input.js        # Form input component
│   └── LoadingScreen.js
├── screens/            # Main app screens
│   ├── LoginScreen.js  # Authentication
│   ├── HomeScreen.js   # Dashboard
│   ├── SpacesScreen.js # Available spaces
│   ├── ReservationsScreen.js # User reservations
│   └── ProfileScreen.js # User profile
├── navigation/         # Navigation setup
│   └── AppNavigator.js # Main navigation flow
├── context/           # React Context providers
│   └── AuthContext.js # Authentication state
├── services/          # API and external services
│   └── api.js         # Backend API integration
└── utils/             # Utility functions
```

## 🔌 API Integration

The app connects to: `https://workbit-api.azurewebsites.net`

### Available Endpoints:
- `POST /login` - User authentication
- `GET /api/Users` - User management
- `GET /api/AvailableSpaces/{date}` - Available spaces by date
- `GET /api/Reservations` - Reservation management
- `POST /api/Reservations/createResevation` - Create new reservation
- `POST /api/Reservations/update` - Update reservation status

## 🎯 User Features

### 🏠 Dashboard
- Welcome message with user name
- Quick action buttons
- Today's available spaces preview
- Recent reservations overview
- Pull-to-refresh functionality

### 🏢 Spaces
- Browse available spaces by date
- Date navigation (previous/next day)
- Space details (name, location, capacity)
- Visual capacity indicators
- Status badges

### 📅 Reservations  
- View all user reservations
- Filter by status (pending, confirmed, cancelled)
- Cancel upcoming reservations
- Reservation details and timestamps
- Floating action button for new reservations

### 👤 Profile
- User information display
- App version and server status
- Help and support options
- Secure logout functionality

## 🔮 Future Implementation: Cubicles System

### 📋 Prepared Architecture

The app is designed to easily accommodate a cubicles/workspace grid system:

#### Database Preparation
- `spaces` table includes `position_x` and `position_y` columns
- Ready for grid-based layout implementation

#### Planned Features
- **Grid View**: Visual workspace layout with real-time status
- **Interactive Map**: Touch-to-select workspace positions  
- **Real-time Updates**: Live workspace availability
- **Visual Indicators**: Color-coded status (available, occupied, reserved)
- **Zoom & Pan**: Navigate large office layouts
- **Workspace Details**: Quick info popups on touch

#### Technical Preparation
- API structure supports position-based queries
- Component architecture ready for grid components
- State management prepared for real-time updates
- NativeWind styling system supports complex layouts

## 🔧 Configuration

### NativeWind Setup
- Tailwind CSS configured for React Native
- Custom color scheme in `tailwind.config.js`
- Global styles in `global.css`

### Authentication Flow
- Persistent login state with AsyncStorage
- Automatic session restoration
- Secure logout with data cleanup

## 🐛 Known Limitations

- Reservation creation form - To be implemented
- Space details screen - Coming soon
- Push notifications - Future enhancement
- Offline mode - Future consideration

## 📈 Performance

- Zero dependencies conflicts ✅
- Clean React Native StyleSheet fallbacks
- Optimized API calls with loading states
- Smooth navigation transitions
- Efficient memory usage

---

**Version**: 2.0.0  
**Backend**: https://workbit-api.azurewebsites.net  
**Platform**: React Native (iOS, Android, Web)  
**Built for**: Workspace management and reservation system 