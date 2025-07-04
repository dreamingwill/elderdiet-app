#!/bin/bash

# Java Backend Restart Script
# This script stops the current Java backend, pulls latest code, rebuilds and restarts

set -e  # Exit on any error

echo "=== Java Backend Restart Script ==="
echo "Current time: $(date)"
echo ""

# Step 1: Stop the current Java backend process
echo "Step 1: Stopping current Java backend process..."
JAVA_PID=$(ps aux | grep "elderdiet-backend-java-1.0.0.jar" | grep -v grep | awk '{print $2}')

if [ -n "$JAVA_PID" ]; then
    echo "Found Java process with PID: $JAVA_PID"
    echo "Stopping process..."
    kill $JAVA_PID
    
    # Wait for process to stop
    echo "Waiting for process to stop..."
    sleep 5
    
    # Check if process is still running
    if ps -p $JAVA_PID > /dev/null 2>&1; then
        echo "Process still running, force killing..."
        kill -9 $JAVA_PID
        sleep 2
    fi
    
    echo "Java backend process stopped successfully"
else
    echo "No Java backend process found running"
fi

echo ""

# Step 2: Pull latest code from git
echo "Step 2: Pulling latest code from git..."
git pull origin main
echo "Code updated successfully"
echo ""

# Step 3: Clean and rebuild the project
echo "Step 3: Cleaning and rebuilding the project..."
cd elderdiet-backend-java

# Clean previous build
echo "Cleaning previous build..."
mvn clean

# Compile and package
echo "Compiling and packaging..."
mvn package -DskipTests

echo "Build completed successfully"
echo ""

# Step 4: Start the Java backend
echo "Step 4: Starting Java backend..."
cd ..

# Start the application in background
nohup java -jar elderdiet-backend-java/target/elderdiet-backend-java-1.0.0.jar --server.address=0.0.0.0 > backend.log 2>&1 &

# Get the new process ID
NEW_PID=$!
echo "Java backend started with PID: $NEW_PID"

# Wait a moment for the application to start
echo "Waiting for application to start..."
sleep 10

# Check if the application is running
if ps -p $NEW_PID > /dev/null 2>&1; then
    echo "Java backend is running successfully"
    echo "Process ID: $NEW_PID"
    echo "Log file: backend.log"
    
    # Check if the port is listening
    if netstat -tlnp | grep :3001 > /dev/null 2>&1; then
        echo "Application is listening on port 3001"
    else
        echo "Warning: Application might not be listening on port 3001 yet"
    fi
else
    echo "Error: Java backend failed to start"
    echo "Check backend.log for details"
    exit 1
fi

echo ""
echo "=== Restart completed successfully ==="
echo "Current time: $(date)" 