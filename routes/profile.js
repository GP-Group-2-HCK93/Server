const ProfileController = require('../controllers/profileController');
const router = require('express').Router();
const multer = require("multer")

//! 1. Set multer
const upload = multer({ storage: multer.memoryStorage() });

router.get('/profile', ProfileController.getProfile);
router.put('/profile', upload.single("profilePic"), ProfileController.updateProfile);

module.exports = router;
