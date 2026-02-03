const Property = require("../models/property.model");
const axios = require("axios");

/**
 * SEARCH LOCATIONS FOR FILTER (OpenStreetMap)
 * GET /api/properties/locations?q=kamla+nagar
 * 
 * This endpoint provides location suggestions for the filter dropdown
 * Uses OpenStreetMap Nominatim API
 */
exports.searchLocationsForFilter = async (req, res) => {
    try {
        const { q, countrycode = "in" } = req.query;

        if (!q || q.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: q,
                    format: "json",
                    addressdetails: 1,
                    limit: 10,
                    countrycodes: countrycode
                },
                headers: {
                    "User-Agent": "TockenApp/1.0 (admin@realestate.com)"
                }
            }
        );

        if (response.data.length === 0) {
            return res.json({
                success: true,
                count: 0,
                locations: [],
                message: "No locations found"
            });
        }

        const locations = response.data.map(item => ({
            placeId: item.place_id,
            displayName: item.display_name,
            city:
                item.address?.city ||
                item.address?.town ||
                item.address?.village ||
                item.address?.county ||
                item.address?.state_district ||
                "",
            locality:
                item.address?.suburb ||
                item.address?.neighbourhood ||
                item.address?.residential ||
                "",
            state: item.address?.state || "",
            country: item.address?.country || "India",
            pincode: item.address?.postcode || "",
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        }));

        res.json({
            success: true,
            count: locations.length,
            locations
        });

    } catch (error) {
        console.error("Location search error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search locations",
            error: error.message
        });
    }
};

/**
 * FILTER PROPERTIES API
 * GET /api/properties/filter
 * 
 * This API supports all filter options from Flutter app:
 * - Rent/Lease, Co-living, PG, Buy, Plot/Land tabs
 * - Property Type, BHK, Budget, Area, Furnish, etc.
 * - OpenStreetMap location search with lat/lng support
 */
