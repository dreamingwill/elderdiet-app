#!/bin/bash

# Java Backend Status Check Script
# This script checks the status of the Java backend service

echo "=== Java Backend Status Check ==="
echo "Current time: $(date)"
echo ""

# Step 1: Check if Java process is running
echo "Step 1: Checking Java backend process..."
JAVA_PID=$(ps aux | grep "elderdiet-backend-java-1.0.0.jar" | grep -v grep | awk '{print $2}')

if [ -n "$JAVA_PID" ]; then
    echo "✓ Java backend process is running"
    echo "  PID: $JAVA_PID"
    
    # Get process details
    PROCESS_INFO=$(ps -p $JAVA_PID -o pid,ppid,cmd,etime,pcpu,pmem --no-headers)
    echo "  Process Info: $PROCESS_INFO"
else
    echo "✗ Java backend process is NOT running"
fi

echo ""

# Step 2: Check port listening status
echo "Step 2: Checking port listening status..."
if netstat -tlnp | grep :3001 > /dev/null 2>&1; then
    echo "✓ Port 3001 is listening"
    PORT_INFO=$(netstat -tlnp | grep :3001)
    echo "  Port Info: $PORT_INFO"
else
    echo "✗ Port 3001 is NOT listening"
fi

echo ""

# Step 3: Check log file
echo "Step 3: Checking log file..."
if [ -f "backend.log" ]; then
    echo "✓ Log file exists: backend.log"
    LOG_SIZE=$(ls -lh backend.log | awk '{print $5}')
    echo "  Log size: $LOG_SIZE"
    
    # Show last few lines of log
    echo "  Last 5 lines of log:"
    tail -5 backend.log | sed 's/^/    /'
else
    echo "✗ Log file does not exist"
fi

echo ""

# Step 4: Summary
echo "=== Summary ==="
if [ -n "$JAVA_PID" ] && netstat -tlnp | grep :3001 > /dev/null 2>&1; then
    echo "✓ Backend service is RUNNING and healthy"
    exit 0
else
    echo "✗ Backend service is NOT running properly"
    exit 1
fi 