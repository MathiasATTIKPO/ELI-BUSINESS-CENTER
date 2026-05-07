#!/bin/bash

# ============================================
# ELI Business Center API - cURL Examples
# ============================================
# 
# Ce fichier contient des exemples de commandes cURL pour tester l'API
# Remplacez les valeurs entre {} par les vôtres
#
# Utilisation: Copiez-collez les commandes dans votre terminal
# ============================================

BASE_URL="http://localhost:4001"
TOKEN=""  # À remplir après login

echo "=========================================="
echo "ELI Business Center API - cURL Examples"
echo "=========================================="
echo ""

# ============================================
# 1. HEALTH CHECK
# ============================================
echo "1. Health Check"
echo "---"
curl -X GET "$BASE_URL/api/health"
echo ""
echo ""

# ============================================
# 2. AUTHENTICATION
# ============================================
echo "2. Admin Login"
echo "---"
curl -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elis.com",
    "password": "admin123"
  }'
echo ""
echo ""

echo "3. Technician Login"
echo "---"
curl -X POST "$BASE_URL/api/technician/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@elis.com",
    "password": "tech123"
  }'
echo ""
echo ""

# ============================================
# 3. PRODUCTS - PUBLIC
# ============================================
echo "4. Get All Products (PUBLIC)"
echo "---"
curl -X GET "$BASE_URL/api/products"
echo ""
echo ""

echo "5. Get Product By ID (PUBLIC)"
echo "---"
curl -X GET "$BASE_URL/api/products/{PRODUCT_ID}"
echo ""
echo ""

# ============================================
# 4. PRODUCTS - ADMIN
# ============================================
echo "6. Create Product (ADMIN)"
echo "---"
echo "Note: Using form-data with file upload"
curl -X POST "$BASE_URL/api/admin/products" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=iPhone 15" \
  -F "price=1299" \
  -F "description=Latest iPhone model" \
  -F "stock=50" \
  -F "photo=@/path/to/image.jpg"
echo ""
echo ""

echo "7. Update Product (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/products/{PRODUCT_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "price": 1399,
    "stock": 45
  }'
echo ""
echo ""

echo "8. Delete Product (ADMIN)"
echo "---"
curl -X DELETE "$BASE_URL/api/admin/products/{PRODUCT_ID}" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# ============================================
# 5. REPAIRS - PUBLIC
# ============================================
echo "9. Create Repair Request (PUBLIC)"
echo "---"
echo "Note: Using form-data with file upload"
curl -X POST "$BASE_URL/api/repair" \
  -F "name=John Doe" \
  -F "phone=+22800000001" \
  -F "email=john@example.com" \
  -F "description=Screen is broken" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg"
echo ""
echo ""

echo "10. Get Repair By ID (PUBLIC)"
echo "---"
curl -X GET "$BASE_URL/api/repair/{REPAIR_ID}"
echo ""
echo ""

# ============================================
# 6. REPAIRS - ADMIN
# ============================================
echo "11. Get All Repairs (ADMIN)"
echo "---"
curl -X GET "$BASE_URL/api/admin/repairs" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "12. Update Repair Price (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/repair/{REPAIR_ID}/price" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 150
  }'
echo ""
echo ""

echo "13. Update Repair Status (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/repair/{REPAIR_ID}/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
echo ""
echo ""

echo "14. Assign Repair to Technician (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/repair/{REPAIR_ID}/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "technicianId": "{TECHNICIAN_ID}"
  }'
echo ""
echo ""

# ============================================
# 7. REPAIRS - TECHNICIAN
# ============================================
echo "15. Get My Repairs (TECHNICIAN)"
echo "---"
curl -X GET "$BASE_URL/api/technician/repairs" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "16. Update Repair Status (TECHNICIAN)"
echo "---"
curl -X PUT "$BASE_URL/api/technician/repair/{REPAIR_ID}/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
echo ""
echo ""

echo "17. Get Repair History (TECHNICIAN)"
echo "---"
curl -X GET "$BASE_URL/api/technician/history" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# ============================================
# 8. TRADE-INS - PUBLIC
# ============================================
echo "18. Create Trade-In Request (PUBLIC)"
echo "---"
echo "Note: Using form-data with file upload"
curl -X POST "$BASE_URL/api/tradein" \
  -F "name=Jane Doe" \
  -F "phone=+22800000002" \
  -F "email=jane@example.com" \
  -F "deviceDescription=iPhone 12, good condition" \
  -F "photos=@/path/to/photo1.jpg"
