const Project   = require("../models/project.model");
const Developer = require("../models/developer.model");
const { uploadToFirebase, deleteFromFirebase } = require("../utils/firebaseUpload");

// ─────────────────────────────────────────────────────────────
// Helper – find developer linked to logged-in user (for auth checks)
// ─────────────────────────────────────────────────────────────
async function getDeveloperForUser(userId) {
  return (await Developer.findOne({ userId })) || null;
}

// ─────────────────────────────────────────────────────────────
// Helper – extract developer fields from request body
// ─────────────────────────────────────────────────────────────
const DEV_FIELDS = [
  "nameOfBusiness", "nameOfAuthorisedPerson", "designation",
  "businessPAN", "email", "mobileNo",
  "websiteLink", "reraNo", "gstNo", "developerProfileDescription"
];

function pickDevFields(body) {
  const result = {};
  DEV_FIELDS.forEach(f => { if (body[f] !== undefined) result[f] = body[f]; });
  return result;
}

// ─────────────────────────────────────────────────────────────
// Helper – extract body from multipart or regular JSON request
//   In multipart/form-data send all JSON data as a single field: data="{...}"
//   Files are sent separately as: mainImage | gallery[] | brochure | floorPlan
//   Falls back to req.body directly for pure JSON (application/json) requests
// ─────────────────────────────────────────────────────────────
function getBody(req) {
  if (req.body?.data && typeof req.body.data === "string") {
    try { return JSON.parse(req.body.data); } catch (e) {}
  }
  return req.body || {};
}

