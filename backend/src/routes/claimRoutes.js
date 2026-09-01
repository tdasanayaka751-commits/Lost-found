const express = require('express');
const router = express.Router();
const {
  createClaim,
  getMyClaims,
  getClaimsForItem,
  getClaimById,
  updateClaim,
  updateClaimStatus,
  deleteClaim,
} = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

// All claim routes require authentication
router.use(protect);

// Create a claim
router.post('/', createClaim);

// Get current user's submitted claims
router.get('/my-claims', getMyClaims);

// Get all claims received for a specific item (reporter only)
router.get('/item/:itemId', getClaimsForItem);

// Read, update, and delete individual claim
router
  .route('/:id')
  .get(getClaimById)
  .put(updateClaim)
  .delete(deleteClaim);

// Status transition: Approve / Reject / Cancel
router.patch('/:id/status', updateClaimStatus);

module.exports = router;
