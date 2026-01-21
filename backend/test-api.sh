#!/bin/bash

# vimpl API Test Script
# This script tests all the main API endpoints

API_URL="http://localhost:3001"
EMAIL="test-$(date +%s)@example.com"  # Unique email for each test run
PASSWORD="Test1234"
NAME="Test User"

echo "🧪 vimpl API Test Suite"
echo "======================="
echo ""
echo "Testing API at: $API_URL"
echo "Test email: $EMAIL"
echo ""

# Colours for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No colour

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth=$5
    
    echo -n "Testing: $name... "
    
    if [ -n "$auth" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth" \
            -d "$data")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    if echo "$response" | grep -q "error"; then
        echo -e "${RED}FAILED${NC}"
        echo "Response: $response"
        FAILED=$((FAILED + 1))
        return 1
    else
        echo -e "${GREEN}PASSED${NC}"
        PASSED=$((PASSED + 1))
        echo "$response"
        return 0
    fi
}

echo "1️⃣  Testing Health Check"
echo "------------------------"
test_endpoint "Health check" "GET" "/health" "" ""
echo ""

echo "2️⃣  Testing Authentication"
echo "-------------------------"

# Register
echo -n "Testing: User registration... "
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}PASSED${NC}"
    ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Access token: ${ACCESS_TOKEN:0:20}..."
    echo "User ID: $USER_ID"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC}"
    echo "Response: $REGISTER_RESPONSE"
    FAILED=$((FAILED + 1))
    echo ""
    echo "❌ Registration failed. Cannot continue tests."
    exit 1
fi
echo ""

# Login
echo -n "Testing: User login... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}PASSED${NC}"
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC}"
    echo "Response: $LOGIN_RESPONSE"
    FAILED=$((FAILED + 1))
fi
echo ""

