#!/bin/bash
DATA='{"email":"root@mindwell.local","password":"RootAdmin123!"}'
curl -k -s -X POST https://localhost/api/v1/auth/login -H "Content-Type: application/json" -d "$DATA"
