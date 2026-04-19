# Property History Feature - Backend API Documentation

## Overview
The History feature allows tenants to automatically track properties they have visited. Each time a tenant views a property detail page, the system records this visit with a timestamp. Tenants can later view their history, clear specific records, or clear all history.

---

## Database Model

### History Model
Location: `/backend/models/History.js`

**Schema:**
```javascript
{
  _id: ObjectId,
  tenant: ObjectId (ref: User),          // Tenant who visited the property
  property: ObjectId (ref: Property),    // Property that was visited
  visitedAt: Date,                       // Timestamp of the visit/update
  createdAt: Date,                       // Record creation timestamp
  updatedAt: Date,                       // Record update timestamp
}
```

**Key Features:**
- Automatically updates `visitedAt` when a tenant revisits the same property
- Indexed for efficient querying by tenant and visit time
- Supports pagination for large history lists

---

## API Endpoints

### 1. Add Property Visit to History
**Endpoint:** `POST /api/tenant/history/:propertyId`

**Access:** Private (Tenant only)

**Description:** Adds a property visit to the tenant's history. If the property is already in the history, it updates the `visitedAt` timestamp.

**Parameters:**
- `propertyId` (URL param): ID of the property being visited

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response (201 Created):**
```json
{
  "_id": "60d5ec49c1234567890abcde",
  "tenant": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property": {
    "_id": "60d5ec49c1234567890abcd2",
    "name": "Cozy Studio Apartment",
    "address": "123 Main St",
    "type": "Studio",
    "rent": 1200,
    "location": "Downtown",
    "images": ["url1", "url2"],
    "availability": "Available",
    "amenities": ["WiFi", "Parking"],
    "averageRating": 4.5,
    "totalReviews": 20
  },
  "visitedAt": "2024-04-19T14:30:00.000Z",
  "createdAt": "2024-04-19T14:30:00.000Z",
  "updatedAt": "2024-04-19T14:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Property does not exist
- `403 Forbidden`: Not authorized (not a tenant)
- `500 Server Error`: Internal server error

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/tenant/history/60d5ec49c1234567890abcd2 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

### 2. Get Tenant's Property History
**Endpoint:** `GET /api/tenant/history`

**Access:** Private (Tenant only)

**Description:** Retrieves the tenant's complete property visit history with pagination support. Results are sorted by most recent visits first.

**Query Parameters:**
- `limit` (optional, default: 10): Number of records per page
- `skip` (optional, default: 0): Number of records to skip for pagination

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "total": 15,
  "count": 10,
  "skip": 0,
  "limit": 10,
  "history": [
    {
      "_id": "60d5ec49c1234567890abcde",
      "tenant": {
        "_id": "60d5ec49c1234567890abcd1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "property": {
        "_id": "60d5ec49c1234567890abcd2",
        "name": "Cozy Studio Apartment",
        "address": "123 Main St",
        "type": "Studio",
        "rent": 1200,
        "location": "Downtown",
        "images": ["url1", "url2"],
        "availability": "Available",
        "amenities": ["WiFi", "Parking"],
        "averageRating": 4.5,
        "totalReviews": 20
      },
      "visitedAt": "2024-04-19T14:30:00.000Z",
      "createdAt": "2024-04-19T14:30:00.000Z",
      "updatedAt": "2024-04-19T14:30:00.000Z"
    }
    // ... more records
  ]
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (not a tenant)
- `500 Server Error`: Internal server error

**Example cURL:**
```bash
# Get first 10 records
curl -X GET "http://localhost:5000/api/tenant/history?limit=10&skip=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get next 10 records (pagination)
curl -X GET "http://localhost:5000/api/tenant/history?limit=10&skip=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. Get Single History Record Details
**Endpoint:** `GET /api/tenant/history/:historyId`

**Access:** Private (Tenant only)

**Description:** Retrieves details of a specific history record. Only the tenant who created the record can view it.

**Parameters:**
- `historyId` (URL param): ID of the history record

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "_id": "60d5ec49c1234567890abcde",
  "tenant": {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property": {
    "_id": "60d5ec49c1234567890abcd2",
    "name": "Cozy Studio Apartment",
    "address": "123 Main St",
    "type": "Studio",
    "rent": 1200,
    "location": "Downtown",
    "images": ["url1", "url2"],
    "availability": "Available",
    "amenities": ["WiFi", "Parking"],
    "landlord": "60d5ec49c1234567890abcd3",
    "averageRating": 4.5,
    "totalReviews": 20
  },
  "visitedAt": "2024-04-19T14:30:00.000Z",
  "createdAt": "2024-04-19T14:30:00.000Z",
  "updatedAt": "2024-04-19T14:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: History record not found