exports.filterProperties = async (req, res) => {
    try {
        const {
            // Tab selection
            listingType,        // RENT, SELL, Co-Living, PG

            // Location (from OpenStreetMap selection)
            city,
            locality,
            state,
            lat,                // Latitude from OpenStreetMap
            lng,                // Longitude from OpenStreetMap
            radius,             // Radius in km for nearby search

            // Property Category
            propertyType,       // RESIDENTIAL, COMMERCIAL
            propertyCategory,   // Apartment, Builder Floor, Villa, etc.

            // Rent/Buy specific
            preferredTenant,    // Family, Male, Female, Others (array)
            bhkType,            // 1BHK, 2BHK, 3BHK, etc. (array)
            furnishType,        // Fully Furnished, Semi Furnished, Unfurnished

            // Budget range
            minBudget,
            maxBudget,

            // Area range
            minArea,
            maxArea,

            // Property condition (for Buy)
            propertyCondition,  // Ready to move, Under Construction

            // PG specific
            pgFor,              // Male, Female, All
            roomSharingType,    // Private, Twin, Triple, Quad
            withMeals,          // true/false
            attachedBathroom,   // true/false
            attachedBalcony,    // true/false
            availabilityDate,   // Immediately, Within 15 days

            // Co-living specific
            lookingFor,         // Room/Flat, Roommate
            preferredGender,    // Male, Female, All
            preferringFor,      // Student, Working Professional, Other

            // View filters
            withImages,         // true = only with images
            forLease,           // true = for lease properties

            // Sorting
            sortBy,             // price_low, price_high, newest, oldest, score

            // Status filter (optional - for admin/testing)
            status,             // PENDING, ACTIVE, REJECTED, BLOCKED (default: ACTIVE)

            // Pagination
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = {
            isDeleted: false
        };

        // Status filter - default to ACTIVE for public, but allow override
        if (status) {
            // Allow multiple statuses: status=ACTIVE,PENDING
            const statuses = Array.isArray(status) ? status : status.split(",");
            query.status = { $in: statuses };
        } else {
            // Default: show only ACTIVE properties for public users
            query.status = "ACTIVE";
        }

        // ===== TAB FILTER =====
        if (listingType) {
            query.listingType = listingType;
        }

        // ===== LOCATION FILTER (OpenStreetMap Integrated) =====
        let locationData = null;

        // If lat/lng provided directly, use coordinate-based search
        if (lat && lng) {
            const radiusKm = parseFloat(radius) || 10; // Default 10km radius
            const radiusInDegrees = radiusKm / 111; // ~111km per degree

            query["location.coordinates.lat"] = {
                $gte: parseFloat(lat) - radiusInDegrees,
                $lte: parseFloat(lat) + radiusInDegrees
            };
            query["location.coordinates.lng"] = {
                $gte: parseFloat(lng) - radiusInDegrees,
                $lte: parseFloat(lng) + radiusInDegrees
            };

            locationData = { lat: parseFloat(lat), lng: parseFloat(lng), source: "direct" };
        }
        // If city/locality provided, fetch from OpenStreetMap and use coordinates
        else if (city || locality) {
            const searchQuery = locality ? `${locality}, ${city || ""}, India` : `${city}, India`;

            try {
                const osmResponse = await axios.get(
                    "https://nominatim.openstreetmap.org/search",
                    {
                        params: {
                            q: searchQuery,
                            format: "json",
                            addressdetails: 1,
                            limit: 1,
                            countrycodes: "in"
                        },
                        headers: {
                            "User-Agent": "TockenApp/1.0 (admin@realestate.com)"
                        }
                    }
                );

                if (osmResponse.data && osmResponse.data.length > 0) {
                    const location = osmResponse.data[0];
                    const osmLat = parseFloat(location.lat);
                    const osmLng = parseFloat(location.lon);
                    const radiusKm = parseFloat(radius) || 15; // Default 15km for city search
                    const radiusInDegrees = radiusKm / 111;

                    // Use coordinates for precise location matching
                    query["location.coordinates.lat"] = {
                        $gte: osmLat - radiusInDegrees,
                        $lte: osmLat + radiusInDegrees
                    };
                    query["location.coordinates.lng"] = {
                        $gte: osmLng - radiusInDegrees,
                        $lte: osmLng + radiusInDegrees
                    };

                    locationData = {
                        searchQuery,
                        displayName: location.display_name,
                        city: location.address?.city || location.address?.town || location.address?.state_district || city,
                        locality: location.address?.suburb || location.address?.neighbourhood || locality || "",
                        state: location.address?.state || "",
                        lat: osmLat,
                        lng: osmLng,
                        radius: radiusKm,
                        source: "openstreetmap"
                    };
                } else {
                    // Fallback to text-based search if OpenStreetMap returns no results
                    if (city) {
                        query["location.city"] = { $regex: city, $options: "i" };
                    }
                    if (locality) {
                        query["location.locality"] = { $regex: locality, $options: "i" };
                    }
                    locationData = { city, locality, source: "text_fallback" };
                }
            } catch (osmError) {
                console.error("OpenStreetMap API error:", osmError.message);
                // Fallback to text-based search on API error
                if (city) {
                    query["location.city"] = { $regex: city, $options: "i" };
                }
                if (locality) {
                    query["location.locality"] = { $regex: locality, $options: "i" };
                }
                locationData = { city, locality, source: "text_fallback", error: osmError.message };
            }
        }

        // State filter (additional)
        if (state) {
            query["location.state"] = { $regex: state, $options: "i" };
        }

        // ===== PROPERTY TYPE FILTER =====
        if (propertyType) {
            query.propertyType = propertyType;
        }
        if (propertyCategory) {
            // Support multiple categories
            const categories = Array.isArray(propertyCategory)
                ? propertyCategory
                : propertyCategory.split(",");
            query.propertyCategory = { $in: categories };
        }

        // ===== RESIDENTIAL FILTERS =====
        if (listingType === "RENT" || listingType === "SELL") {

            // BHK Type
            if (bhkType) {
                const bhkArray = Array.isArray(bhkType) ? bhkType : bhkType.split(",");
                query["residentialDetails.bhkType"] = { $in: bhkArray };
            }

            // Preferred Tenant (database field: preferredTenants - array)
            if (preferredTenant) {
                const tenants = Array.isArray(preferredTenant)
                    ? preferredTenant
                    : preferredTenant.split(",");
                query["residentialDetails.preferredTenants"] = { $in: tenants };
            }

            // Furnish Type (database field: furnishing.type)
            if (furnishType) {
                const furnishTypes = Array.isArray(furnishType)
                    ? furnishType
                    : furnishType.split(",");
                query["residentialDetails.furnishing.type"] = { $in: furnishTypes };
            }

            // Property Condition (for Buy - residential)
            if (propertyCondition) {
                query["residentialDetails.constructionStatus"] = propertyCondition;
            }

            // Budget filter - FIXED: Use correct field paths from model
            // RENT = pricing.rent.rentAmount, SELL = pricing.sell.expectedPrice
            if (minBudget || maxBudget) {
                const priceField = listingType === "RENT"
                    ? "pricing.rent.rentAmount"
                    : "pricing.sell.expectedPrice";

                if (minBudget && maxBudget) {
                    query[priceField] = {
                        $gte: parseInt(minBudget),
                        $lte: parseInt(maxBudget)
                    };
                } else if (minBudget) {
                    query[priceField] = { $gte: parseInt(minBudget) };
                } else if (maxBudget) {
                    query[priceField] = { $lte: parseInt(maxBudget) };
                }
            }

            // Area filter (database field: residentialDetails.area.builtUp.value)
            if (minArea || maxArea) {
                const areaQuery = {};
                if (minArea) areaQuery.$gte = parseInt(minArea);
                if (maxArea) areaQuery.$lte = parseInt(maxArea);
                query["residentialDetails.area.builtUp.value"] = areaQuery;
            }
        }

        // ===== PG FILTERS =====
        if (listingType === "PG") {
            if (pgFor) {
                query["pgDetails.pgFor"] = pgFor;
            }
            if (roomSharingType) {
                const sharingTypes = Array.isArray(roomSharingType)
                    ? roomSharingType
                    : roomSharingType.split(",");
                // FIXED: Model has roomTypes array with sharingType field
                query["pgDetails.roomTypes.sharingType"] = { $in: sharingTypes };
            }
            if (withMeals === "true") {
                // FIXED: Model has food.included (not foodIncluded)
                query["pgDetails.food.included"] = true;
            }
            if (preferringFor) {
                const suitedFor = Array.isArray(preferringFor)
                    ? preferringFor
                    : preferringFor.split(",");
                query["pgDetails.bestSuitedFor"] = { $in: suitedFor };
            }

            // Budget for PG - FIXED: pricing.rent.rentAmount (not pricing.rent.amount)
            if (minBudget || maxBudget) {
                const priceQuery = {};
                if (minBudget) priceQuery.$gte = parseInt(minBudget);
                if (maxBudget) priceQuery.$lte = parseInt(maxBudget);
                query["pricing.rent.rentAmount"] = priceQuery;
            }
        }

        // ===== CO-LIVING FILTERS =====
        if (listingType === "Co-Living") {
            if (lookingFor) {
                query["coLivingDetails.lookingFor"] = lookingFor;
            }
            if (preferredGender) {
                query["coLivingDetails.gender"] = preferredGender;
            }
            if (preferringFor) {
                query["coLivingDetails.occupation"] = { $regex: preferringFor, $options: "i" };
            }

            // Budget for Co-living
            if (minBudget || maxBudget) {
                const budgetQuery = {};
                if (minBudget) budgetQuery.$gte = parseInt(minBudget);
                if (maxBudget) budgetQuery.$lte = parseInt(maxBudget);
                query["coLivingDetails.budgetRange.max"] = budgetQuery;
            }
        }

        // ===== PLOT/LAND FILTERS =====
        // FIXED: Plot/Land data is stored in commercialDetails (not plotDetails)
        if (listingType === "PLOT_LAND" || propertyCategory === "Plot/Land") {
            // Plot Type (Residential/Commercial)
            if (propertyType) {
                query.propertyType = propertyType;
            }

            // Facing - FIXED: commercialDetails.facing
            if (req.query.facing) {
                query["commercialDetails.facing"] = req.query.facing;
            }

            // Corner Plot - FIXED: commercialDetails.cornerPlot
            if (req.query.cornerPlot === "true") {
                query["commercialDetails.cornerPlot"] = true;
            }

            // Boundary Wall - FIXED: commercialDetails.boundaryWall
            if (req.query.boundaryWall === "true") {
                query["commercialDetails.boundaryWall"] = true;
            }

            // Plot Area filter - FIXED: commercialDetails.plot.area
            if (minArea || maxArea) {
                const areaQuery = {};
                if (minArea) areaQuery.$gte = parseInt(minArea);
                if (maxArea) areaQuery.$lte = parseInt(maxArea);
                query["commercialDetails.plot.area"] = areaQuery;
            }

            // Budget for Plot/Land - FIXED: pricing.sell.expectedPrice
            if (minBudget || maxBudget) {
                const priceQuery = {};
                if (minBudget) priceQuery.$gte = parseInt(minBudget);
                if (maxBudget) priceQuery.$lte = parseInt(maxBudget);
                query["pricing.sell.expectedPrice"] = priceQuery;
            }
        }

        // ===== HOT DEALS / PREMIUM FILTER =====
        if (req.query.hotDeals === "true") {
            query.isPremium = true;
        }

        // ===== COMMON FILTERS =====

        // Only with images - FIXED: Model uses 'images' not 'photos'
        if (withImages === "true") {
            query["images.0"] = { $exists: true };
        }

        // ===== SORTING =====
        let sortOption = { createdAt: -1 }; // Default: newest first

        switch (sortBy) {
            case "price_low":
                // FIXED: Use correct field paths
                sortOption = { "pricing.rent.rentAmount": 1, "pricing.sell.expectedPrice": 1 };
                break;
            case "price_high":
                sortOption = { "pricing.rent.rentAmount": -1, "pricing.sell.expectedPrice": -1 };
                break;
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "score":
                sortOption = { listingScore: -1 };
                break;
            case "distance":
                // Distance sorting (if coordinates provided)
                if (lat && lng) {
                    sortOption = { "location.coordinates.lat": 1 };
                }
                break;
        }

        // ===== EXECUTE QUERY =====
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [properties, totalCount] = await Promise.all([
            Property.find(query)
                .populate("userId", "name phone profileImage")
                .sort({ isPremium: -1, "premium.boostRank": -1, ...sortOption })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Property.countDocuments(query)
        ]);

        // ===== RESPONSE =====
        res.status(200).json({
            success: true,
            properties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalProperties: totalCount,
                hasMore: (parseInt(page) * parseInt(limit)) < totalCount
            },
            filters: {
                applied: Object.keys(query).length - 2, // Exclude status and isDeleted
                query: req.query
            },
            location: locationData
        });

    } catch (error) {
        console.error("Filter properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to filter properties",
            error: error.message
        });
    }
};

