#!/bin/bash

# Java Backend Stop Script
# This script stops the Java backend service gracefully

echo "=== Java Backend Stop Script ==="
echo "Current time: $(date)"
echo ""

# Step 1: Find the Java backend process
echo "Step 1: Finding Java backend process..."
JAVA_PID=$(ps aux | grep "elderdiet-backend-java-1.0.0.jar" | grep -v grep | awk '{print $2}')

if [ -z "$JAVA_PID" ]; then
    echo "No Java backend process found running"
    echo "Backend service is already stopped"
    exit 0
fi

echo "Found Java backend process with PID: $JAVA_PID"
echo ""

# Step 2: Stop the process gracefully
echo "Step 2: Stopping Java backend process gracefully..."
kill $JAVA_PID

# Step 3: Wait for graceful shutdown
echo "Step 3: Waiting for graceful shutdown..."
for i in {1..30}; do
    if ! ps -p $JAVA_PID > /dev/null 2>&1; then
        echo "Java backend process stopped successfully"
        echo "Process was stopped gracefully"
        exit 0
    fi
    echo "Waiting... ($i/30 seconds)"
    sleep 1
done

# Step 4: Force kill if still running
echo "Step 4: Process still running, force killing..."
kill -9 $JAVA_PID

# Wait a moment for force kill to take effect
sleep 2

# Final check
if ps -p $JAVA_PID > /dev/null 2>&1; then
    echo "Error: Failed to stop Java backend process"
    echo "PID $JAVA_PID is still running"
    exit 1
else
    echo "Java backend process force stopped successfully"
fi

echo ""
echo "=== Backend service stopped ==="
echo "Current time: $(date)" 