echo ""
echo ""

echo "19. Get Trade-In By ID (PUBLIC)"
echo "---"
curl -X GET "$BASE_URL/api/tradein/{TRADEIN_ID}"
echo ""
echo ""

# ============================================
# 9. TRADE-INS - ADMIN
# ============================================
echo "20. Get All Trade-Ins (ADMIN)"
echo "---"
curl -X GET "$BASE_URL/api/admin/tradeins" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "21. Update Trade-In Value (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/tradein/{TRADEIN_ID}/value" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 400
  }'
echo ""
echo ""

echo "22. Accept Trade-In (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/tradein/{TRADEIN_ID}/accept" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
echo ""
echo ""

# ============================================
# 10. INVENTORY - ADMIN
# ============================================
echo "23. Get Inventory (ADMIN)"
echo "---"
curl -X GET "$BASE_URL/api/admin/inventory" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "24. Create Inventory Item (ADMIN)"
echo "---"
echo "Note: Using form-data with file upload"
curl -X POST "$BASE_URL/api/admin/inventory" \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Screen Protector" \
  -F "quantity=100" \
  -F "price=5" \
  -F "photo=@/path/to/image.jpg"
echo ""
echo ""

echo "25. Update Inventory Item (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/inventory/{ITEM_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 95,
    "price": 5.5
  }'
echo ""
echo ""

echo "26. Delete Inventory Item (ADMIN)"
echo "---"
curl -X DELETE "$BASE_URL/api/admin/inventory/{ITEM_ID}" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

# ============================================
# 11. EMPLOYEES - ADMIN
# ============================================
echo "27. Get All Employees (ADMIN)"
echo "---"
curl -X GET "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "28. Create Employee (ADMIN)"
echo "---"
curl -X POST "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@elis.com",
    "phone": "+22800000003",
    "role": "technician",
    "password": "password123",
    "skills": ["écran", "batterie"]
  }'
echo ""
echo ""

echo "29. Update Employee (ADMIN)"
echo "---"
curl -X PUT "$BASE_URL/api/admin/employees/{EMPLOYEE_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "phone": "+22800000004",
    "skills": ["écran", "batterie", "carte mère"]
  }'
echo ""
echo ""

echo "30. Delete Employee (ADMIN)"
echo "---"
curl -X DELETE "$BASE_URL/api/admin/employees/{EMPLOYEE_ID}" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "31. Clock In (ADMIN/EMPLOYEE)"
echo "---"
curl -X POST "$BASE_URL/api/admin/work/clockin" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""
echo ""

echo "32. Clock Out (ADMIN/EMPLOYEE)"
echo "---"
curl -X POST "$BASE_URL/api/admin/work/clockout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""
echo ""

# ============================================
# 12. UPLOAD
# ============================================
echo "33. Upload Files (PUBLIC)"
echo "---"
echo "Note: Using form-data with multiple file upload"
curl -X POST "$BASE_URL/api/upload" \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.jpg" \
  -F "files=@/path/to/file3.jpg"
echo ""
echo ""

# ============================================
# 13. INVOICE
# ============================================
echo "34. Generate Invoice (PUBLIC)"
echo "---"
curl -X POST "$BASE_URL/api/invoice/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "repairId": "{REPAIR_ID}",
    "items": [
      {
        "description": "Screen Replacement",
        "quantity": 1,
        "price": 150
      }
    ],
    "totalAmount": 150
  }'
echo ""
echo ""

echo "35. Send Invoice via WhatsApp (PUBLIC)"
echo "---"
curl -X POST "$BASE_URL/api/invoice/send-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "{INVOICE_ID}",
    "phone": "+22800000001"
  }'
echo ""
echo ""

# ============================================
# NOTES
# ============================================
echo ""
echo "=========================================="
echo "NOTES:"
echo "=========================================="
echo ""
echo "1. Remplacez {VARIABLE} par les valeurs réelles"
echo "2. Pour les uploads, remplacez /path/to/file par le chemin réel"
echo "3. Le TOKEN doit être obtenu après login"
echo "4. Les endpoints sans 'admin' ou 'technician' sont publics"
echo "5. Pour tester les fichiers, assurez-vous que les chemins existent"
echo ""
echo "=========================================="
