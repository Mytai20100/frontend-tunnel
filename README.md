# frontend-tunnel

<div align="center">

<img src="https://raw.githubusercontent.com/Mytai20100/frontend-tunnel/main/img/frontend.png" alt="frontend-tunnel" width="400"/>

![Version](https://img.shields.io/badge/version-1.0-blue.svg)
![Language](https://img.shields.io/badge/language-Next.js-000000.svg)
![Stars](https://img.shields.io/github/stars/Mytai20100/frontend-tunnel?style=social)
![Views](https://img.shields.io/github/watchers/Mytai20100/frontend-tunnel?style=social)

**Web-based monitoring dashboard for Tunnel server**

[Features](#features) • [Installation](#installation) • [Deploy](#deploy)

</div>

---

## Features

- Real-time monitoring dashboard
- Live hashrate and shares statistics
- Network traffic visualization
- WebSocket live updates

---

## Requirements

- Node.js 18 or higher
- npm or yarn
- Tunnel backend server running

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Mytai20100/frontend-tunnel.git
cd frontend-tunnel
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configuration

Create `.env.local` file:

```env
BACKEND_API=http://localhost:4444
```

---

## Development

### Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open browser at [http://localhost:3000](http://localhost:3000)

---

## Build for Production

### Create Production Build

```bash
npm run build
npm start
# or
yarn build
yarn start
```

---

## Project Structure

```
frontend-tunnel/
├── app/
│   ├── api/
│   │   └── proxy/
│   │       ├── logs/
│   │       │   └── route.js          # Logs API route
│   │       ├── metrics/
│   │       │   └── route.js          # Metrics API route
│   │       └── miner/
│   │           └── [wallet]/
│   │               └── route.js      # Miner info API route
│   ├── favicon.ico                   # App favicon
│   ├── globals.css                   # Global styles
│   ├── layout.js                     # Root layout
│   └── page.js                       # Home page
├── img/
│   └── frontend.png                  # Logo/Screenshot
├── eslint.config.mjs                 # ESLint configuration
├── jsconfig.json                     # JavaScript config
├── next.config.mjs                   # Next.js configuration
├── postcss.config.mjs                # PostCSS configuration
├── package.json                      # Dependencies
└── README.md                         # Documentation
```

---

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

```

---

## API Routes

The frontend includes proxy API routes to communicate with the backend:

### Metrics Endpoint
```bash
GET /api/proxy/metrics
```
Returns system metrics, network stats, and active miners

### Miner Information
```bash
GET /api/proxy/miner/[wallet]
```
Returns specific miner information by wallet address

### Logs Stream
```bash
GET /api/proxy/logs
```
WebSocket endpoint for real-time log streaming

---

## Dashboard Features

### Main Dashboard
- System metrics (CPU, RAM, Network)
- Active miners count
- Total hashrate
- Network statistics
- Real-time graphs

### Miner Details
- Individual miner statistics
- Share acceptance rate
- Worker status

### Network Monitor
- Real-time traffic graphs
- Bandwidth usage
- Packet statistics
- Connection quality
- Latency tracking

### Logs Viewer
- Live log streaming via WebSocket
---

## Backend Connection

Make sure backend is running:

```bash
# Backend should be accessible at
http://localhost:4444

# API endpoints
http://localhost:4444/api/metrics
http://localhost:4444/api/i/{wallet}

# WebSocket endpoint
ws://localhost:4444/api/logs/stream
```

---

## Deploy
:?
## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_API` | Backend API URL | `http://localhost:4444` |

---

## Troubleshooting

### Cannot Connect to Backend

1. Check backend server is running:
   ```bash
   curl http://localhost:4444/api/metrics
   ```

2. Verify API URL in `.env.local` file

3. Check CORS settings in backend

4. Verify firewall rules allow connections

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```


### WebSocket Connection Failed

1. Check WebSocket URL format (ws:// or wss://)
2. Verify backend supports WebSocket connections
3. Check if proxy/firewall blocks WebSocket

---
## License

MIT License

---

## Links

- [GitHub Repository](https://github.com/Mytai20100/frontend-tunnel)
- [Tunnel Repository](https://github.com/Mytai20100/tunnel)

---

## Author

**Made by [Mytai](https://github.com/Mytai20100)**
