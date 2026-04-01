const AdminController = require('../controllers/adminController');
const authentication = require('../middlewares/authentication');
const guardAdmin = require('../middlewares/authorization');
const router = require('express').Router();

router.get('/users', authentication, guardAdmin, AdminController.getUsers);
router.put('/users/:id', authentication, guardAdmin, AdminController.updateUser);
router.delete('/users/:id', authentication, guardAdmin, AdminController.deleteUser);

router.get('/doctors', authentication, guardAdmin, AdminController.getDoctors);
router.put('/doctors/:id', authentication, guardAdmin, AdminController.updateDoctor);
router.delete('/doctors/:id', authentication, guardAdmin, AdminController.deleteDoctor);

module.exports = router;