/**
 * SEARCH PROPERTIES API
 * GET /api/properties/search?q=keyword
 * 
 * Search by city, locality, society, landmark
 */
exports.searchProperties = async (req, res) => {
    try {
        const { q, listingType, page = 1, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const searchRegex = { $regex: q, $options: "i" };

        const query = {
            status: "ACTIVE",
            isDeleted: false,
            $or: [
                { "location.city": searchRegex },
                { "location.locality": searchRegex },
                { "location.society": searchRegex },
                { "location.landmark": searchRegex },
                { "location.state": searchRegex },
                { propertyCategory: searchRegex }
            ]
        };

        if (listingType) {
            query.listingType = listingType;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [properties, totalCount] = await Promise.all([
            Property.find(query)
                .populate("userId", "name phone profileImage")
                .sort({ isPremium: -1, listingScore: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Property.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            properties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalProperties: totalCount,
                hasMore: (parseInt(page) * parseInt(limit)) < totalCount
            }
        });

    } catch (error) {
        console.error("Search properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search properties",
            error: error.message
        });
    }
};

/**
 * GET NEARBY PROPERTIES (OpenStreetMap Enhanced)
 * GET /api/properties/nearby?lat=28.5&lng=77.2&radius=5
 * 
 * Get properties within radius (km) using OpenStreetMap coordinates
 */
exports.getNearbyProperties = async (req, res) => {
    try {
        const { lat, lng, radius = 5, listingType, page = 1, limit = 20 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required. Use OpenStreetMap location search to get coordinates."
            });
        }

        // Convert radius from km to degrees (approximate)
        const radiusInDegrees = parseFloat(radius) / 111;

        const query = {
            status: "ACTIVE",
            isDeleted: false,
            "location.coordinates.lat": {
                $gte: parseFloat(lat) - radiusInDegrees,
                $lte: parseFloat(lat) + radiusInDegrees
            },
            "location.coordinates.lng": {
                $gte: parseFloat(lng) - radiusInDegrees,
                $lte: parseFloat(lng) + radiusInDegrees
            }
        };

        if (listingType) {
            query.listingType = listingType;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [properties, totalCount] = await Promise.all([
            Property.find(query)
                .populate("userId", "name phone profileImage")
                .sort({ isPremium: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Property.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            properties,
            searchLocation: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                radius: parseFloat(radius)
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalProperties: totalCount
            }
        });

    } catch (error) {
        console.error("Nearby properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get nearby properties",
            error: error.message
        });
    }
};

/**
 * GET PROPERTY DETAILS
 * GET /api/properties/:id
 */
exports.getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate("userId", "name phone profileImage userType");

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        res.status(200).json({
            success: true,
            property
        });

    } catch (error) {
        console.error("Get property error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get property",
            error: error.message
        });
    }
};

/**
 * GET MY PROPERTIES
 * GET /api/properties/my
 * 
 * Get properties created by logged in user
 */
exports.getMyProperties = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {
            userId: req.user.id,
            isDeleted: false
        };

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [properties, totalCount] = await Promise.all([
            Property.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Property.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            properties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalProperties: totalCount
            }
        });

    } catch (error) {
        console.error("Get my properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get your properties",
            error: error.message
        });
    }
};
