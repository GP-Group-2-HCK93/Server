const router = require('express').Router();
const authentication = require('../middlewares/authentication');
const authRoutes = require('./auths');
const chatRoutes = require('./chats');
const aiRoutes = require('./ai');
const doctorRoutes = require('./doctors');
const adminRoutes = require('./admin');
const ProfileController = require('../controllers/profileController');

router.use('/', authRoutes);

router.use(authentication);
router.use('/chats', chatRoutes);
router.use('/ai', aiRoutes);

router.use('/doctors', doctorRoutes);

router.get('/profile', ProfileController.getProfile);
router.put('/profile', ProfileController.updateProfile);

router.use('/', adminRoutes);
router.use('/', doctorRoutes);
router.use('/', chatRoutes);

module.exports = router;
