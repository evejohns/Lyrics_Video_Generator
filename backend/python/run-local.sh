#!/bin/bash
# Helper script to run Python sync service locally with correct Python version

echo "🐍 Starting Python Sync Service with Python 3.12..."

# Check if Python 3.12 is available
if ! command -v python3.12 &> /dev/null; then
    echo "❌ Error: Python 3.12 is not installed"
    echo "Install it with: brew install python@3.12"
    exit 1
fi

# Check Python version
echo "Using: $(python3.12 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3.12 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run the service
echo "🚀 Starting service..."
python3.12 sync_service.py