- `403 Forbidden`: Not authorized (trying to access another user's history)
- `500 Server Error`: Internal server error

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/tenant/history/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Delete Single History Record
**Endpoint:** `DELETE /api/tenant/history/:historyId`

**Access:** Private (Tenant only)

**Description:** Deletes a specific history record from the tenant's history.

**Parameters:**
- `historyId` (URL param): ID of the history record to delete

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "History record deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: History record not found
- `403 Forbidden`: Not authorized (trying to delete another user's history)
- `500 Server Error`: Internal server error

**Example cURL:**
```bash
curl -X DELETE http://localhost:5000/api/tenant/history/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 5. Clear All History
**Endpoint:** `DELETE /api/tenant/history`

**Access:** Private (Tenant only)

**Description:** Clears all history records for the authenticated tenant. This is a destructive operation.

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "All history records cleared successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (not a tenant)
- `500 Server Error`: Internal server error

**Example cURL:**
```bash
curl -X DELETE http://localhost:5000/api/tenant/history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Frontend Integration Guide

### When to Track History

Call the `addToHistory` endpoint whenever a tenant views the property detail page:

```javascript
// In PropertyDetail.jsx or similar component
import axios from 'axios'

const PropertyDetail = () => {
  const { id } = useParams()
  
  useEffect(() => {
    // When property is loaded, add it to history
    axios.post(`/api/tenant/history/${id}`)
      .catch(err => console.error('Failed to record history:', err))
  }, [id])
  
  // ... rest of component
}
```

### Display History Page

Create a new component to display the history:

```javascript
// src/pages/History.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const History = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/tenant/history?limit=20')
        setHistory(data.history)
      } catch (err) {
        console.error('Failed to fetch history:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'tenant') {
      fetchHistory()
    }
  }, [user])

  const handleDeleteRecord = async (historyId) => {
    try {
      await axios.delete(`/api/tenant/history/${historyId}`)
      setHistory(history.filter(h => h._id !== historyId))
    } catch (err) {
      console.error('Failed to delete history record:', err)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await axios.delete('/api/tenant/history')
        setHistory([])
      } catch (err) {
        console.error('Failed to clear history:', err)
      }
    }
  }

  if (!user || user.role !== 'tenant') {
    return <div>Access denied</div>
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="history-page">
      <h1>Your Property Visit History</h1>
      
      {history.length === 0 ? (
        <p>You haven't visited any properties yet.</p>
      ) : (
        <>
          <button onClick={handleClearAll} className="btn-clear-all">
            Clear All History
          </button>
          
          <div className="history-list">
            {history.map(record => (
              <div key={record._id} className="history-card">
                <h3>{record.property.name}</h3>
                <p>Address: {record.property.address}</p>
                <p>Rent: ${record.property.rent}</p>
                <p>Visited: {new Date(record.visitedAt).toLocaleDateString()}</p>
                <button onClick={() => handleDeleteRecord(record._id)}>
                  Remove from History
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default History
```

---

## Testing the API

### Using Postman

1. **Register/Login** as a tenant and get the JWT token
2. **Create/Get a Property ID** (or use an existing one)
3. **Test Add to History:**
   - Method: POST
   - URL: `http://localhost:5000/api/tenant/history/{propertyId}`
   - Headers: `Authorization: Bearer {token}`
4. **Test Get History:**
   - Method: GET
   - URL: `http://localhost:5000/api/tenant/history`
   - Headers: `Authorization: Bearer {token}`
5. **Test Delete Record:**
   - Method: DELETE
   - URL: `http://localhost:5000/api/tenant/history/{historyId}`
   - Headers: `Authorization: Bearer {token}`

---

## Database Indexes

The History model includes two indexes for optimal performance:

1. **Compound Index:** `{ tenant: 1, property: 1 }`
   - Prevents duplicate tenant-property combinations
   - Enables efficient unique lookups

2. **Sorting Index:** `{ tenant: 1, visitedAt: -1 }`
   - Optimizes queries for retrieving history sorted by visit time
   - Enables efficient pagination

---

## Summary

✅ **Created Files:**
- `/backend/models/History.js` - Database model

✅ **Updated Files:**
- `/backend/controllers/tenantController.js` - Added 5 history controller methods
- `/backend/routes/tenant.js` - Added 5 history routes

✅ **New Features:**
- Automatic tracking of property visits
- View complete visit history with pagination
- Delete individual history records
- Clear all history at once
- Last visit timestamp automatically updated on revisits
