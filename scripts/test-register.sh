#!/bin/bash
DATA='{"nickname":"testuser","email":"test@test.com","password":"12345678"}'
RESP=$(curl -s -w "\n%{http_code}" -X POST http://localhost/api/v1/auth/register -H "Content-Type: application/json" -d "$DATA")
echo "$RESP"
