# Most Popular Cities API Documentation

## Overview
This feature allows admin to manage most popular cities with images that will be displayed in the Flutter app. The system automatically syncs cities from the **FilterProperty collection** (active/approved properties only) and allows admins to upload images for each city.

**Important:** Property counts are fetched from the FilterProperty collection, which contains only active (approved) properties. This ensures accurate counts of available properties for users.

---

## API Endpoints

### 🔓 Public Endpoint (For Flutter App)

#### GET `/api/most-popular-cities`
Get list of active popular cities with their images.

**Query Parameters:**
- `limit` (optional, default: 10) - Maximum number of cities to return
- `activeOnly` (optional, default: true) - Filter only active cities

**Response:**
```json
{
  "success": true,
  "message": "Found 5 most popular cities",
  "topCities": [
    {
      "_id": "65f123abc...",
      "city": "Agra",
      "totalProperties": 7,
      "imageUrl": "https://storage.googleapis.com/...",
      "isActive": true,
      "lastUpdated": "2024-02-19T10:30:00.000Z"
    },
    {
      "_id": "65f124def...",
      "city": "Pune",
      "totalProperties": 1,
      "imageUrl": null,
      "isActive": true,
      "lastUpdated": "2024-02-19T10:30:00.000Z"
    }
  ]
}
```

---

### 🔒 Admin Endpoints (Requires Authentication)

#### GET `/api/admin/most-popular-cities`
Get all cities (including inactive) with their data.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `limit` (optional, default: 10)
- `activeOnly` (optional, default: true) - Set to `false` to see all cities

**Response:**
Same as public endpoint but includes inactive cities.

---

#### POST `/api/admin/most-popular-cities/sync`
Syncs cities from **FilterProperty collection** (active/approved properties only). This aggregates all active properties by city and creates/updates entries in the MostPopularCities collection.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cities synced successfully from active properties",
  "synced": 10,
  "created": 5,
  "updated": 5,
  "topCities": [
    {
      "city": "Agra",
      "totalProperties": 7
    },
    {
      "city": "Pune",
      "totalProperties": 1
    }
  ]
}
```

---

#### POST `/api/admin/most-popular-cities/:id/upload-image`
Upload an image for a specific city.

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `image` (file) - Image file (JPG, PNG, WEBP, max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "City image uploaded successfully",
  "city": {
    "_id": "65f123abc...",
    "city": "Agra",
    "totalProperties": 7,
    "imageUrl": "https://storage.googleapis.com/...",
    "isActive": true
  }
}
```

---

#### PATCH `/api/admin/most-popular-cities/:id/status`
Toggle city active/inactive status.

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "City activated successfully",
  "city": {
    "_id": "65f123abc...",
    "city": "Agra",
    "totalProperties": 7,
    "imageUrl": "https://storage.googleapis.com/...",
    "isActive": true,
    "lastUpdated": "2024-02-19T10:35:00.000Z"
  }
}
```

---

#### DELETE `/api/admin/most-popular-cities/:id/image`
Delete the image of a specific city (keeps the city entry).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "City image deleted successfully",
  "city": {
    "_id": "65f123abc...",
    "city": "Agra",
    "totalProperties": 7,
    "imageUrl": null,
    "imageName": null,
    "isActive": true
  }
}
```

---