# Get current user
echo -n "Testing: Get current user... "
ME_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ME_RESPONSE" | grep -q "$EMAIL"; then
    echo -e "${GREEN}PASSED${NC}"
    echo "User: $(echo $ME_RESPONSE | grep -o '"email":"[^"]*' | cut -d'"' -f4)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC}"
    echo "Response: $ME_RESPONSE"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "3️⃣  Testing Board Operations"
echo "---------------------------"

# Create board
echo -n "Testing: Create board... "
CREATE_BOARD_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/boards" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{"title":"Test Board","description":"Test board created by API test"}')

if echo "$CREATE_BOARD_RESPONSE" | grep -q "board"; then
    echo -e "${GREEN}PASSED${NC}"
    BOARD_ID=$(echo $CREATE_BOARD_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    BOARD_SLUG=$(echo $CREATE_BOARD_RESPONSE | grep -o '"slug":"[^"]*' | cut -d'"' -f4)
    echo "Board ID: $BOARD_ID"
    echo "Board slug: $BOARD_SLUG"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}FAILED${NC}"
    echo "Response: $CREATE_BOARD_RESPONSE"
    FAILED=$((FAILED + 1))
    BOARD_ID=""
fi
echo ""

if [ -n "$BOARD_ID" ]; then
    # Get boards list
    echo -n "Testing: List boards... "
    LIST_BOARDS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/boards" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$LIST_BOARDS_RESPONSE" | grep -q "$BOARD_ID"; then
        echo -e "${GREEN}PASSED${NC}"
        BOARD_COUNT=$(echo $LIST_BOARDS_RESPONSE | grep -o '"id":' | wc -l)
        echo "Found $BOARD_COUNT board(s)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC}"
        echo "Response: $LIST_BOARDS_RESPONSE"
        FAILED=$((FAILED + 1))
    fi
    echo ""
    
    # Get board by ID
    echo -n "Testing: Get board by ID... "
    GET_BOARD_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/boards/$BOARD_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$GET_BOARD_RESPONSE" | grep -q "$BOARD_ID"; then
        echo -e "${GREEN}PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC}"
        echo "Response: $GET_BOARD_RESPONSE"
        FAILED=$((FAILED + 1))
    fi
    echo ""
    
    # Update board
    echo -n "Testing: Update board... "
    UPDATE_BOARD_RESPONSE=$(curl -s -X PUT "$API_URL/api/v1/boards/$BOARD_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{"title":"Updated Test Board"}')
    
    if echo "$UPDATE_BOARD_RESPONSE" | grep -q "Updated Test Board"; then
        echo -e "${GREEN}PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC}"
        echo "Response: $UPDATE_BOARD_RESPONSE"
        FAILED=$((FAILED + 1))
    fi
    echo ""
    
    echo "4️⃣  Testing Section Operations"
    echo "-----------------------------"
    
    # Create section
    echo -n "Testing: Create section... "
    CREATE_SECTION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/boards/$BOARD_ID/sections" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{"type":"matrix","title":"Test Matrix","positionX":0,"positionY":0,"width":6,"height":4}')
    
    if echo "$CREATE_SECTION_RESPONSE" | grep -q "section"; then
        echo -e "${GREEN}PASSED${NC}"
        SECTION_ID=$(echo $CREATE_SECTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        echo "Section ID: $SECTION_ID"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC}"
        echo "Response: $CREATE_SECTION_RESPONSE"
        FAILED=$((FAILED + 1))
        SECTION_ID=""
    fi
    echo ""
    
    if [ -n "$SECTION_ID" ]; then
        echo "5️⃣  Testing Post-it Operations"
        echo "-----------------------------"
        
        # Create post-it
        echo -n "Testing: Create post-it... "
        CREATE_POSTIT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/boards/$BOARD_ID/postits" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -d "{\"sectionId\":\"$SECTION_ID\",\"color\":\"yellow\",\"content\":\"Test post-it\",\"status\":\"todo\",\"positionX\":100,\"positionY\":100}")
        
        if echo "$CREATE_POSTIT_RESPONSE" | grep -q "postit"; then
            echo -e "${GREEN}PASSED${NC}"
            POSTIT_ID=$(echo $CREATE_POSTIT_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
            echo "Post-it ID: $POSTIT_ID"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}FAILED${NC}"
            echo "Response: $CREATE_POSTIT_RESPONSE"
            FAILED=$((FAILED + 1))
        fi
        echo ""
        
        if [ -n "$POSTIT_ID" ]; then
            # Update post-it
            echo -n "Testing: Update post-it... "
            UPDATE_POSTIT_RESPONSE=$(curl -s -X PUT "$API_URL/api/v1/boards/$BOARD_ID/postits/$POSTIT_ID" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -d '{"content":"Updated post-it","status":"done"}')
            
            if echo "$UPDATE_POSTIT_RESPONSE" | grep -q "Updated post-it"; then
                echo -e "${GREEN}PASSED${NC}"
                PASSED=$((PASSED + 1))
            else
                echo -e "${RED}FAILED${NC}"
                echo "Response: $UPDATE_POSTIT_RESPONSE"
                FAILED=$((FAILED + 1))
            fi
            echo ""
        fi
    fi
    
    # Delete board (cleanup)
    echo -n "Testing: Delete board (cleanup)... "
    DELETE_BOARD_RESPONSE=$(curl -s -X DELETE "$API_URL/api/v1/boards/$BOARD_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$DELETE_BOARD_RESPONSE" | grep -q "deleted successfully"; then
        echo -e "${GREEN}PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAILED${NC}"
        echo "Response: $DELETE_BOARD_RESPONSE"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

echo "📊 Test Results"
echo "==============="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Your API is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check Prisma Studio to see your data: npm run db:studio"
    echo "2. Review the backend logs for details"
    echo "3. Start working on frontend integration"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure the backend is running: npm run dev"
    echo "2. Check your .env configuration"
    echo "3. Verify database connection"
    echo "4. Review backend logs for errors"
    exit 1
fi
