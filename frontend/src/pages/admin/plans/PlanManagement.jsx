import { useEffect, useState } from "react";
import { fetchPlans, createPlan, updatePlan, deletePlan } from "../../../api/plans";
import toast from "react-hot-toast";
import Loader from "../../../components/common/Loader";
import { useTheme } from "../../../context/ThemeContext";
import { Edit, Trash2, Plus, X } from "lucide-react";

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { isDark } = useTheme();
  const [priceError, setPriceError] = useState("");
  const [formData, setFormData] = useState({
    planName: "",
    userType: "AGENT",
    price: "",
    originalPrice: "",
    validityDays: "",
    planLimit: "",
    tag: "",
    offerEndsInDays: "",
    features: [],
    isActive: true,
    gstIncluded: true
  });
  const [featureInput, setFeatureInput] = useState("");

  const userTypes = [
    "AGENT", "SELLER", 
    "LANDLORD", "PG OWNER", "DEVELOPER", "TENANT", 
    "CO-LIVING", "PG SEEKER"
  ];
  const tags = ["Most Popular", "Best Value", "Limited Offer", ""];

  // Load plans
  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await fetchPlans();
      setPlans(res?.data?.plans || []);
    } catch (error) {
      console.error("ERROR LOADING PLANS:", error);
      toast.error("Failed to load plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Validate price relationship
  const validatePrices = (sellingPrice, originalPrice) => {
    if (sellingPrice && originalPrice) {
      const selling = parseFloat(sellingPrice);
      const original = parseFloat(originalPrice);
      
      if (selling >= original) {
        setPriceError("Selling Price must be less than Original Price");
        return false;
      }
    }
    setPriceError("");
    return true;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value
    };
    setFormData(newFormData);
    
    // Validate prices when either price field changes
    if (name === "price" || name === "originalPrice") {
      validatePrices(
        name === "price" ? value : formData.price,
        name === "originalPrice" ? value : formData.originalPrice
      );
    }
  };

  // Add feature
  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Selling Price should be less than Original Price
    if (formData.originalPrice && formData.price) {
      const sellingPrice = parseFloat(formData.price);
      const originalPrice = parseFloat(formData.originalPrice);
      
      if (sellingPrice >= originalPrice) {
        toast.error("Selling Price must be less than Original Price");
        return;
      }
    }

    try {
      if (editingId) {
        await updatePlan(editingId, formData);
        toast.success("Plan updated successfully");
      } else {
        await createPlan(formData);
        toast.success("Plan created successfully");
      }

      resetForm();
      loadPlans();
    } catch (error) {
      console.error("ERROR:", error);
      toast.error(editingId ? "Failed to update plan" : "Failed to create plan");
    }
  };

  // Edit plan
  const handleEdit = (plan) => {
    setFormData({
      planName: plan.planName,
      userType: plan.userType,
      price: plan.price,
      originalPrice: plan.originalPrice,
      validityDays: plan.validityDays,
      planLimit: plan.planLimit ?? 0,
      tag: plan.tag || "",
      offerEndsInDays: plan.offerEndsInDays,
      features: plan.features || [],
      isActive: plan.isActive,
      gstIncluded: plan.gstIncluded
    });
    setEditingId(plan._id);
    setShowForm(true);
  };

  // Delete plan
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      await deletePlan(id);
      toast.success("Plan deleted successfully");
      loadPlans();
    } catch (error) {
      console.error("ERROR:", error);
      toast.error("Failed to delete plan");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      planName: "",
      userType: "AGENT",
      price: "",
      originalPrice: "",
      validityDays: "",
      planLimit: "",
      tag: "",
      offerEndsInDays: "",
      features: [],
      isActive: true,
      gstIncluded: true
    });
    setPriceError("");
    setEditingId(null);
    setShowForm(false);
    setFeatureInput("");
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Plan Management
          </h2>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Create and manage subscription plans
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            <Plus size={18} />
            Create Plan
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className={`rounded-lg p-6 mb-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingId ? "Edit Plan" : "Create New Plan"}
            </h3>
            <button
              onClick={resetForm}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="planName"
                  value={formData.planName}
                  onChange={handleInputChange}
                  placeholder="e.g., Pro, Pro Plus"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>

              {/* User Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  User Type *
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                >
                  {userTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="999"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${priceError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
                {priceError && (
                  <p className="text-red-500 text-sm mt-1">{priceError}</p>
                )}
              </div>

              {/* Original Price */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="1999"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Validity Days */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Validity (Days) *
                </label>
                <input
                  type="number"
                  name="validityDays"
                  value={formData.validityDays}
                  onChange={handleInputChange}
                  placeholder="30"
                  min="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>

              {/* Plan Limit */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Plan Limit
                </label>
                <input
                  type="number"
                  name="planLimit"
                  value={formData.planLimit}
                  onChange={handleInputChange}
                  placeholder="50"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  Shared limit for leads received, property posts &amp; project posts. 0 = Unlimited
                </p>
              </div>

              {/* Tag */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Tag
                </label>
                <select
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  {tags.map(tag => (
                    <option key={tag} value={tag}>{tag || 'No Tag'}</option>
                  ))}
                </select>
              </div>

              {/* Offer Ends In Days */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Offer Ends In (Days)
                </label>
                <input
                  type="number"
                  name="offerEndsInDays"
                  value={formData.offerEndsInDays}
                  onChange={handleInputChange}
                  placeholder="7"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Features
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature"
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Add
                </button>
              </div>
              
              {formData.features.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-700'}`}>{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className={`text-red-500 hover:text-red-700 transition`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="gstIncluded"
                  checked={formData.gstIncluded}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>GST Included</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                {editingId ? "Update Plan" : "Create Plan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`px-6 py-2 rounded-lg font-medium transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan._id} className={`rounded-lg border p-6 relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            {plan.tag && (
              <div className="absolute -top-3 left-4">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {plan.tag}
                </span>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.planName}</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{plan.userType}</p>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>₹{plan.price}</span>
                {plan.originalPrice && (
                  <span className={`text-lg line-through ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>₹{plan.originalPrice}</span>
                )}
              </div>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {plan.validityDays} days • {plan.planLimit === 0 ? 'Unlimited' : plan.planLimit} uses
              </p>
            </div>

            {plan.features && plan.features.length > 0 && (
              <div className="mb-4">
                <ul className="space-y-1">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className={`text-sm flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      +{plan.features.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'}`}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  plan.isActive
                    ? isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                    : isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className={`text-center py-12 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No plans found</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Create your first subscription plan</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Create Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;