#### DELETE `/api/admin/most-popular-cities/:id`
Delete a city entry completely (including image).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "City deleted successfully"
}
```

---

## Admin Panel Features

### Access
Navigate to **Admin Panel → Popular Cities** (MapPin icon in sidebar)

### Features

1. **View All Cities**
   - See all cities with their property counts
   - View uploaded images
   - Filter active/inactive cities

2. **Sync from Properties**
   - Click "Sync from Properties" button
   - Automatically aggregates cities from property database
   - Updates property counts for existing cities
   - Creates new entries for new cities

3. **Upload City Image**
   - Click "Upload" or "Change" button on a city card
   - Select image (JPG, PNG, WEBP, max 5MB)
   - Preview before uploading
   - Image is stored in Firebase Storage
   - Old image is automatically deleted when uploading new one

4. **Toggle City Status**
   - Click eye icon to activate/deactivate city
   - Inactive cities won't appear in public API
   - Useful for hiding cities without images

5. **Delete Image**
   - Click image icon to remove city image only
   - City entry remains in database

6. **Delete City**
   - Click trash icon to delete city completely
   - Removes city from database and deletes image

---

## Database Schema

### MostPopularCities Model

```javascript
{
  city: String,              // City name (unique)
  totalProperties: Number,   // Property count
  imageUrl: String,          // Firebase Storage URL
  imageName: String,         // Firebase file name (for deletion)
  isActive: Boolean,         // Active status
  lastUpdated: Date,         // Last update timestamp
  createdAt: Date,           // Created timestamp
  updatedAt: Date            // Updated timestamp
}
```

### Indexes
- `city` (unique)
- `totalProperties` (descending for fast sorting)

---

## Flutter Integration

### Example Usage (Dart/Flutter)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<List<PopularCity>> getMostPopularCities() async {
  final response = await http.get(
    Uri.parse('https://your-api-url.com/api/most-popular-cities?limit=10'),
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    final cities = data['topCities'] as List;
    return cities.map((city) => PopularCity.fromJson(city)).toList();
  } else {
    throw Exception('Failed to load cities');
  }
}

class PopularCity {
  final String id;
  final String city;
  final int totalProperties;
  final String? imageUrl;
  final bool isActive;

  PopularCity({
    required this.id,
    required this.city,
    required this.totalProperties,
    this.imageUrl,
    required this.isActive,
  });

  factory PopularCity.fromJson(Map<String, dynamic> json) {
    return PopularCity(
      id: json['_id'],
      city: json['city'],
      totalProperties: json['totalProperties'],
      imageUrl: json['imageUrl'],
      isActive: json['isActive'],
    );
  }
}
```

---

## Workflow

### Initial Setup
1. Admin logs into admin panel
2. Navigates to "Popular Cities"
3. Clicks "Sync from Properties"
4. System aggregates all cities from properties:
   ```json
   {
     "success": true,
     "message": "Cities synced successfully",
     "synced": 10,
     "created": 10,
     "updated": 0,
     "topCities": [
       { "city": "Agra", "totalProperties": 7 },
       { "city": "Pune", "totalProperties": 1 }
       // ... more cities
     ]
   }
   ```

### Adding Images
1. Cities appear in grid without images (placeholder shown)
2. Admin clicks "Upload" on a city card
3. Selects and uploads image
4. Image is stored in Firebase Storage: `most-popular-cities/{timestamp}_{filename}`
5. City entry is updated with imageUrl

### Flutter App Fetches Data
1. Flutter app calls `/api/most-popular-cities`
2. Receives cities with images and property counts
3. Displays in "Most Popular Cities" section
4. Shows city image, name, and property count

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "success": false,
  "message": "Please upload an image file"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "City not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to upload city image"
}
```

---

## Notes

1. **Property Count Auto-Update**: Use "Sync from Properties" regularly to update property counts
2. **Image Storage**: Images are stored in Firebase Storage under `most-popular-cities/` folder
3. **Image Deletion**: When uploading new image or deleting city, old image is automatically removed from Firebase
4. **Active/Inactive**: Only active cities appear in public API for Flutter app
5. **Performance**: Database is indexed for fast queries
6. **File Size Limits**: Backend allows 10MB, frontend validates 5MB

---

## Testing

### Test Sync
```bash
curl -X POST https://your-api-url.com/api/admin/most-popular-cities/sync \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Get Cities
```bash
curl https://your-api-url.com/api/most-popular-cities?limit=5
```

### Test Upload Image
```bash
curl -X POST https://your-api-url.com/api/admin/most-popular-cities/CITY_ID/upload-image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

---

## Future Enhancements

1. **City Description**: Add description field for each city
2. **City Order**: Add manual ordering/priority
3. **Analytics**: Track city views/clicks
4. **Bulk Upload**: Upload multiple city images at once
5. **Image Optimization**: Auto-resize and optimize images
6. **Cache**: Implement Redis caching for faster responses
