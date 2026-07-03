#!/bin/bash
set -e

echo "🚀 AutoLeads Quick Setup"
echo "========================"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not installed. Install from https://nodejs.org"
  exit 1
fi

echo "✅ Node.js: $(node -v)"

# Check npm
echo "✅ npm: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if missing
if [ ! -f .env ]; then
  echo ""
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "⚠️  Update .env with your keys before running the app"
fi

# Setup database
echo ""
echo "🗄️  Setting up database..."
npx prisma migrate dev --skip-generate 2>/dev/null || true
npx prisma generate
node prisma/seed_sqlite.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update .env with your configuration (optional for dev)"
echo "  2. Start dev server: npm run dev"
echo "  3. In another terminal: node scripts/worker.js"
echo "  4. Open http://localhost:3000"
echo ""
echo "🔐 Default credentials:"
echo "  Email: admin@example.com"
echo "  Password: password123"
echo ""
