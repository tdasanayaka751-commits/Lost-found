const Item = require('../models/Item');
const Claim = require('../models/Claim');
const path = require('path');
const fs = require('fs');

// Helper to construct normalized image URL
const getImageUrl = (req, filename) => {
  return `/uploads/${filename}`;
};

// @desc    Create a new lost or found item with image upload
// @route   POST /api/items
// @access  Private
const createItem = async (req, res, next) => {
  try {
    const { title, type, category, description, location, date } = req.body;

    // Validate required fields
    if (!title || !type || !category || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, type, category, description, and location.',
      });
    }

    // Check if image file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'An image of the item is required. Please upload an image file.',
      });
    }

    const imageUrl = getImageUrl(req, req.file.filename);

    const item = await Item.create({
      title,
      type,
      category,
      description,
      location,
      date: date || Date.now(),
      imageUrl,
      reportedBy: req.user.id,
      status: 'Open',
    });

    const populatedItem = await Item.findById(item._id).populate(
      'reportedBy',
      'name email phone studentId'
    );

    res.status(201).json({
      success: true,
      message: 'Item reported successfully.',
      data: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all items with optional filtering and search
// @route   GET /api/items
// @access  Public
const getAllItems = async (req, res, next) => {
  try {
    const { type, category, status, search } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    const items = await Item.find(query)
      .populate('reportedBy', 'name email phone studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      'reportedBy',
      'name email phone studentId'
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // Also count claims submitted for this item
    const claimCount = await Claim.countDocuments({ itemId: item._id });

    res.status(200).json({
      success: true,
      data: {
        ...item.toObject(),
        claimCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item details and optionally replace image
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // Ownership check: only reporter or admin can edit
    if (
      item.reportedBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only edit items you reported.',
      });
    }

    const updateFields = { ...req.body };

    // If new image uploaded, replace imageUrl and clean up old file if exists
    if (req.file) {
      if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../', item.imageUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            console.error('Failed to remove old image:', err.message);
          }
        }
      }
      updateFields.imageUrl = getImageUrl(req, req.file.filename);
    }

    item = await Item.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    }).populate('reportedBy', 'name email phone studentId');

    res.status(200).json({
      success: true,
      message: 'Item updated successfully.',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete item and its associated claims
// @route   DELETE /api/items/:id
// @access  Private
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // Ownership check
    if (
      item.reportedBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete items you reported.',
      });
    }

    // Remove uploaded image file if local
    if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', item.imageUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Failed to delete image file:', err.message);
        }
      }
    }

    // Cascade delete associated claims
    await Claim.deleteMany({ itemId: item._id });

    // Delete item
    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Item and associated claims deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get items reported by logged-in user
// @route   GET /api/items/user/my-items
// @access  Private
const getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ reportedBy: req.user.id })
      .populate('reportedBy', 'name email phone studentId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
};
