const ProfileController = require('../controllers/profileController');
const router = require('express').Router();

router.get('/profile', ProfileController.getProfile);
router.put('/profile', ProfileController.updateProfile);

module.exports = router;
