# AIChatFlows Admin - iOS App

A professional, scalable iOS admin app built with React Native and Expo for managing AIChatFlows business operations.

## 🚀 Features

- **Client Dashboard**: Overview of total clients, revenue, and business metrics
- **Client CRM**: Manage client information with status filtering
- **Payment Tracker**: Track payments and revenue statistics
- **Business Visit Tracking**: GPS-based location tracking for business visits
- **Onboarding Submissions**: View and manage client onboarding forms
- **Goal Tracker**: Set and track business goals (weekly/monthly)
- **Push Notifications**: Real-time notifications for important events
- **Authentication**: Secure login/signup with Supabase

## 🛠 Tech Stack

- **React Native** + **Expo** (iOS-only)
- **TypeScript** for type safety
- **Supabase** for backend (auth, database, storage)
- **NativeWind** (Tailwind CSS for React Native)
- **Victory Native** for charts and data visualization
- **Expo Router** for navigation
- **Expo Push Notifications** for real-time updates
- **Expo Location** for GPS tracking

## 📋 Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm or yarn
- Xcode (for iOS development)
- iOS Simulator or physical iOS device
- Expo CLI: `npm install -g @expo/cli`

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd aichatflows-admin
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set Up Supabase Database

Create the following tables in your Supabase dashboard:

```sql
-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Onboarding submissions table
CREATE TABLE onboarding_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  amount DECIMAL NOT NULL,
  status VARCHAR DEFAULT 'pending',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Business visits table
CREATE TABLE business_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name VARCHAR NOT NULL,
  location TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Goals table
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  metric VARCHAR NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Configure iOS Permissions

The app requires location permissions for business visit tracking. These are already configured in `app.json`:

- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`

## 🏃‍♂️ Running the App

### Start the development server:
```bash
npm start
```

### Run on iOS Simulator:
```bash
npm run ios
```

### Run on physical iOS device:
1. Install Expo Go from the App Store
2. Scan the QR code from the terminal
3. Or use `npx expo run:ios --device` with a connected device

## 📁 Project Structure

```
aichatflows-admin/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── onboarding/        # Onboarding submission screens
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Third-party configurations
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── assets/               # Images and static files
├── app.json             # Expo configuration
├── global.css           # Global styles
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md           # This file
```

## 🧪 Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow React Native best practices
- Use NativeWind (Tailwind) for styling
- Keep components small and focused

### State Management
- Use React hooks for local state
- Supabase for remote state and real-time updates
- Custom hooks for reusable logic

### Error Handling
- Wrap async operations in try-catch blocks
- Show user-friendly error messages
- Log errors for debugging

## 🚀 Building for Production

### Create a production build:
```bash
npx expo build:ios
```

### Or use EAS Build (recommended):
```bash
npm install -g eas-cli
eas build --platform ios
```

## 📱 Features Implementation Status

- ✅ Authentication (Login/Signup)
- ✅ Client Dashboard with stats
- ✅ Client CRM with filtering
- ✅ Payment tracking
- ✅ Business visit tracking with GPS
- ✅ Onboarding submissions
- ✅ Goal tracking
- ⏳ Push notifications (configured, needs backend)
- ⏳ Revenue charts (Victory Native ready)
- ⏳ Interactive maps (react-native-maps ready)

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **iOS simulator not loading**: Restart simulator and run `npm run ios`
3. **Location permissions**: Ensure location services are enabled in iOS settings
4. **Supabase connection**: Check your environment variables and network connection

### Debug Mode

Enable debug mode for detailed logs:
```bash
npx expo start --dev-client
```

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review Expo documentation: https://docs.expo.dev/
- Check Supabase documentation: https://supabase.com/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.