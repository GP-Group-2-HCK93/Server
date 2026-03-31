const router = require("express").Router();
const AIController = require("../controllers/aiController");

router.post("/match-date", AIController.matchDate);
router.post("/recommend-doctor", AIController.recommendDoctor);

module.exports = router;
