/**
 * MIGRATION SCRIPT: Copy existing ACTIVE properties to FilterProperty collection
 * 
 * Run this script ONCE after deploying the new architecture:
 * node migrate-active-properties.js
 * 
 * This will copy all properties with status = "ACTIVE" to the FilterProperty collection
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Property = require("./models/property.model");
const FilterProperty = require("./models/filterProperty.model");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

async function migrateActiveProperties() {
    try {
        console.log("\n🔄 Starting migration of ACTIVE properties to FilterProperty collection...\n");

        // Get all ACTIVE properties
        const activeProperties = await Property.find({ 
            status: "ACTIVE",
            isDeleted: false 
        }).lean();

        console.log(`📊 Found ${activeProperties.length} ACTIVE properties to migrate\n`);

        if (activeProperties.length === 0) {
            console.log("ℹ️  No ACTIVE properties found. Migration complete.");
            return;
        }

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const property of activeProperties) {
            try {
                // Check if already exists
                const existing = await FilterProperty.findOne({ 
                    originalPropertyId: property._id 
                });

                if (existing) {
                    console.log(`⏭️  SKIPPED: Property ${property._id} already in FilterProperty`);
                    skipCount++;
                    continue;
                }

                // Create in FilterProperty collection
                const filterData = {
                    originalPropertyId: property._id,
                    userId: property.userId,
                    listingType: property.listingType,
                    propertyType: property.propertyType,
                    propertyCategory: property.propertyCategory,
                    residentialDetails: property.residentialDetails,
                    commercialDetails: property.commercialDetails,
                    pgDetails: property.pgDetails,
                    coLivingDetails: property.coLivingDetails,
                    pricing: property.pricing,
                    location: property.location,
                    contact: property.contact,
                    images: property.images,
                    description: property.description,
                    listingScore: property.listingScore,
                    isPremium: property.isPremium,
                    premium: property.premium,
                    originalCreatedAt: property.createdAt,
                    approvedAt: new Date(),
                    approvedBy: null // No admin ID for migration
                };

                await FilterProperty.create(filterData);
                console.log(`✅ MIGRATED: ${property.listingType} property in ${property.location?.city || 'Unknown City'}`);
                successCount++;

            } catch (err) {
                console.error(`❌ ERROR migrating property ${property._id}:`, err.message);
                errorCount++;
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("📊 MIGRATION SUMMARY");
        console.log("=".repeat(50));
        console.log(`✅ Successfully migrated: ${successCount}`);
        console.log(`⏭️  Already existed (skipped): ${skipCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📦 Total processed: ${activeProperties.length}`);
        console.log("=".repeat(50));

        // Verify final count
        const filterCount = await FilterProperty.countDocuments();
        console.log(`\n📈 FilterProperty collection now has: ${filterCount} properties`);

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 MongoDB connection closed");
        process.exit(0);
    }
}

// Run migration
migrateActiveProperties();
