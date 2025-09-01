# Queue Management System

A modern React-based queue management system for simulators with real-time updates and timed queue functionality.

## Features

- **Player Registration**: Simple registration form for new players
- **Queue Management**: Add/remove players from simulator queues
- **Timed Queues**: Automatic queue progression with configurable time limits
- **Real-time Updates**: Live queue status and player positions
- **Admin Panel**: Complete management interface for queues, players, and simulators
- **Modern UI**: Dark theme with red accents, optimized for desktop

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern design patterns
- **API**: RESTful backend integration

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Player.tsx      # Player management
│   ├── Queue.tsx       # Queue display and controls
│   ├── Queue.css       # Queue styling
│   └── Simulators.tsx  # Simulator management
├── pages/              # Route-level pages
│   ├── Admin.tsx       # Admin dashboard
│   ├── Register.tsx    # Player registration
│   └── Register.css    # Registration styling
├── services/           # API integration
│   └── api.ts         # Backend API calls
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
- Simple form with name (required) and optional contact fields
- Success feedback and form validation
- Automatic redirect after registration

### Queue Management
- Real-time queue display with player positions
- Add/remove players from queues
- Visual indicators for active players
- Time remaining display for active sessions

### Timed Queues
- Configurable time limits per session
- Automatic progression to next player
- Confirm/missed turn handling
- Live countdown display

### Admin Dashboard
- Complete system overview
- Player, queue, and simulator management
- Real-time status updates every 3 seconds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
