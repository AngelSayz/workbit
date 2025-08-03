# WorkBit Backend - Node.js + Express

A modern, scalable backend for the WorkBit space management system, built with Node.js, Express, Supabase (PostgreSQL), MongoDB Atlas, and MQTT support.

## 🚀 Features

- **Dual Database Architecture**: Supabase (PostgreSQL) for main data, MongoDB for analytics & caching
- **Real-time Communication**: MQTT integration for IoT devices and real-time updates
- **Authentication**: JWT-based authentication with role-based access control
- **API Compatibility**: Full compatibility with existing C# backend endpoints
- **Health Monitoring**: Comprehensive health checks and metrics
- **Rate Limiting**: Built-in API rate limiting and security
- **Scalable**: Designed for cloud deployment on Render/Heroku

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- MongoDB Atlas account and cluster
- MQTT broker (optional - HiveMQ, Mosquitto, etc.)

## 🛠️ Installation

### 1. Clone and Setup

```bash
git clone <your-repo>
cd workbit_back
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Supabase Configuration (SQL Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MongoDB Atlas Configuration (NoSQL Database)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workbit?retryWrites=true&w=majority

# MQTT Configuration (optional)
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=workbit-backend

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

#### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema from `/database.sql` in Supabase SQL Editor
3. Update your `.env` with Supabase credentials

#### MongoDB Atlas Setup  
1. Create a MongoDB Atlas cluster
2. Create a database user and get the connection string
3. Update `MONGODB_URI` in `.env`

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📚 API Documentation

### Authentication Endpoints
```
POST   /login                    # User login
POST   /api/auth/login           # Alternative login endpoint  
POST   /api/auth/register        # User registration
POST   /api/auth/logout          # User logout
```

### User Management
```
GET    /api/users               # Get all users (admin only)
GET    /api/users/profile       # Get current user profile
GET    /api/users/by-role/:role # Get users by role
GET    /api/users/:id           # Get specific user
PUT    /api/users/:id           # Update user (admin only)
DELETE /api/users/:id           # Delete user (admin only)
```

### Space Management
```
GET    /api/spaces                    # Get all spaces
GET    /api/spaces/available/:date    # Get available spaces for date
GET    /api/spaces/:id                # Get specific space details
PUT    /api/spaces/:id/status         # Update space status
GET    /api/spaces/status/summary     # Get spaces status summary
```

### Reservations
```
GET    /api/reservations              # Get reservations
GET    /api/reservations/by-date/:date # Get reservations by date
GET    /api/reservations/:id          # Get specific reservation
POST   /api/reservations              # Create new reservation  
PUT    /api/reservations/:id/status   # Update reservation status
DELETE /api/reservations/:id          # Cancel reservation
```

### Access Logs
```
GET    /api/access-logs               # Get access logs with filtering
POST   /api/access-logs/entry         # Record space entry
POST   /api/access-logs/exit          # Record space exit
GET    /api/access-logs/user/:userId  # Get logs for specific user
GET    /api/access-logs/space/:spaceId # Get logs for specific space
```

### Grid Management (Cubicles Layout)
```
GET    /api/grid                      # Get current grid layout
PUT    /api/grid                      # Update grid dimensions (admin only)
GET    /api/grid/spaces               # Get spaces with positions
PUT    /api/grid/spaces/:id/position  # Update space position
PUT    /api/grid/spaces/positions     # Bulk update positions (admin only)
```

### Code Cards Management (RFID Access)
```
GET    /api/cards                     # Get all access cards
GET    /api/cards/available           # Get unassigned cards
POST   /api/cards                     # Create new card (admin only)
PUT    /api/cards/:id                 # Update card (admin only)
DELETE /api/cards/:id                 # Delete card (admin only)
PUT    /api/cards/assign/:cardId/user/:userId  # Assign card to user
DELETE /api/cards/unassign/user/:userId       # Unassign card from user
POST   /api/cards/bulk                # Bulk create cards (admin only)
```

### Roles Management
```
GET    /api/roles                     # Get all roles (admin only)
GET    /api/roles/:id                 # Get specific role with users
POST   /api/roles                     # Create new role (admin only)
PUT    /api/roles/:id                 # Update role (admin only)
DELETE /api/roles/:id                 # Delete role (admin only)
GET    /api/roles/stats/overview      # Get role statistics
```

### Analytics & Reports
```
GET    /api/analytics/spaces          # Space usage analytics
GET    /api/analytics/users           # User activity analytics
GET    /api/analytics/system          # System metrics
GET    /api/analytics/events          # Event logs with analytics
GET    /api/analytics/reports/occupancy # Occupancy reports
GET    /api/analytics/dashboard/overview # Dashboard overview
```

### IoT Sensors & Devices
```
GET    /api/sensors/readings/:spaceId # Get sensor readings for space
POST   /api/sensors/readings          # Add new sensor reading
GET    /api/sensors/alerts            # Get environmental alerts
PUT    /api/sensors/alerts/:id/resolve # Resolve alert
GET    /api/sensors/devices           # Get IoT devices
PUT    /api/sensors/devices/:deviceId/status # Update device status
GET    /api/sensors/summary           # Sensor data summary
```

### Device Management
```
GET    /api/devices                   # Get all devices
GET    /api/devices/:deviceId         # Get device by ID
PATCH  /api/devices/:deviceId/status  # Update device status
GET    /api/devices/stats/overview    # Get device statistics
GET    /api/devices/offline           # Get offline devices
```

### Health & Monitoring
```
GET    /api/health                    # Basic health check
GET    /api/health/detailed           # Detailed system status
GET    /api/health/database           # Database connectivity check
```

## 🔧 Legacy Compatibility

The backend maintains full compatibility with the existing C# backend:

```
POST   /login                    # Original login endpoint
GET    /api/Users               # Original users endpoint  
GET    /api/AvailableSpaces/:date # Original available spaces
GET    /api/Reservations        # Original reservations
GET    /api/AccessLog           # Original access logs
```

## 📡 MQTT Integration

The backend automatically connects to MQTT broker and handles:

- **Space status updates**: `workbit/spaces/+/status`
- **Access events**: `workbit/access/+/entry` & `workbit/access/+/exit`  
- **Reservation updates**: `workbit/reservations/+/status`
- **System heartbeat**: `workbit/system/heartbeat`

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │    │    Web App       │    │   IoT Devices   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    WorkBit Backend        │
                    │    (Node.js + Express)    │
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐
    │   Supabase        │ │  MongoDB Atlas │ │  MQTT Broker   │
    │   (PostgreSQL)    │ │  (Analytics)   │ │  (Real-time)   │
    │   Main Data       │ │  Caching       │ │  IoT Messages  │
    └───────────────────┘ └────────────────┘ └────────────────┘
```

