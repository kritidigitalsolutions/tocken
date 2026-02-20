const FilterProperty = require("../models/filterProperty.model");
const Property = require("../models/property.model"); // For getMyProperties (user's own properties)
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
 * Helper function to check if a value is empty
 * Returns true if value is: null, undefined, "", [], {}
 */
const isEmptyValue = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (Array.isArray(value) && value.every(v => v === "" || v === null || v === undefined)) return true;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return true;
    return false;
};

/**
 * Helper function to filter out empty values from array
 */
const filterEmptyFromArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.filter(v => v !== null && v !== undefined && v !== "");
};

/**
 * FILTER PROPERTIES API
 * POST /api/properties/filter
 * 
 * This API supports all filter options from Flutter app:
 * - Rent/Lease, Co-living, PG, Buy, Plot/Land tabs
 * - Property Type, BHK, Budget, Area, Furnish, etc.
 * - OpenStreetMap location search with lat/lng support
 * 
 * Send filter data in request body (JSON)
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

            // Plot/Land specific
            facing,             // North, South, East, West
            cornerPlot,         // true/false
            boundaryWall,       // true/false

            // Premium filter
            hotDeals,           // true = only premium properties

            // Sorting
            sortBy,             // price_low, price_high, newest, oldest, score

            // Status filter (optional - for admin/testing)
            status,             // PENDING, ACTIVE, REJECTED, BLOCKED (default: ACTIVE)

            // Pagination
            page = 1,
            limit = 20
        } = req.body;

        // Build query - FilterProperty collection only has ACTIVE properties
        // No need for status filter as all properties here are already approved
        const query = {};

        // ===== TAB FILTER =====
        if (listingType) {
            query.listingType = listingType;
        }

        // ===== LOCATION FILTER (Text-based + OpenStreetMap) =====
        let locationData = null;

        // If lat/lng provided directly, use coordinate-based search WITH text fallback
        if (lat && lng) {
            const radiusKm = parseFloat(radius) || 10; // Default 10km radius
            const radiusInDegrees = radiusKm / 111; // ~111km per degree

            // Use $or to match either coordinates OR city name (for properties without coordinates)
            const coordinateQuery = {
                $and: [
                    { "location.coordinates.lat": { $gte: parseFloat(lat) - radiusInDegrees, $lte: parseFloat(lat) + radiusInDegrees } },
                    { "location.coordinates.lng": { $gte: parseFloat(lng) - radiusInDegrees, $lte: parseFloat(lng) + radiusInDegrees } }
                ]
            };

            // If city is also provided, add text fallback
            if (city) {
                query.$or = [
                    coordinateQuery,
                    { "location.city": { $regex: city, $options: "i" } }
                ];
            } else {
                query["location.coordinates.lat"] = {
                    $gte: parseFloat(lat) - radiusInDegrees,
                    $lte: parseFloat(lat) + radiusInDegrees
                };
                query["location.coordinates.lng"] = {
                    $gte: parseFloat(lng) - radiusInDegrees,
                    $lte: parseFloat(lng) + radiusInDegrees
                };
            }

            locationData = { lat: parseFloat(lat), lng: parseFloat(lng), source: "direct" };
        }
        // If city/locality provided - USE TEXT-BASED SEARCH (case insensitive)
        else if (city || locality) {
            // ALWAYS use text-based search for city/locality (case insensitive)
            // This is more reliable as many properties don't have coordinates stored
            if (city) {
                query["location.city"] = { $regex: city, $options: "i" };
            }
            if (locality) {
                query["location.locality"] = { $regex: locality, $options: "i" };
            }

            // Still fetch from OpenStreetMap for location info display
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
                    locationData = {
                        searchQuery,
                        displayName: location.display_name,
                        city: location.address?.city || location.address?.town || location.address?.state_district || city,
                        locality: location.address?.suburb || location.address?.neighbourhood || locality || "",
                        state: location.address?.state || "",
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lon),
                        source: "openstreetmap_text_search"
                    };
                } else {
                    locationData = { city, locality, source: "text_search" };
                }
            } catch (osmError) {
                console.error("OpenStreetMap API error:", osmError.message);
                locationData = { city, locality, source: "text_search", error: osmError.message };
            }
        }

        // State filter (additional) - case insensitive
        if (!isEmptyValue(state)) {
            query["location.state"] = { $regex: state, $options: "i" };
        }

        // ===== PROPERTY TYPE FILTER =====
        if (!isEmptyValue(propertyType)) {
            query.propertyType = { $regex: `^${propertyType}$`, $options: "i" };
        }
        if (!isEmptyValue(propertyCategory)) {
            // Support multiple categories - case insensitive using regex
            const categories = filterEmptyFromArray(
                Array.isArray(propertyCategory) ? propertyCategory : propertyCategory.split(",")
            );
            if (categories.length > 0) {
                // Create case-insensitive regex for each category
                const categoryRegexes = categories.map(cat => new RegExp(`^${cat.trim()}$`, "i"));
                query.propertyCategory = { $in: categoryRegexes };
            }
        }

        // ===== RESIDENTIAL FILTERS =====
        if (listingType === "RENT" || listingType === "SELL") {

            // BHK Type - case insensitive (ignore if empty)
            if (!isEmptyValue(bhkType)) {
                const bhkArray = filterEmptyFromArray(
                    Array.isArray(bhkType) ? bhkType : bhkType.split(",")
                );
                if (bhkArray.length > 0) {
                    const bhkRegexes = bhkArray.map(bhk => new RegExp(`^${bhk.trim()}$`, "i"));
                    query["residentialDetails.bhkType"] = { $in: bhkRegexes };
                }
            }

            // Preferred Tenant (database field: preferredTenants - array) - case insensitive (ignore if empty)
            if (!isEmptyValue(preferredTenant)) {
                const tenants = filterEmptyFromArray(
                    Array.isArray(preferredTenant) ? preferredTenant : preferredTenant.split(",")
                );
                if (tenants.length > 0) {
                    const tenantRegexes = tenants.map(t => new RegExp(`^${t.trim()}$`, "i"));
                    query["residentialDetails.preferredTenants"] = { $in: tenantRegexes };
                }
            }

            // Furnish Type (database field: furnishing.type) - case insensitive (ignore if empty)
            if (!isEmptyValue(furnishType)) {
                const furnishTypes = filterEmptyFromArray(
                    Array.isArray(furnishType) ? furnishType : furnishType.split(",")
                );
                if (furnishTypes.length > 0) {
                    const furnishRegexes = furnishTypes.map(f => new RegExp(`^${f.trim()}$`, "i"));
                    query["residentialDetails.furnishing.type"] = { $in: furnishRegexes };
                }
            }

            // Property Condition (for Buy - residential) - case insensitive (ignore if empty)
            if (!isEmptyValue(propertyCondition)) {
                query["residentialDetails.constructionStatus"] = { $regex: `^${propertyCondition}$`, $options: "i" };
            }

            // Budget filter: use $or to cover all possible price field names
            if ((minBudget && parseInt(minBudget) > 0) || (maxBudget && parseInt(maxBudget) > 0)) {
                const priceQuery = {};
                if (minBudget && parseInt(minBudget) > 0) priceQuery.$gte = parseInt(minBudget);
                if (maxBudget && parseInt(maxBudget) > 0) priceQuery.$lte = parseInt(maxBudget);

                if (Object.keys(priceQuery).length > 0) {
                    let priceOrConditions;
                    if (listingType === "RENT") {
                        // RENT: rentAmount (residential/commercial) OR leaseAmount
                        priceOrConditions = [
                            { "pricing.rent.rentAmount": priceQuery },
                            { "pricing.rent.leaseAmount": priceQuery }
                        ];
                    } else {
                        // SELL: sell.expectedPrice OR salePrice (both used in model)
                        priceOrConditions = [
                            { "pricing.sell.expectedPrice": priceQuery },
                            { "pricing.salePrice": priceQuery }
                        ];
                    }
                    // Merge safely: if $or already set (from location), move into $and
                    if (query.$or) {
                        query.$and = query.$and || [];
                        query.$and.push({ $or: query.$or });
                        delete query.$or;
                    }
                    if (query.$and) {
                        query.$and.push({ $or: priceOrConditions });
                    } else {
                        query.$or = priceOrConditions;
                    }
                }
            }

            // Area filter: check both residential and commercial area fields
            if ((minArea && parseInt(minArea) > 0) || (maxArea && parseInt(maxArea) > 0)) {
                const areaQuery = {};
                if (minArea && parseInt(minArea) > 0) areaQuery.$gte = parseInt(minArea);
                if (maxArea && parseInt(maxArea) > 0) areaQuery.$lte = parseInt(maxArea);
                if (Object.keys(areaQuery).length > 0) {
                    const areaOrConditions = [
                        { "residentialDetails.area.builtUp.value": areaQuery },
                        { "residentialDetails.area.carpet.value": areaQuery },
                        { "commercialDetails.area.builtUp.value": areaQuery },
                        { "commercialDetails.plot.area": areaQuery }
                    ];
                    if (query.$or) {
                        query.$and = query.$and || [];
                        query.$and.push({ $or: query.$or });
                        delete query.$or;
                    }
                    if (query.$and) {
                        query.$and.push({ $or: areaOrConditions });
                    } else {
                        query.$or = areaOrConditions;
                    }
                }
            }
        }

        // ===== PG FILTERS =====
        if (listingType === "PG") {
            if (!isEmptyValue(pgFor)) {
                query["pgDetails.pgFor"] = { $regex: `^${pgFor}$`, $options: "i" };
            }
            if (!isEmptyValue(roomSharingType)) {
                const sharingTypes = filterEmptyFromArray(
                    Array.isArray(roomSharingType) ? roomSharingType : roomSharingType.split(",")
                );
                if (sharingTypes.length > 0) {
                    const sharingRegexes = sharingTypes.map(s => new RegExp(`^${s.trim()}$`, "i"));
                    // FIXED: Model has roomTypes array with sharingType field
                    query["pgDetails.roomTypes.sharingType"] = { $in: sharingRegexes };
                }
            }
            if (withMeals === "true" || withMeals === true) {
                // FIXED: Model has food.included (not foodIncluded)
                query["pgDetails.food.included"] = true;
            }
            if (!isEmptyValue(attachedBathroom) && (attachedBathroom === "true" || attachedBathroom === true)) {
                query["pgDetails.roomTypes.attachedBathroom"] = true;
            }
            if (!isEmptyValue(attachedBalcony) && (attachedBalcony === "true" || attachedBalcony === true)) {
                query["pgDetails.roomTypes.attachedBalcony"] = true;
            }
            if (!isEmptyValue(availabilityDate)) {
                // Map availability to actual date comparison or text match
                query["pgDetails.availableFrom"] = { $regex: availabilityDate, $options: "i" };
            }
            if (!isEmptyValue(preferringFor)) {
                const suitedFor = filterEmptyFromArray(
                    Array.isArray(preferringFor) ? preferringFor : preferringFor.split(",")
                );
                if (suitedFor.length > 0) {
                    const suitedRegexes = suitedFor.map(s => new RegExp(`^${s.trim()}$`, "i"));
                    query["pgDetails.bestSuitedFor"] = { $in: suitedRegexes };
                }
            }

            // Budget for PG: check pricing.rent.rentAmount AND pgDetails.roomTypes.rentAmount
            if ((minBudget && parseInt(minBudget) > 0) || (maxBudget && parseInt(maxBudget) > 0)) {
                const priceQuery = {};
                if (minBudget && parseInt(minBudget) > 0) priceQuery.$gte = parseInt(minBudget);
                if (maxBudget && parseInt(maxBudget) > 0) priceQuery.$lte = parseInt(maxBudget);
                if (Object.keys(priceQuery).length > 0) {
                    const pgPriceOr = [
                        { "pricing.rent.rentAmount": priceQuery },
                        { "pgDetails.roomTypes.rentAmount": priceQuery }
                    ];
                    if (query.$or) {
                        query.$and = query.$and || [];
                        query.$and.push({ $or: query.$or });
                        delete query.$or;
                    }
                    if (query.$and) {
                        query.$and.push({ $or: pgPriceOr });
                    } else {
                        query.$or = pgPriceOr;
                    }
                }
            }
        }

        // ===== CO-LIVING FILTERS =====
        if (listingType === "CO_LIVING" || listingType === "co_living" || listingType === "CO-LIVING") {
            if (!isEmptyValue(lookingFor)) {
                query["coLivingDetails.lookingFor"] = { $regex: `^${lookingFor}$`, $options: "i" };
            }
            if (!isEmptyValue(preferredGender)) {
                query["coLivingDetails.gender"] = { $regex: `^${preferredGender}$`, $options: "i" };
            }
            if (!isEmptyValue(preferringFor)) {
                const occupations = filterEmptyFromArray(
                    Array.isArray(preferringFor) ? preferringFor : preferringFor.split(",")
                );
                if (occupations.length > 0) {
                    const occRegexes = occupations.map(o => new RegExp(o.trim(), "i"));
                    query["coLivingDetails.occupation"] = { $in: occRegexes };
                }
            }

            // Budget for Co-living - only if > 0
            if ((minBudget && parseInt(minBudget) > 0) || (maxBudget && parseInt(maxBudget) > 0)) {
                const budgetQuery = {};
                if (minBudget && parseInt(minBudget) > 0) budgetQuery.$gte = parseInt(minBudget);
                if (maxBudget && parseInt(maxBudget) > 0) budgetQuery.$lte = parseInt(maxBudget);
                if (Object.keys(budgetQuery).length > 0) {
                    query["coLivingDetails.budgetRange.max"] = budgetQuery;
                }
            }
        }

        // ===== PLOT/LAND FILTERS =====
        // FIXED: Plot/Land data is stored in commercialDetails (not plotDetails)
        if (listingType === "PLOT/LAND" || (!isEmptyValue(propertyCategory) && (
            (Array.isArray(propertyCategory) && propertyCategory.some(c => c && /plot|land/i.test(c))) ||
            (typeof propertyCategory === "string" && /plot|land/i.test(propertyCategory))
        ))) {
            // Facing - FIXED: commercialDetails.facing - case insensitive
            if (!isEmptyValue(facing)) {
                query["commercialDetails.facing"] = { $regex: `^${facing}$`, $options: "i" };
            }

            // Corner Plot - FIXED: commercialDetails.cornerPlot
            if (cornerPlot === true || cornerPlot === "true") {
                query["commercialDetails.cornerPlot"] = true;
            }

            // Boundary Wall - FIXED: commercialDetails.boundaryWall
            if (boundaryWall === true || boundaryWall === "true") {
                query["commercialDetails.boundaryWall"] = true;
            }

            // Plot Area filter - FIXED: commercialDetails.plot.area - only if > 0
            if ((minArea && parseInt(minArea) > 0) || (maxArea && parseInt(maxArea) > 0)) {
                const areaQuery = {};
                if (minArea && parseInt(minArea) > 0) areaQuery.$gte = parseInt(minArea);
                if (maxArea && parseInt(maxArea) > 0) areaQuery.$lte = parseInt(maxArea);
                if (Object.keys(areaQuery).length > 0) {
                    query["commercialDetails.plot.area"] = areaQuery;
                }
            }

            // Budget for Plot/Land - FIXED: pricing.sell.expectedPrice - only if > 0
            if ((minBudget && parseInt(minBudget) > 0) || (maxBudget && parseInt(maxBudget) > 0)) {
                const priceQuery = {};
                if (minBudget && parseInt(minBudget) > 0) priceQuery.$gte = parseInt(minBudget);
                if (maxBudget && parseInt(maxBudget) > 0) priceQuery.$lte = parseInt(maxBudget);
                if (Object.keys(priceQuery).length > 0) {
                    query["pricing.sell.expectedPrice"] = priceQuery;
                }
            }
        }

        // ===== HOT DEALS / PREMIUM FILTER =====
        if (hotDeals === true || hotDeals === "true") {
            query.isPremium = true;
        }

        // ===== COMMON FILTERS =====

        // Only with images - FIXED: Model uses 'images' not 'photos'
        if (withImages === true || withImages === "true") {
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
                sortOption = { originalCreatedAt: -1 };
                break;
            case "oldest":
                sortOption = { originalCreatedAt: 1 };
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
            FilterProperty.find(query)
                .populate("userId", "name phone profileImage")
                .sort({ isPremium: -1, "premium.boostRank": -1, ...sortOption })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            FilterProperty.countDocuments(query)
        ]);

        // ===== RESPONSE =====
        res.status(200).json({
            success: true,
            properties: properties,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalProperties: totalCount,
                hasMore: (parseInt(page) * parseInt(limit)) < totalCount
            },
            filters: {
                applied: Object.keys(query).length,
                appliedQuery: query,  // Debug: show actual MongoDB query
                requestBody: req.body
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
 * Fetches from FilterProperty collection (only ACTIVE/approved properties)
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

        // FilterProperty collection only has ACTIVE properties
        const query = {
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
            FilterProperty.find(query)
                .populate("userId", "name phone profileImage")
                .sort({ isPremium: -1, listingScore: -1, originalCreatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            FilterProperty.countDocuments(query)
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
 * Fetches from FilterProperty collection (only ACTIVE/approved properties)
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

        // FilterProperty collection only has ACTIVE properties
        const query = {
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
            FilterProperty.find(query)
                .populate("userId", "name phone profileImage")
                .sort({ isPremium: -1, originalCreatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            FilterProperty.countDocuments(query)
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
 * GET PROPERTY DETAILS (from FilterProperty for public)
 * GET /api/properties/:id
 */
