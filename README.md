# Sakhi — Women's Safety & Emergency Assistance Platform

Sakhi is a full-stack women's safety platform designed to bring emergency assistance, trusted contacts, location-based safety tools, incident reporting, and emotional support together in one place.

> **Project status:** The current web application is built with React and Vite. A mobile-app version is a planned next step; the existing web app and backend should be preserved during that work.

## Features

- **Authentication:** User registration and login with JWT authentication and password hashing.
- **Emergency SOS:** SOS flow with a countdown/cancellation period and saved SOS records.
- **Trusted Circle:** Add and manage trusted contacts for emergency situations.
- **Incident reporting:** Submit safety-related incidents and review previous reports.
- **Safety Map:** Display safety-related geographical information and incident markers.
- **Safe Route:** Explore route guidance with safety information.
- **Live Tracker:** Location-related tracking functionality.
- **Nearby help:** Find nearby police or assistance resources using location-based features.
- **Fake Call:** Simulate an incoming call, including delay options, ringtone, and conversation audio.
- **AI Safety Assistant:** AI-assisted safety and emotional-support conversations through a backend API.
- **SOS and incident history:** Review saved emergency events and reports.
- **Settings :** Manage preferences and safety-related updates.

Some features depend on external services, device permissions, or ongoing development. Availability can vary by environment.

## Tech Stack

### Frontend

- React.js
- Vite
- JavaScript / JSX
- CSS
- Axios
- React Router

### Backend

- Node.js
- Express.js
- REST APIs
- MongoDB with Mongoose
- JWT authentication
- bcrypt/bcryptjs for password hashing
- dotenv and CORS

### Integrations

- Gemini API for AI-assisted support
- Location and mapping services for safety/location features
- Twilio or email integrations where configured

## Project Structure

```text
Sakhi/
├── client/                 # Existing React + Vite web frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── assets/
│       ├── App.jsx
│       └── main.jsx
├── server/                 # Express backend and REST APIs
│   ├── config/             # Database connection
│   ├── controllers/        # Request/business logic
│   ├── middleware/         # Authentication and other middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API route definitions
│   └── server.js
└── README.md
```

The exact files may differ as development continues.

## Main API Groups

The backend currently uses these API prefixes:

| Prefix | Purpose |
|---|---|
| `/api/users` | Registration, login, and user-related operations |
| `/api/contacts` | Trusted Circle contact management |
| `/api/sos` | SOS and emergency records |
| `/api/incidents` | Incident reporting and history |
| `/api/ai` | AI Safety Assistant requests |

The precise endpoints and required request fields are defined in the backend routes and controllers.

## Run Locally

### Requirements

- Node.js and npm
- MongoDB running locally or an accessible MongoDB database

### 1. Configure the backend

Open a terminal in `server/`, install dependencies, and create a `.env` file based on the variables your backend actually uses.

```bash
cd server
npm install
npm start
```

Typical environment variables may include:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
```

Add email or Twilio variables only if those integrations are enabled in your code. Check the backend source for the exact variable names. **Never commit real credentials or API keys.** Keep `.env` out of Git and commit a `.env.example` containing placeholder values instead.

### 2. Run the frontend

Open a second terminal in `client/`:

```bash
cd client
npm install
npm run dev
```

Vite usually prints the local URL, commonly `http://localhost:5173/`.

### 3. Check API connectivity

The web frontend must send requests to the running Express API. The current local backend commonly uses port `5000`. If the API base URL is configured through environment variables, set it according to the frontend code and Vite configuration.

## Mobile-App Direction

A mobile version is planned. The goal is to build a proper mobile experience rather than simply wrapping the website in a WebView.

- Preserve the current web frontend.
- Reuse the existing Express API, MongoDB models, controllers, and business logic wherever possible.
- Build a separate mobile frontend (for example, with React Native and Expo after the current project is inspected).
- Adapt web UI and navigation for mobile instead of copying web CSS and DOM components.
- Use secure mobile token storage rather than browser `localStorage`.
- Implement location permissions, audio, haptics/vibration, and notifications using suitable mobile APIs where needed.
- Keep API keys and other secrets on the backend.

## Security Notes

- Never commit `.env` files, database credentials, JWT secrets, email passwords, Twilio credentials, or private API keys.
- Do not place the Gemini API key in frontend or mobile-app source code.
- The mobile app should communicate with the backend API; it should not connect directly to MongoDB.
- Request sensitive device permissions only when needed and explain their purpose to users.

## Contributing / Development Notes

- Inspect existing files before replacing or renaming them.
- Prefer small, incremental changes and test each feature after modifying it.
- Preserve existing API contracts unless a change is necessary and coordinated across frontend and backend.

## License

No license has been specified yet. Add a license file if and when the project owner chooses one.
