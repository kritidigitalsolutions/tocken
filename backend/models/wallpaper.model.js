const mongoose = require("mongoose");

const wallpaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      // required: true
    },

    description: {
      type: String,
      default: ""
    },

    image: {
      type: String,
      required: true // Firebase Storage URL
    },

    fileName: {
      type: String,
      default: "" // Firebase Storage file path for deletion
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallpaper", wallpaperSchema);

