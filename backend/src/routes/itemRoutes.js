const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route to list items & private route to create with image upload
router
  .route('/')
  .get(getAllItems)
  .post(protect, upload.single('image'), createItem);

// Private route for items reported by the authenticated user
router.get('/user/my-items', protect, getMyItems);

// Routes for specific item by ID
router
  .route('/:id')
  .get(getItemById)
  .put(protect, upload.single('image'), updateItem)
  .delete(protect, deleteItem);

module.exports = router;
