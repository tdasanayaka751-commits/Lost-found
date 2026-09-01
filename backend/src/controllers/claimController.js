const Claim = require('../models/Claim');
const Item = require('../models/Item');

// @desc    Submit a new claim for an item (with business logic validation)
// @route   POST /api/claims
// @access  Private
const createClaim = async (req, res, next) => {
  try {
    const { itemId, proofDetails, contactNumber } = req.body;

    // Validation
    if (!itemId || !proofDetails || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId, proofDetails, and contactNumber.',
      });
    }

    // 1. Check if target item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'The item you are attempting to claim does not exist.',
      });
    }

    // 2. Business Logic Rule 1: A user cannot claim their own reported item
    if (item.reportedBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule Violation: You cannot submit a claim for an item you reported yourself.',
      });
    }

    // 3. Business Logic Rule 2: Item must be 'Open' to accept claims
    if (item.status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: `Business Rule Violation: This item is currently marked as '${item.status}' and is not accepting new claims.`,
      });
    }

    // 4. Business Logic Rule 3: User cannot have multiple active/pending claims on the same item
    const existingActiveClaim = await Claim.findOne({
      itemId,
      claimant: req.user.id,
      status: { $in: ['Pending', 'Approved'] },
    });

    if (existingActiveClaim) {
      return res.status(400).json({
        success: false,
        message: 'Business Rule Violation: You already have an active claim submitted for this item.',
      });
    }

    // Create the claim
    const claim = await Claim.create({
      itemId,
      claimant: req.user.id,
      proofDetails,
      contactNumber,
      status: 'Pending',
    });

    const populatedClaim = await Claim.findById(claim._id)
      .populate('itemId', 'title type category location imageUrl status')
      .populate('claimant', 'name email phone studentId');

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully and is pending review by the finder/moderator.',
      data: populatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all claims submitted by the logged-in user
// @route   GET /api/claims/my-claims
// @access  Private
const getMyClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user.id })
      .populate({
        path: 'itemId',
        select: 'title type category location date imageUrl status reportedBy',
        populate: {
          path: 'reportedBy',
          select: 'name email phone',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all claims for a specific item (only for the reporter of the item or admin)
// @route   GET /api/claims/item/:itemId
// @access  Private
const getClaimsForItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // Check authorization: only the reporter of the item or an admin can inspect received claims
    if (
      item.reportedBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only view claims submitted for items you reported.',
      });
    }

    const claims = await Claim.find({ itemId })
      .populate('claimant', 'name email phone studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      item: {
        id: item._id,
        title: item.title,
        status: item.status,
      },
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single claim by ID
// @route   GET /api/claims/:id
// @access  Private
const getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('itemId')
      .populate('claimant', 'name email phone studentId');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.',
      });
    }

    // Check access: only claimant, item reporter, or admin can view
    const isClaimant = claim.claimant._id.toString() === req.user.id;
    const isReporter =
      claim.itemId.reportedBy &&
      claim.itemId.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isClaimant && !isReporter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this claim.',
      });
    }

    res.status(200).json({
      success: true,
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update claim proof or contact (only while Pending)
// @route   PUT /api/claims/:id
// @access  Private
const updateClaim = async (req, res, next) => {
  try {
    const { proofDetails, contactNumber } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.',
      });
    }

    // Only claimant can edit their own claim
    if (claim.claimant.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only edit your own claim.',
      });
    }

    // Cannot edit if already resolved
    if (claim.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit claim with status '${claim.status}'. Only pending claims can be modified.`,
      });
    }

    if (proofDetails) claim.proofDetails = proofDetails;
    if (contactNumber) claim.contactNumber = contactNumber;

    await claim.save();

    res.status(200).json({
      success: true,
      message: 'Claim updated successfully.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update claim status (Approve / Reject / Cancel) with business logic state transitions
// @route   PATCH /api/claims/:id/status
// @access  Private
const updateClaimStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Approved', 'Rejected', or 'Cancelled'.",
      });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.',
      });
    }

    const item = await Item.findById(claim.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Associated item not found.',
      });
    }

    const isReporter = item.reportedBy.toString() === req.user.id;
    const isClaimant = claim.claimant.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Authorization checks:
    // Only item reporter or admin can Approve or Reject
    // Claimant can Cancel their own claim
    if (status === 'Approved' || status === 'Rejected') {
      if (!isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the user who reported this item or an admin can approve or reject claims.',
        });
      }
    } else if (status === 'Cancelled') {
      if (!isClaimant && !isReporter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the claimant, item reporter, or an admin can cancel a claim.',
        });
      }
    }

    const previousStatus = claim.status;

    // BUSINESS LOGIC:
    // 1. APPROVING A CLAIM:
    // - Claim status becomes 'Approved'
    // - Item status flips to 'Claimed'
    // - All other pending claims for this item are automatically rejected!
    if (status === 'Approved') {
      claim.status = 'Approved';
      claim.adminNotes = adminNotes || 'Claim verified and approved by reporter.';
      claim.resolvedAt = new Date();
      await claim.save();

      // Flip item status to Claimed
      item.status = 'Claimed';
      await item.save();

      // Automatically reject all other pending claims for this item
      await Claim.updateMany(
        {
          itemId: item._id,
          _id: { $ne: claim._id },
          status: 'Pending',
        },
        {
          status: 'Rejected',
          adminNotes: 'Another claim for this item was verified and approved.',
          resolvedAt: new Date(),
        }
      );
    }
    // 2. REJECTING OR CANCELLING AN ALREADY APPROVED CLAIM:
    // - If this claim was previously Approved, flipping it to Cancelled or Rejected
    //   must release the Item back to 'Open' status!
    else if (status === 'Rejected' || status === 'Cancelled') {
      claim.status = status;
      if (adminNotes) claim.adminNotes = adminNotes;
      claim.resolvedAt = new Date();
      await claim.save();

      if (previousStatus === 'Approved') {
        // Release item back to Open if no other claim is approved
        item.status = 'Open';
        await item.save();
      }
    }

    const updatedClaim = await Claim.findById(claim._id)
      .populate('itemId', 'title type category location status')
      .populate('claimant', 'name email phone studentId');

    res.status(200).json({
      success: true,
      message: `Claim status successfully updated to '${status}'.`,
      data: updatedClaim,
      itemStatus: item.status,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / withdraw a claim
// @route   DELETE /api/claims/:id
// @access  Private
const deleteClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.',
      });
    }

    const isClaimant = claim.claimant.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isClaimant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete your own claims.',
      });
    }

    // If an approved claim is deleted, revert item status to Open
    if (claim.status === 'Approved') {
      await Item.findByIdAndUpdate(claim.itemId, { status: 'Open' });
    }

    await Claim.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Claim removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getMyClaims,
  getClaimsForItem,
  getClaimById,
  updateClaim,
  updateClaimStatus,
  deleteClaim,
};