exports.getPropertyById = async (req, res) => {
    try {
        // Try to find in FilterProperty first (for ACTIVE properties)
        let property = await FilterProperty.findOne({ originalPropertyId: req.params.id })
            .populate("userId", "name phone profileImage userType");

        // If not found in FilterProperty, it might be accessed directly by ID
        if (!property) {
            property = await FilterProperty.findById(req.params.id)
                .populate("userId", "name phone profileImage userType");
        }

        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found or not active"
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

/**
 * GET RECENTLY ACTIVATED PROPERTIES (PUBLIC API)
 * GET /api/properties/recently-activated?limit=10&days=7&propertyType=RESIDENTIAL
 * 
 * Returns properties recently activated by admin, sorted by activation time
 * For Flutter app's "Recently Added" section
 */
exports.getRecentlyActivatedProperties = async (req, res) => {
    try {
        const { 
            limit = 10, 
            days = 7,           // Get properties activated in last N days
            propertyType,       // RESIDENTIAL, COMMERCIAL
            listingType,        // RENT, SELL, PG, CO_LIVING  
            city
        } = req.query;

        // Build query
        const query = {
            status: "ACTIVE",
            activatedAt: { 
                $ne: null,
                $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) // Last N days
            }
        };

        // Optional filters
        if (propertyType) query.propertyType = propertyType;
        if (listingType) query.listingType = listingType;
        if (city) query["location.city"] = new RegExp(city, 'i');

        // Get complete property data without field restrictions
        const properties = await Property.find(query)
            .populate("userId", "firstName lastName name phone email userType profileImage")
            .sort({ activatedAt: -1 })  // Newest activated first
            .limit(parseInt(limit));

        console.log("🔍 Recently activated properties found:", properties.length);

        // Format response with complete property data
        const formattedProperties = properties.map(property => {
            console.log("🏠 Processing recently activated property:", property._id, property.propertyCategory);

            // Generate comprehensive title
            let propertyTitle = property.title;
            if (!propertyTitle) {
                if (property.pgDetails?.pgName) {
                    propertyTitle = property.pgDetails.pgName;
                } else if (property.coLivingDetails?.coLivingName) {
                    propertyTitle = property.coLivingDetails.coLivingName;
                } else {
                    propertyTitle = `${property.propertyCategory || 'Property'} in ${property.location?.locality || property.location?.city || 'Unknown Location'}`;
                }
            }

            // Handle all image types
            let primaryImage = null;
            let allImages = [];
            if (property.images && property.images.length > 0) {
                allImages = property.images;
                const primaryImg = property.images.find(img => 
                    (typeof img === 'object' && img.isPrimary) || 
                    (typeof img === 'string')
                );
                primaryImage = primaryImg ? 
                    (typeof primaryImg === 'string' ? primaryImg : primaryImg.url) :
                    (typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url);
            }

            // Get property details based on type
            let bhkType = "N/A";
            let area = 0;
            let specificDetails = {};
            
            if (property.residentialDetails) {
                bhkType = property.residentialDetails.bhkType || "N/A";
                area = property.residentialDetails.area?.builtUp || property.residentialDetails.area?.carpet || 0;
                specificDetails = {
                    type: "residential",
                    bhkType: property.residentialDetails.bhkType,
                    area: property.residentialDetails.area,
                    furnishing: property.residentialDetails.furnishing,
                    preferredTenants: property.residentialDetails.preferredTenants,
                    amenities: property.residentialDetails.amenities,
                    constructionStatus: property.residentialDetails.constructionStatus
                };
            } else if (property.commercialDetails) {
                bhkType = property.commercialDetails.commercialType || "Commercial";
                area = property.commercialDetails.area?.builtUp || property.commercialDetails.area?.carpet || 0;
                specificDetails = {
                    type: "commercial",
                    commercialType: property.commercialDetails.commercialType,
                    area: property.commercialDetails.area,
                    furnished: property.commercialDetails.furnished,
                    parking: property.commercialDetails.parking,
                    washrooms: property.commercialDetails.washrooms,
                    facing: property.commercialDetails.facing
                };
            } else if (property.pgDetails) {
                bhkType = property.pgDetails.accommodationType || "PG";
                area = property.pgDetails.area || 0;
                specificDetails = {
                    type: "pg",
                    pgName: property.pgDetails.pgName,
                    pgFor: property.pgDetails.pgFor,
                    accommodationType: property.pgDetails.accommodationType,
                    roomTypes: property.pgDetails.roomTypes,
                    food: property.pgDetails.food,
                    amenities: property.pgDetails.amenities,
                    rules: property.pgDetails.rules
                };
            } else if (property.coLivingDetails) {
                bhkType = "Co-Living";
                area = property.coLivingDetails.area || 0;
                specificDetails = {
                    type: "coliving",
                    coLivingName: property.coLivingDetails.coLivingName,
                    gender: property.coLivingDetails.gender,
                    occupation: property.coLivingDetails.occupation,
                    roomTypes: property.coLivingDetails.roomTypes,
                    amenities: property.coLivingDetails.amenities
                };
            }

            // Comprehensive pricing
            let pricing = {
                rent: property.pricing?.rent || property.pricing?.monthlyRent || 0,
                sale: property.pricing?.sale || property.pricing?.expectedPrice || 0,
                deposit: property.pricing?.deposit || 0,
                maintenance: property.pricing?.maintenance || 0
            };

            // Owner information
            const owner = {
                id: property.userId?._id,
                name: property.userId?.name || 
                      `${property.userId?.firstName || ''} ${property.userId?.lastName || ''}`.trim() ||
                      "Unknown Owner",
                firstName: property.userId?.firstName,
                lastName: property.userId?.lastName,
                phone: property.userId?.phone,
                email: property.userId?.email,
                userType: property.userId?.userType || "INDIVIDUAL",
                profileImage: property.userId?.profileImage
            };

            return {
                _id: property._id,
                title: propertyTitle,
                listingType: property.listingType,
                propertyType: property.propertyType,
                propertyCategory: property.propertyCategory,
                
                // Complete pricing information
                pricing: pricing,
                price: pricing.sale || pricing.rent,
                priceType: property.listingType === "SELL" ? "sale" : "rent",
                
                // Complete location
                location: {
                    city: property.location?.city,
                    locality: property.location?.locality,
                    area: property.location?.area,
                    state: property.location?.state,
                    pincode: property.location?.pincode,
                    landmark: property.location?.landmark,
                    society: property.location?.society,
                    coordinates: property.location?.coordinates,
                    displayName: property.location?.displayName || 
                                `${property.location?.locality || ""}, ${property.location?.city || ""}`.trim().replace(/^,\s*/, '')
                },
                
                // Complete image data
                images: allImages,
                primaryImage: primaryImage,
                imageCount: allImages.length,
                
                // Property specifications
                bhk: bhkType,
                area: area,
                
                // Type-specific details
                details: specificDetails,
                
                // Complete descriptions
                description: property.description,
                
                // Owner information
                owner: owner,
                
                // Property metadata
                status: property.status,
                isPremium: property.isPremium || false,
                listingScore: property.listingScore || 0,
                
                // Timestamps
                activatedAt: property.activatedAt,
                createdAt: property.createdAt,
                updatedAt: property.updatedAt,
                daysAgo: Math.floor((Date.now() - new Date(property.activatedAt)) / (1000 * 60 * 60 * 24)),
                daysOnMarket: Math.floor((Date.now() - new Date(property.createdAt)) / (1000 * 60 * 60 * 24)),
                
                // Additional flags
                isNew: Math.floor((Date.now() - new Date(property.activatedAt)) / (1000 * 60 * 60 * 24)) < 3,
                isFeatured: property.listingScore > 80,
                
                // Property features (if available)
                features: property.features || [],
                amenities: property.residentialDetails?.amenities || 
                          property.commercialDetails?.amenities || 
                          property.pgDetails?.amenities || 
                          property.coLivingDetails?.amenities || []
            };
        });

        console.log("🎯 Formatted recently activated properties count:", formattedProperties.length);

        res.status(200).json({
            success: true,
            count: formattedProperties.length,
            message: `Found ${formattedProperties.length} recently activated properties`,
            data: formattedProperties,
            filters: {
                days: parseInt(days),
                propertyType: propertyType || "ALL",
                listingType: listingType || "ALL",
                city: city || "ALL",
                activatedInLast: `${days} days`
            },
            debug: {
                totalFound: properties.length,
                queryUsed: query,
                sortBy: "activatedAt (newest first)"
            }
        });

    } catch (error) {
        console.error("❌ Get recently activated properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get recently activated properties",
            error: error.message
        });
    }
};
