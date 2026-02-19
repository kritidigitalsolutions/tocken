# Most Popular Cities - Postman GET URLs

## 🔓 Public API Endpoint (For Flutter/Mobile App)

### Get All Active Most Popular Cities with Images

**Method:** `GET`

**URL:** 
```
http://localhost:5000/api/most-popular-cities
```

**Query Parameters (Optional):**
- `limit` - Number of cities to return (default: 10)
  - Example: `?limit=20`
- `activeOnly` - Show only active cities (default: true)
  - Example: `?activeOnly=false`

---

### Example Requests:

#### 1. Get Top 10 Active Cities (Default)
```
GET http://localhost:5000/api/most-popular-cities
```

#### 2. Get Top 20 Active Cities
```
GET http://localhost:5000/api/most-popular-cities?limit=20
```

#### 3. Get All Cities (Including Inactive)
```
GET http://localhost:5000/api/most-popular-cities?activeOnly=false
```

#### 4. Get Top 5 Active Cities
```
GET http://localhost:5000/api/most-popular-cities?limit=5
```

---

### Response Format:

```json
{
  "success": true,
  "message": "Found 3 most popular cities",
  "topCities": [
    {
      "_id": "6996bab7c377ee75c389f9b7",
      "city": "Agra",
      "totalProperties": 7,
      "imageUrl": "https://storage.googleapis.com/your-bucket/most-popular-cities/1738223456789_agra.jpg",
      "isActive": true,
      "lastUpdated": "2026-02-19T10:30:00.000Z"
    },
    {
      "_id": "6996bab7c377ee75c389f9b8",
      "city": "Pune",
      "totalProperties": 5,
      "imageUrl": "https://storage.googleapis.com/your-bucket/most-popular-cities/1738223456790_pune.jpg",
      "isActive": true,
      "lastUpdated": "2026-02-19T10:35:00.000Z"
    },
    {
      "_id": "6996bab7c377ee75c389f9b9",
      "city": "Mumbai",
      "totalProperties": 3,
      "imageUrl": null,
      "isActive": true,
      "lastUpdated": "2026-02-19T10:40:00.000Z"
    }
  ]
}
```

---

## 🔒 Admin API Endpoints (Requires Authentication)

### Get All Cities (Admin Panel)
```
GET http://localhost:5000/api/admin/most-popular-cities
```
**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Sync Cities from Active Properties
```
POST http://localhost:5000/api/admin/most-popular-cities/sync
```
**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 📝 Important Notes:

1. **Property Count Source:** 
   - Property counts are from **FilterProperty collection** (active/approved properties only)
   - Not from the main Property collection

2. **Image URLs:**
   - If admin has uploaded an image: Full Firebase Storage URL
   - If no image uploaded: `null`

3. **Active Status:**
   - `isActive: true` - City will show in public API
   - `isActive: false` - City hidden from public API (only visible to admin)

4. **Sorting:**
   - Cities are sorted by `totalProperties` in descending order
   - Most popular cities appear first

---

## 🧪 Testing in Postman:

1. **Open Postman**

2. **Create New Request:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/most-popular-cities`

3. **Send Request** - No authentication required for public endpoint!

4. **Response will show:**
   - City names
   - Active property counts (from FilterProperty collection)
   - Image URLs (if admin uploaded)
   - Active status

---

## 🔄 Flutter Integration Example:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<List<PopularCity>> getMostPopularCities() async {
  final response = await http.get(
    Uri.parse('https://your-api-domain.com/api/most-popular-cities?limit=10'),
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    if (data['success']) {
      final cities = data['topCities'] as List;
      return cities.map((city) => PopularCity.fromJson(city)).toList();
    }
  }
  throw Exception('Failed to load cities');
}
```

---

## 🎯 Production URL:

Replace `http://localhost:5000` with your production domain:

```
https://your-api-domain.com/api/most-popular-cities
```

---

## ✅ Complete Postman Collection Example:

### Collection Name: Most Popular Cities API

#### 1. Get Popular Cities (Public)
- **GET** `http://localhost:5000/api/most-popular-cities`

#### 2. Get Top 20 Cities
- **GET** `http://localhost:5000/api/most-popular-cities?limit=20`

#### 3. Get All Cities (Including Inactive)
- **GET** `http://localhost:5000/api/most-popular-cities?activeOnly=false&limit=50`

#### 4. Get Cities (Admin - With Auth)
- **GET** `http://localhost:5000/api/admin/most-popular-cities`
- **Headers:** `Authorization: Bearer YOUR_TOKEN`

#### 5. Sync Cities (Admin)
- **POST** `http://localhost:5000/api/admin/most-popular-cities/sync`
- **Headers:** `Authorization: Bearer YOUR_TOKEN`

---

## 🚀 Quick Start:

1. **Start Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Open Postman**

3. **Copy this URL and paste in Postman:**
   ```
   http://localhost:5000/api/most-popular-cities
   ```

4. **Click Send** - Done! 🎉

You'll get JSON data with all active cities, their property counts, and image URLs!
