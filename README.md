# Queue Management System

A modern React-based queue management system for simulators with real-time updates and timed queue functionality.

## Features

- **Player Registration**: Simple registration form for new players
- **Queue Management**: Add/remove players from simulator queues
- **Timed Queues**: Automatic queue progression with configurable time limits
- **Real-time Updates**: Live queue status and player positions
- **AC Launcher Integration**: WebSocket-based communication with Assetto Corsa for automated game session management
- **Admin Panel**: Complete management interface for queues, players, and simulators
- **Modern UI**: Dark theme with red accents, optimized for desktop

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern design patterns
- **API**: RESTful backend integration
- **WebSocket**: Real-time communication with AC Launcher (port 8090)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── F1Car.tsx       # F1 racing car animation
│   ├── Player.tsx      # Player management
│   ├── Queue.tsx       # Queue display and controls
│   ├── Simulators.tsx  # Simulator management
│   ├── TimePatterns.tsx # Time pattern management
│   └── UserManagement.tsx # User management
├── pages/              # Route-level pages
│   ├── Admin.tsx       # Admin dashboard
│   ├── Login.tsx       # User authentication
│   ├── Register.tsx    # Player registration
│   └── Seller.tsx      # Seller interface
├── services/           # API integration and configuration
│   ├── acLauncher.ts  # AC Launcher WebSocket service
│   ├── api.ts         # Backend API calls
│   └── config.ts      # API configuration
├── styles/             # Centralized styling
│   ├── components/    # Component-specific styles
│   │   ├── F1Car.css
│   │   └── Queue.css
│   ├── pages/         # Page-specific styles
│   │   ├── Login.css
│   │   ├── Register.css
│   │   └── Seller.css
│   ├── App.css        # Main app styles
│   └── index.css      # Global styles
├── types/              # TypeScript type definitions
│   └── index.ts       # Centralized types
├── utils/              # Utility functions
│   └── validation.ts  # Input validation and sanitization
└── App.tsx            # Main app with routing
```

## Routes

- `/` - Redirects to registration
- `/register` - Player registration form
- `/admin` - Admin dashboard with full queue management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running on `http://localhost:3000`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd my-queue-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend API Requirements

The frontend expects a REST API with the following endpoints:

- `GET /players` - List all players
- `POST /players` - Create new player
- `GET /simulators` - List all simulators
- `POST /simulators` - Create new simulator
- `GET /queue/:simulatorId` - Get queue for simulator
- `POST /queue` - Add player to queue
- `DELETE /queue/:id` - Remove player from queue
- `DELETE /simulators/:id` - Delete simulator
- `POST /timed-queue/:simulatorId/start` - Start timed queue
- `GET /timed-queue/:simulatorId/status` - Get queue status
- `POST /timed-queue/:simulatorId/next` - Process next player
- `POST /timed-queue/:id/confirm` - Confirm player turn
- `POST /timed-queue/:id/missed` - Handle missed turn

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Player Registration
- Simple form with name (required) and optional contact fields (email, phone, instagram)
- Success feedback and form validation
- Modern dark theme interface

### Queue Management
- Real-time queue display with player positions (updates every second)
- Add/remove players from queues
- Visual status indicators ("jogando" in green, "aguardando" in red)
- Time remaining display for both waiting and active sessions
- Reverse queue order (current player at top)

### Timed Queues
- Two-phase system: confirmation phase (3 minutes) + play phase (5 minutes)
- Manual confirmation required before play timer starts
- Confirm/missed turn handling with proper status management
- Live countdown display in MM:SS format
- Automatic queue progression after turn completion

### AC Launcher Integration
- **WebSocket Communication**: Direct connection to AC Launcher on port 8090
- **Automated Game Setup**: Automatic player, car, and track configuration
- **Session Management**: Start/stop game sessions programmatically
- **Real-time Status**: Monitor AC game status and connection health
- **Protocol Support**: Full AC communication protocol implementation (setplayer, setcar, settrack, start, isacactive)
- **PC IP Management**: Configure simulator PC IP addresses for LAN communication
- **Error Handling**: Robust connection management with automatic reconnection

### Admin Dashboard
- Complete system overview with simulator management
- Player, queue, and simulator CRUD operations
- Delete simulator functionality
- Real-time status updates with live timers
- Modern desktop-optimized interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
