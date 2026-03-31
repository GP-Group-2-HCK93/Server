const router = require('express').Router();
const authentication = require('../middlewares/authentication');
const authRoutes = require('./auths');
const doctorRoutes = require('./doctors');
const chatRoutes = require('./chats');
const adminRoutes = require('./admin');
const ProfileController = require('../controllers/profileController');

router.use('/', authRoutes);

router.use(authentication);

router.get('/profile', ProfileController.getProfile);
router.put('/profile', ProfileController.updateProfile);

router.use('/', adminRoutes);
router.use('/', doctorRoutes);
router.use('/', chatRoutes);

module.exports = router;
