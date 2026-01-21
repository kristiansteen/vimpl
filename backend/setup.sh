#!/bin/bash

# vimpl Backend Setup Script
# Run this script to set up your backend

echo "🚀 vimpl Backend Setup"
echo "====================="
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the backend directory:"
    echo "  cd vimpl-saas/backend"
    echo "  bash setup.sh"
    exit 1
fi

echo "✅ Found backend directory"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Step 2: Check for .env file
if [ ! -f ".env" ]; then
    echo "⚙️  Step 2: Setting up environment variables..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit .env and add your database URL"
    echo ""
    echo "Options:"
    echo "1. Supabase (Recommended - Free):"
    echo "   - Go to https://supabase.com"
    echo "   - Create new project"
    echo "   - Get connection string from Settings → Database"
    echo "   - Update DATABASE_URL in .env"
    echo ""
    echo "2. Local PostgreSQL:"
    echo "   - Create database: createdb vimpl"
    echo "   - Update DATABASE_URL in .env"
    echo ""
    read -p "Press Enter when you've updated the DATABASE_URL in .env..."
else
    echo "✅ .env file already exists"
fi

echo ""

# Step 3: Generate JWT secrets
echo "🔐 Step 3: Generating secure JWT secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update .env with generated secrets
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
else
    # Linux
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
fi

echo "✅ Generated secure JWT secrets"
echo ""

# Step 4: Set up database
echo "🗄️  Step 4: Setting up database..."
echo "Running Prisma migrations..."

npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ Database schema pushed successfully"
else
    echo "❌ Failed to push database schema"
    echo "Please check your DATABASE_URL in .env"
    exit 1
fi

echo ""

# Step 5: Success!
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your backend is ready to start!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "The API will be available at:"
echo "  http://localhost:3001"
echo ""
echo "Health check:"
echo "  http://localhost:3001/health"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Test the API with the test-api.sh script"
echo "3. Check the logs for any errors"
echo ""
