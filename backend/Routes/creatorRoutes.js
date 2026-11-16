const { creatorFilters } = require('../utils/creatorFilters');
const express = require("express");
const Creator = require("../Models/Creator");
const { protect } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbacMiddleware");
const {
  createCreator,
  updateCreator,
  downloadCreatorFile,
  exportCreators,
} = require("../controller/creatorController");

const router = express.Router();
// Public intake route used by creator-hub when the applications are wired together.
router.post("/applications", createCreator);
router.use(protect);

router.post("/", checkPermission("create_creator"), createCreator);
router.put("/:id", checkPermission("update_creator"), updateCreator);

// Dashboard projection: keep contact details and uploaded file contents out of analytics responses.
router.get("/analytics", checkPermission("read_creator"), async (req, res) => {
  try {
    const creators = await Creator.find()
      .select("fullName city state ageGroup category igLink igFollowers avgReel ytLink ytSubs ytAvgViews fbLink fbFollowers liLink liFollowers audAge gender engagement collabTypes openTravel openHospitality openFashion file_insights.name file_demo.name file_reach.name createdAt updatedAt")
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    res.json({ creators });
  } catch (error) {
    res.status(500).json({ message: "Could not load creator analytics" });
  }
});

router.get("/", checkPermission("read_creator"), async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = [10, 20, 50, 100].includes(Number(req.query.limit))
      ? Number(req.query.limit)
      : 10;
    let filter;
    try { filter = creatorFilters(req.query); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const [total, creators, categories, cities] = await Promise.all([
      Creator.countDocuments(filter),
      Creator.find(filter)
        .select("-file_insights.data -file_demo.data -file_reach.data")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Creator.distinct('category'),
      Creator.distinct('city'),
    ]);
    res.json({ creators, total, page, limit, categories: categories.filter(Boolean).sort(), cities: cities.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/export/:format",
  checkPermission("export_creator"),
  exportCreators,
);

router.get(
  "/:id/files/:field",
  checkPermission("read_creator"),
  downloadCreatorFile,
);

router.get("/:id", checkPermission("read_creator"), async (req, res) => {
  try {
    const creator = await Creator.findById(req.params.id)
      .select("-file_insights.data -file_demo.data -file_reach.data")
      .lean();
    if (!creator) return res.status(404).json({ message: "Creator not found" });
    res.json(creator);
  } catch (error) {
    res.status(400).json({ message: "Invalid creator ID" });
  }
});

router.delete("/:id", checkPermission("delete_creator"), async (req, res) => {
  try {
    const creator = await Creator.findByIdAndDelete(req.params.id);
    if (!creator) return res.status(404).json({ message: "Creator not found" });
    res.json({ message: "Creator deleted" });
  } catch (error) {
    res.status(400).json({ message: "Invalid creator ID" });
  }
});

module.exports = router;