## 🚀 Deployment

### Render (Recommended)

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Create Web Service**:
   - Connect your GitHub repository
   - Select "Node.js" environment
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Environment Variables**:
   Add all environment variables from your `.env` file in Render dashboard

4. **Custom Domain** (optional):
   Configure your domain in Render settings

### Heroku Alternative

1. **Install Heroku CLI**
2. **Login**: `heroku login`
3. **Create App**: `heroku create workbit-api`
4. **Config Vars**: 
   ```bash
   heroku config:set JWT_SECRET=your-secret
   heroku config:set SUPABASE_URL=your-url
   # ... add all environment variables
   ```
5. **Deploy**: `git push heroku main`

### Environment Variables for Deployment

```bash
# Required for production
NODE_ENV=production
JWT_SECRET=your-production-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
MONGODB_URI=your-mongodb-connection-string

# Optional but recommended
CORS_ORIGIN=https://your-frontend-domain.com
MQTT_BROKER_URL=your-mqtt-broker
```

## 🔍 Monitoring & Health Checks

### Health Check URLs
- **Basic**: `https://your-domain.com/health`
- **Detailed**: `https://your-domain.com/api/health`
- **Database**: `https://your-domain.com/api/health/database`

### Metrics
The `/api/health/metrics` endpoint provides system metrics for monitoring tools.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test health endpoint
curl https://your-domain.com/health

# Test login
curl -X POST https://your-domain.com/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Request validation with express-validator
- **Helmet**: Security headers and protection middleware
- **Role-based Access**: Admin, technician, and user roles

## 📝 Development

### Project Structure
```
workbit_back/
├── config/          # Database and service configurations
├── middleware/      # Authentication and validation middleware  
├── models/          # MongoDB models for analytics
├── routes/          # API route definitions
├── utils/           # Helper functions and utilities
├── server.js        # Main application entry point
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check Supabase credentials and project status
- Verify MongoDB Atlas cluster is running
- Check network connectivity

**MQTT Connection Issues**  
- Verify broker URL and credentials
- Check firewall settings
- Try different MQTT brokers for testing

**Authentication Errors**
- Verify JWT_SECRET is set
- Check token expiration
- Validate user credentials

### Support
- Check health endpoints for system status
- Review application logs
- Verify environment variables
- Test database connections

---

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

Need help? Check the health endpoints or create an issue in the repository. 