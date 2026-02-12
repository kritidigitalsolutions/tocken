const LeadRequest = require("../models/leadRequest.model");
const User = require("../models/user.model");

/**
 * 🔹 A. USER → REQUEST DIRECT LEAD
 * POST /api/leads/request
 * Body: { leadType, dealingCities, propertyTypes, budgetRange?, requestNotes? }
 */
exports.requestLead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { leadType, dealingCities, propertyTypes, budgetRange, requestNotes } = req.body;

        // 🔹 Validation
        if (!leadType || !dealingCities || !propertyTypes) {
            return res.status(400).json({
                success: false,
                message: "Lead type, cities, and property types are required"
            });
        }

        if (!Array.isArray(dealingCities) || dealingCities.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one city is required"
            });
        }

        if (!Array.isArray(propertyTypes) || propertyTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one property type is required"
            });
        }

        // 🔹 Get user details
        const user = await User.findById(userId).populate('activePlan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 🔹 Check user role
        if (!["AGENT", "BUILDER", "INDIVIDUAL"].includes(user.userType)) {
            return res.status(403).json({
                success: false,
                message: "Only AGENT, BUILDER, or INDIVIDUAL can request leads"
            });
        }

        // 🔹 Check if user already has pending request
        const existingRequest = await LeadRequest.findOne({
            requestedBy: userId,
            status: "PENDING"
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending lead request. Please wait for admin approval."
            });
        }

        // 🔹 Create lead request entry
        const leadRequest = await LeadRequest.create({
            requestedBy: userId,
            leadType,
            dealingCities,
            propertyTypes,
            budgetRange: budgetRange || { min: 0, max: 0 },
            requestNotes,
            status: "PENDING"
        });

        console.log("✅ New lead request created:", leadRequest._id);

        res.status(201).json({
            success: true,
            message: "Lead request submitted successfully. Admin will review and assign leads soon.",
            data: {
                _id: leadRequest._id,
                leadType: leadRequest.leadType,
                dealingCities: leadRequest.dealingCities,
                propertyTypes: leadRequest.propertyTypes,
                status: leadRequest.status,
                createdAt: leadRequest.createdAt
            }
        });

    } catch (error) {
        console.error("❌ Request lead error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit lead request",
            error: error.message
        });
    }
};

/**
 * 🔹 USER → GET MY LEAD REQUESTS
 * GET /api/leads/my-requests
 */
exports.getMyLeadRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await LeadRequest.find({ requestedBy: userId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        console.error("❌ Get my lead requests error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch lead requests",
            error: error.message
        });
    }
};