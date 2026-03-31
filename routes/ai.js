const router = require("express").Router();
const AIController = require("../controllers/aiController");

router.post("/match-date", AIController.matchDate);

module.exports = router;
