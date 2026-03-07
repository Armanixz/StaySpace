const Property = require('../models/Property');

/**
 * Arman
 * propertyController — handles all CRUD operations for property listings.
 *   getProperties  : public, returns all listings; supports ?search= query (name/location/address/type)
 *   createProperty : landlord-only, creates a new listing tied to req.user._id
 *   getMyListings  : landlord-only, returns only the logged-in landlord's own listings
 *   deleteProperty : landlord-only, deletes a listing after verifying ownership
 */
// @desc    Get all properties (with optional search)
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: regex },
          { location: regex },
          { address: regex },
          { type: regex },
        ],
      };
    }
    const properties = await Property.find(query)
      .populate('landlord', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a property listing
// @route   POST /api/properties
// @access  Landlord
const createProperty = async (req, res) => {
  const { name, address, type, rent, location, images } = req.body;

  if (!name || !address || !type || !rent || !location) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  const validTypes = ['Room', 'Flat', 'Studio', 'House', 'Other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid property type' });
  }

  try {
    const property = await Property.create({
      name,
      address,
      type,
      rent: Number(rent),
      location,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      landlord: req.user._id,
    });
    const populated = await property.populate('landlord', 'name phone email');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in landlord's own listings
// @route   GET /api/properties/my
// @access  Landlord
const getMyListings = async (req, res) => {
  try {
    const properties = await Property.find({ landlord: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a property (own listings only)
// @route   DELETE /api/properties/:id
// @access  Landlord
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await property.deleteOne();
    res.json({ message: 'Property removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProperties, createProperty, getMyListings, deleteProperty };
