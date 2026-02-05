## 🏗️ Tech Stack

### Backend

- **Laravel 12.x** - PHP Framework
- **Inertia.js** - Modern monolith approach
- **SQLite Database** - Lightweight database solution
- **Midtrans SDK** - Payment gateway integration
- **ESC/POS PHP** - Thermal printer integration

### Frontend

- **React 18** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **Vite** - Fast build tool and dev server

### Development Tools

- **Composer** - PHP dependency management
- **NPM** - Node.js package management
- **Laravel Pint** - PHP code styling
- **ESLint & Prettier** - JavaScript/TypeScript linting and formatting
- **Pest** - PHP testing framework

## 🚀 Installation

### Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ and NPM
- SQLite (or other Laravel-supported database)

### Step 1: Clone Repository

```bash
git clone https://github.com/ryanditata/LitePOS-pos.git
cd LitePOS
```

### Step 2: Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### Step 3: Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Step 4: Database Setup

```bash
# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed
```

### Step 5: Configure Midtrans

Edit the `.env` file and add Midtrans configuration:

```env
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
```

### Step 6: Build Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### Step 7: Start Development Server

```bash
# Laravel development server
php artisan serve

# Vite development server (in separate terminal)
npm run dev
```

The application will be available at `http://localhost:5173/`

### Midtrans Setup

1. Register an account at [Midtrans](https://midtrans.com)
2. Get your Server Key and Client Key
3. Configure webhook URL for production: `yourdomain.com/checkout/notification`

### Printer Setup (Optional)

1. Connect thermal printer via USB
2. Ensure printer is detected at `/dev/usb/lp0`
3. Adjust printer path in `PrintController.php` if needed

### Environment Variables

```env
# Application
APP_NAME=LitePOS
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite

# Midtrans Configuration
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_IS_PRODUCTION=false
```

## 🧪 Testing

```bash
# Run PHP tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run JavaScript tests
npm run test

# Type checking
npm run types
```

## 📁 Project Structure

```
litepos/
├── app/
│   ├── Http/Controllers/       # Laravel controllers
│   ├── Models/                 # Eloquent models
│   └── Providers/              # Service providers
├── database/
│   ├── migrations/             # Database migrations
│   ├── seeders/                # Database seeders
│   └── factories/              # Model factories
├── resources/
│   ├── js/                     # React/TypeScript frontend
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   └── types/              # TypeScript type definitions
│   └── css/                    # Stylesheets
├── routes/
│   ├── web.php                 # Web routes
│   └── auth.php                # Authentication routes
└── public/                     # Public assets
```