// ─────────────────────────────────────────────────────────────
// Helper – upload all files attached to the project
//   Handles: mainImage, gallery[], brochure, floorPlan (+ configType in body)
// ─────────────────────────────────────────────────────────────
async function processProjectFiles(files, project, configType) {
  for (const file of (files || [])) {
    const fn = file.fieldname;

    // if (fn === "mainImage") {
    //   if (project.mainImageFileName) {
    //     try { await deleteFromFirebase(project.mainImageFileName); } catch (e) {}
    //   }
    //   const u = await uploadToFirebase(file, "projects/main");
    //   if (project.uploadImage.length > 0) project.uploadImage[0] = u.url;
    //   else project.uploadImage.push(u.url);
    //   project.mainImageFileName = u.fileName;

    // } else if (fn === "gallery") {
    if (fn === "gallery") {
      if ((project.otherImages || []).length < 20) {
        const u = await uploadToFirebase(file, "projects/gallery");
        project.otherImages.push(u.url);
      }

    } else if (fn === "brochure") {
      const u = await uploadToFirebase(file, "projects/brochures");
      project.eBrochure = u.url;

    } else if (fn === "floorPlan" || fn.startsWith("floorPlan_")) {
      // Field name formats accepted:
      //   floorPlan_2BHK          → configType = "2BHK"
      //   floorPlan_3BHK%20Duplex → configType = "3BHK Duplex"  (URL-encoded)
      //   floorPlan               → falls back to configType argument
      let ct = fn.startsWith("floorPlan_")
        ? decodeURIComponent(fn.slice("floorPlan_".length))
        : (configType ? decodeURIComponent(configType) : null);
      if (ct) {
        const item = (project.projectConfiguration || []).find(c => c.type === ct);
        if (item) {
          const u = await uploadToFirebase(file, "projects/floor-plans");
          item.details = item.details || {};
          item.details.floorPlanFile = u.url;
          project.markModified("projectConfiguration");
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 1  Create Project  (saved as PENDING)
//    Supports multipart/form-data OR application/json
//    multipart: send field  data="{...full JSON...}"  + file fields
//    json:      send raw JSON body (no files)
// ─────────────────────────────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const body = getBody(req);
    const {
      nameOfProject, noOfFloor, noOfTower, projectStatus, projectType,
      projectConfiguration, projectFeature, productSpecification,
      amenities, connectivity, projectLocation,
      description, launchDate, possessionDate
    } = body;

    // ── Validate project required fields ──
    if (!nameOfProject)
      return res.status(400).json({ success: false, message: "nameOfProject is required" });
    if (!projectLocation?.fullAddress)
      return res.status(400).json({ success: false, message: "projectLocation.fullAddress is required" });

    // ── Upsert developer from inline body fields ──
    const devData = pickDevFields(body);
    const existingDev = await Developer.findOne({ userId: req.user.id });

    // First-time: mandatory developer fields required
    if (!existingDev) {
      const missing = ["nameOfBusiness", "businessPAN", "email", "mobileNo"]
        .filter(f => !devData[f]);
      if (missing.length)
        return res.status(400).json({
          success: false,
          message: `Developer info required for your first project. Missing: ${missing.join(", ")}`
        });
    }

    const developer = await Developer.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { userId: req.user.id, ...devData } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Create project base ──
    const project = new Project({
      developer: developer._id,
      nameOfProject,
      noOfFloor,
      noOfTower,
      projectStatus,
      projectType:          projectType          || [],
      projectConfiguration: projectConfiguration || [],
      projectFeature:       projectFeature       || [],
      productSpecification: productSpecification || [],
      amenities:            amenities            || [],
      connectivity:         connectivity         || [],
      projectLocation:      projectLocation      || {},
      description,
      launchDate,
      possessionDate,
      adminStatus: "PENDING"
    });

    // ── Process attached files (multipart only) ──
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length > 0) await processProjectFiles(files, project, body.configType);

    await project.save();

    res.status(201).json({
      success: true,
      message: "Project submitted. Pending admin approval.",
      data: { projectId: project._id, developerId: developer._id }
    });
  } catch (error) {
    console.error("ERROR CREATING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to create project", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2  Update Project  (only PENDING)
//    Supports multipart/form-data OR application/json
//    multipart: send field  data="{...}"  + optional file fields
//    json:      send raw JSON body (no files)
// ─────────────────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(403).json({ success: false, message: "Developer profile not found." });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.developer.toString() !== developer._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (project.adminStatus !== "PENDING")
      return res.status(400).json({ success: false, message: "Only PENDING projects can be edited. Contact admin." });

    const body = getBody(req);

    // ── Update developer fields if provided ──
    const devData = pickDevFields(body);
    if (Object.keys(devData).length > 0) {
      await Developer.findOneAndUpdate({ userId: req.user.id }, { $set: devData });
    }

    // ── Update project data fields ──
    const editable = [
      "nameOfProject", "noOfFloor", "noOfTower", "projectStatus", "projectType",
      "projectConfiguration", "projectFeature", "productSpecification",
      "amenities", "connectivity", "projectLocation", "description",
      "launchDate", "possessionDate"
    ];
    editable.forEach(f => { if (body[f] !== undefined) project[f] = body[f]; });

    // ── Process attached files (multipart only) ──
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length > 0) await processProjectFiles(files, project, body.configType);

    await project.save();
    res.json({ success: true, message: "Project updated", data: project });
  } catch (error) {
    console.error("ERROR UPDATING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to update project", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3  Delete Gallery Image  (from otherImages by index)
// ─────────────────────────────────────────────────────────────
exports.deleteGalleryImage = async (req, res) => {
  try {
    const developer = await getDeveloperForUser(req.user.id);
    if (!developer)
      return res.status(403).json({ success: false, message: "Developer profile not found." });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.developer.toString() !== developer._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const idx = parseInt(req.params.index);
    if (isNaN(idx) || idx < 0 || idx >= project.otherImages.length)
      return res.status(404).json({ success: false, message: "Image index not found" });

    project.otherImages.splice(idx, 1);
    await project.save();

    res.json({ success: true, message: "Image removed", data: { otherImages: project.otherImages } });
  } catch (error) {
    console.error("ERROR DELETING GALLERY IMAGE:", error);
    res.status(500).json({ success: false, message: "Failed to delete image", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 4  Unified Upload  — PATCH /:id/uploads
//     Single endpoint for ALL project file uploads.
//     Send any combination of fields:
//       mainImage  → replaces cover image
//       gallery    → appends to gallery (multiple files ok)
//       brochure   → replaces eBrochure PDF
//       floorPlan  → requires body field: configType
// ─────────────────────────────────────────────────────────────
exports.handleProjectUploads = async (req, res) => {
  try {
    const developer = await getDeveloperForUser(req.user.id);
    if (!developer)
      return res.status(403).json({ success: false, message: "Developer profile not found." });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.developer.toString() !== developer._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0)
      return res.status(400).json({ success: false, message: "No files uploaded" });

    const results = {};

    for (const file of files) {
      const fn = file.fieldname;

      // ── Cover / Main Image ──
      // if (fn === "mainImage") {
      //   if (project.mainImageFileName) {
      //     try { await deleteFromFirebase(project.mainImageFileName); } catch (e) { /* ignore */ }
      //   }
      //   const uploaded = await uploadToFirebase(file, "projects/main");
      //   if (project.uploadImage.length > 0) project.uploadImage[0] = uploaded.url;
      //   else project.uploadImage.push(uploaded.url);
      //   // project.mainImageFileName = uploaded.fileName;
      //   // results.mainImage = uploaded.url;
      // }

      // ── Gallery Images ──
      if (fn === "gallery") {
        const MAX = 20;
        if ((project.otherImages || []).length >= MAX)
          return res.status(400).json({ success: false, message: `Max ${MAX} gallery images reached` });
        const uploaded = await uploadToFirebase(file, "projects/gallery");
        project.otherImages.push(uploaded.url);
        results.gallery = results.gallery || [];
        results.gallery.push(uploaded.url);
      }

      // ── eBrochure PDF ──
      else if (fn === "brochure") {
        const uploaded = await uploadToFirebase(file, "projects/brochures");
        project.eBrochure = uploaded.url;
        results.brochure = uploaded.url;
      }

      // ── Floor Plan ──
      // Accepted field name formats:
      //   floorPlan_2BHK          → configType = "2BHK"
      //   floorPlan_3BHK%20Duplex → configType = "3BHK Duplex"  (URL-encoded spaces)
      //   floorPlan               → reads configType from body text field (fallback)
      else if (fn === "floorPlan" || fn.startsWith("floorPlan_")) {
        let configType;
        if (fn.startsWith("floorPlan_")) {
          configType = decodeURIComponent(fn.slice("floorPlan_".length));
        } else {
          const parsedBody = getBody(req);
          const rawCT = req.body?.configType || parsedBody?.configType;
          if (!rawCT) {
            results.warnings = results.warnings || [];
            results.warnings.push("floorPlan skipped: use field name 'floorPlan_2BHK' (replace 2BHK with your config type)");
            continue;
          }
          configType = decodeURIComponent(rawCT);
        }

        const item = project.projectConfiguration.find(c => c.type === configType);
        if (!item) {
          results.warnings = results.warnings || [];
          results.warnings.push(`floorPlan skipped: configuration type "${configType}" not found in this project`);
          continue;
        }

        const uploaded = await uploadToFirebase(file, "projects/floor-plans");
        item.details = item.details || {};
        item.details.floorPlanFile = uploaded.url;
        project.markModified("projectConfiguration");
        results.floorPlan = results.floorPlan || {};
        results.floorPlan[configType] = uploaded.url;
      }

      // ── Unknown field ──
      else {
        results.skipped = results.skipped || [];
        results.skipped.push(fn);
      }
    }

    await project.save();
    res.json({ success: true, message: "Uploads processed", data: results });
  } catch (error) {
    console.error("ERROR IN PROJECT UPLOADS:", error);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 7  Get My Projects  (by logged-in developer)
// ─────────────────────────────────────────────────────────────
exports.getMyProjects = async (req, res) => {
  try {
    const developer = await getDeveloperForUser(req.user.id);
    if (!developer) return res.json({ success: true, data: { projects: [], pagination: {} } });

    const { page = 1, limit = 20, adminStatus } = req.query;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = { developer: developer._id };
    if (adminStatus && adminStatus !== "all") filter.adminStatus = adminStatus.toUpperCase();

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("developer", "-__v")
        .select("-__v"),
      Project.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    console.error("ERROR FETCHING MY PROJECTS:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 8  Get Single Project by ID  (public – ACTIVE only)
// ─────────────────────────────────────────────────────────────
exports.getProjectById = async (req, res) => {
  try {
    // Public: only ACTIVE projects
    // But if the requester is the owner, allow PENDING/REJECTED too
    let project = await Project.findOne({ _id: req.params.id, adminStatus: "ACTIVE" })
      .populate("developer", "nameOfBusiness nameOfAuthorisedPerson logo mobileNo email websiteLink reraNo developerProfileDescription isApproved");

    // If not found as ACTIVE, check if owner is requesting their own project
    if (!project) {
      // Try without status filter (owner/any status)
      const anyProject = await Project.findById(req.params.id)
        .populate("developer", "nameOfBusiness nameOfAuthorisedPerson logo mobileNo email websiteLink reraNo developerProfileDescription isApproved");

      if (!anyProject)
        return res.status(404).json({ success: false, message: "Project not found" });

      // Only the developer who owns it can see non-ACTIVE projects
      const developer = await getDeveloperForUser(req.user?.id);
      if (!developer || anyProject.developer?._id?.toString() !== developer._id.toString())
        return res.status(404).json({ success: false, message: "Project not found" });

      project = anyProject;
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("ERROR FETCHING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to fetch project", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 9  Get All Active Projects  (public listing with filters)
// ─────────────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, city, projectType, projectStatus, isFeatured, search } = req.query;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = { adminStatus: "ACTIVE" };

    if (city)          filter["projectLocation.city"] = { $regex: city, $options: "i" };
    if (projectType)   filter.projectType             = { $in: [projectType] };
    if (projectStatus) filter.projectStatus           = projectStatus;
    if (isFeatured === "true") filter.isFeatured = true;
    if (search)        filter.$text = { $search: search };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip).limit(parseInt(limit))
        .populate("developer", "-__v")
        .select("-__v"),
      Project.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: { projects, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    console.error("ERROR FETCHING PROJECTS:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 10  Delete Project  (only PENDING by owner)
// ─────────────────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const developer = await getDeveloperForUser(req.user.id);
    if (!developer)
      return res.status(403).json({ success: false, message: "Developer profile not found." });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (project.developer.toString() !== developer._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (project.adminStatus !== "PENDING")
      return res.status(400).json({ success: false, message: "Only PENDING projects can be deleted. Contact admin." });

    // if (project.mainImageFileName) {
    //   try { await deleteFromFirebase(project.mainImageFileName); } catch (e) { /* ignore */ }
    // }

    await project.deleteOne();
    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("ERROR DELETING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to delete project", error: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════
//  DEVELOPER PROFILE  (all under /api/projects/developer/me)
// ═══════════════════════════════════════════════════════════════════

// D1  Get My Developer Profile
exports.getMyDeveloperProfile = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id }).select("-__v");
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });
    res.json({ success: true, data: developer });
  } catch (error) {
    console.error("ERROR FETCHING DEVELOPER PROFILE:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile", error: error.message });
  }
};

// D2  Update My Developer Profile
exports.updateMyDeveloperProfile = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });

    const editable = [
      "nameOfBusiness", "nameOfAuthorisedPerson", "designation",
      "businessPAN", "websiteLink", "email", "mobileNo",
      "reraNo", "gstNo", "developerProfileDescription"
    ];
    editable.forEach(f => { if (req.body[f] !== undefined) developer[f] = req.body[f]; });
    await developer.save();

    res.json({ success: true, message: "Profile updated", data: developer });
  } catch (error) {
    console.error("ERROR UPDATING DEVELOPER PROFILE:", error);
    res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
  }
};

// D3  Upload Developer Files — single PATCH endpoint
//   PATCH /api/projects/developer/me/uploads
//   Accepted file fields (all optional, send only what you need):
//     logo            → developer logo image
//     panDocument     → PAN card image or PDF
//     reraCertificate → RERA certificate image or PDF
//     gstCertificate  → GST certificate image or PDF
exports.uploadDeveloperFiles = async (req, res) => {
  try {
    const developer = await Developer.findOne({ userId: req.user.id });
    if (!developer)
      return res.status(404).json({ success: false, message: "Developer profile not found." });

    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0)
      return res.status(400).json({ success: false, message: "No files uploaded" });

    const results = {};

    for (const file of files) {
      const fn = file.fieldname;

      if (fn === "logo") {
        const u = await uploadToFirebase(file, "developers/logos");
        developer.logo = u.url;
        results.logo = u.url;

      } else if (fn === "panDocument") {
        const u = await uploadToFirebase(file, "developers/pan");
        developer.businessPANUpload = u.url;
        results.businessPANUpload = u.url;

      } else if (fn === "reraCertificate") {
        const u = await uploadToFirebase(file, "developers/rera");
        developer.reraCertificateUpload = u.url;
        results.reraCertificateUpload = u.url;

      } else if (fn === "gstCertificate") {
        const u = await uploadToFirebase(file, "developers/gst");
        developer.gstCertificateUpload = u.url;
        results.gstCertificateUpload = u.url;
      }
    }

    await developer.save();
    res.json({ success: true, message: "Developer files uploaded", data: results });
  } catch (error) {
    console.error("ERROR UPLOADING DEVELOPER FILES:", error);
    res.status(500).json({ success: false, message: "Failed to upload files", error: error.message });
  }
};
