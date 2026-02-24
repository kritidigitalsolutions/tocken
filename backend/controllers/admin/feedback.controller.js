const Feedback = require("../../models/feedback.model");

// GET all feedbacks (Admin)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { status, feedbackType, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (feedbackType && feedbackType !== "All") filter.feedbackType = feedbackType;

    const skip = (page - 1) * limit;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .populate({
          path: "userId",
          select: "name phone",
          options: { strictPopulate: false } // Don't filter out if user doesn't exist
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      Feedback.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      feedbacks
    });
  } catch (error) {
    console.error("Admin get feedbacks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedbacks"
    });
  }
};

// GET feedback stats (Admin)
exports.getFeedbackStats = async (req, res) => {
  try {
    const [total, byStatus, byType] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Feedback.aggregate([
        { $group: { _id: "$feedbackType", count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = {};
    byStatus.forEach(s => { statusCounts[s._id] = s.count; });

    const typeCounts = {};
    byType.forEach(t => { typeCounts[t._id] = t.count; });

    res.status(200).json({
      success: true,
      stats: {
        total,
        byStatus: statusCounts,
        byType: typeCounts
      }
    });
  } catch (error) {
    console.error("Get feedback stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback stats"
    });
  }
};

// UPDATE feedback status (Admin)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      feedback
    });
  } catch (error) {
    console.error("Update feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback"
    });
  }
};

// DELETE feedback (Admin)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully"
    });
  } catch (error) {
    console.error("Delete feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete feedback"
    });
  }
};
