const mongoose = require('mongoose');
const Plan = require('./models/plans.model');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realEstate');

const seedPlans = async () => {
  try {
    // Check if plans exist
    const existingPlans = await Plan.find();
    console.log('📋 Existing plans:', existingPlans.length);

    // Clear existing plans and create comprehensive set
    await Plan.deleteMany({});
    console.log('🗑️ Cleared existing plans');
    console.log('📝 Creating comprehensive plans for all user types...');
      
      const samplePlans = [
        // Agent Plans
        {
          userType: "AGENT",
          planName: "Agent Basic",
          tag: "Popular",
          price: 999,
          originalPrice: 1499,
          validityDays: 30,
          leadsPerMonth: 50,
          features: ["50 leads per month", "Basic support", "Property listing"],
          isActive: true,
          gstIncluded: true
        },
        {
          userType: "AGENT",
          planName: "Agent Pro",
          tag: "Best Value",
          price: 1999,
          originalPrice: 2999,
          validityDays: 30,
          leadsPerMonth: 150,
          features: ["150 leads per month", "Priority support", "Unlimited listings"],
          isActive: true,
          gstIncluded: true
        },
        // Builder Plans
        {
          userType: "BUILDER",
          planName: "Builder Standard",
          price: 2499,
          originalPrice: 3499,
          validityDays: 30,
          leadsPerMonth: 200,
          features: ["200 leads per month", "Premium support", "Unlimited listings"],
          isActive: true,
          gstIncluded: true
        },
        {
          userType: "BUILDER", 
          planName: "Builder Enterprise",
          tag: "Premium",
          price: 4999,
          originalPrice: 6999,
          validityDays: 30,
          leadsPerMonth: 0, // unlimited
          features: ["Unlimited leads", "24/7 support", "Analytics dashboard"],
          isActive: true,
          gstIncluded: true
        },
        // Individual Plans
        {
          userType: "INDIVIDUAL",
          planName: "Individual Basic",
          price: 499,
          originalPrice: 799,
          validityDays: 30,
          leadsPerMonth: 20,
          features: ["20 leads per month", "Basic support"],
          isActive: true,
          gstIncluded: true
        },
        {
          userType: "INDIVIDUAL",
          planName: "Individual Plus",
          price: 999,
          originalPrice: 1299,
          validityDays: 30,
          leadsPerMonth: 50,
          features: ["50 leads per month", "Priority support"],
          isActive: true,
          gstIncluded: true
        },
        // Seller Plans
        {
          userType: "SELLER",
          planName: "Seller Basic",
          price: 799,
          originalPrice: 1199,
          validityDays: 30,
          leadsPerMonth: 30,
          features: ["30 leads per month", "Property promotion"],
          isActive: true,
          gstIncluded: true
        },
        // Landlord Plans
        {
          userType: "LANDLORD",
          planName: "Landlord Standard",
          price: 699,
          originalPrice: 999,
          validityDays: 30,
          leadsPerMonth: 25,
          features: ["25 leads per month", "Tenant screening"],
          isActive: true,
          gstIncluded: true
        }
      ];

      await Plan.insertMany(samplePlans);
      console.log('✅ Comprehensive plans created successfully!');

    const allPlans = await Plan.find();
    console.log('📋 Total plans in database:', allPlans.length);
    allPlans.forEach(plan => {
      console.log(`- ${plan.planName} (${plan.userType}) - ₹${plan.price}`);
    });

  } catch (error) {
    console.error('❌ Error seeding plans:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

seedPlans();