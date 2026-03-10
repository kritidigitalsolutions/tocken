const axios = require("axios");
const User = require("../models/user.model");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Parse Google Geocoding address_components into a flat object
 */
const parseGoogleAddressComponents = (components) => {
    const result = { city: "", locality: "", state: "", country: "India", pincode: "" };
    for (const comp of components) {
        if (comp.types.includes("locality")) {
            result.city = comp.long_name;
        } else if (comp.types.includes("administrative_area_level_3") && !result.city) {
            result.city = comp.long_name;
        } else if (comp.types.includes("administrative_area_level_2") && !result.city) {
            result.city = comp.long_name;
        }
        if (comp.types.includes("sublocality_level_1") || comp.types.includes("neighborhood")) {
            result.locality = comp.long_name;
        }
        if (comp.types.includes("administrative_area_level_1")) {
            result.state = comp.long_name;
        }
        if (comp.types.includes("country")) {
            result.country = comp.long_name;
        }
        if (comp.types.includes("postal_code")) {
            result.pincode = comp.long_name;
        }
    }
    return result;
};

/**
 * GET /api/location/search?query=kamla+nagar+agra
 * Search locations using Google Maps Geocoding API
 *
 * Note: Use + or %20 for spaces in query
 * ✅ Correct: ?query=kamla+nagar+agra
 * ❌ Wrong:  ?query=kamla&nagar&agra (& separates different query params)
 */
exports.getLocation = async (req, res) => {
    try {
        const { query, countrycode } = req.query;

        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Query is required. Use + for spaces (e.g., ?query=kamla+nagar+agra)"
            });
        }

        const country = countrycode || "in";
        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: query,
                    components: `country:${country}`,
                    key: GOOGLE_MAPS_API_KEY
                }
            }
        );

        if (response.data.status === "ZERO_RESULTS" || !response.data.results?.length) {
            return res.json({
                success: true,
                count: 0,
                data: [],
                message: "No locations found for your search"
            });
        }

        const results = response.data.results.map(item => {
            const addr = parseGoogleAddressComponents(item.address_components || []);
            return {
                placeId: item.place_id,
                displayName: item.formatted_address,
                city: addr.city,
                locality: addr.locality,
                state: addr.state,
                country: addr.country,
                pincode: addr.pincode,
                type: (item.types || [])[0] || "",
                lat: String(item.geometry.location.lat),
                lon: String(item.geometry.location.lng)
            };
        });

        res.json({
            success: true,
            count: results.length,
            data: results
        });

    } catch (error) {
        console.error("Location search error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search location",
            error: error.message
        });
    }
};

/**
 * POST /api/location/save
 * Save user's preferred location
 */
exports.saveLocation = async (req, res) => {
    try {
        const { location } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { location }, 
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Location saved successfully",
            data: user.location
        });

    } catch (error) {
        console.error("Save location error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
