const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
// NOTIFICATION FEATURE — Import notification service for price update emails
const { notifyWishlistOnPriceUpdate } = require('../services/notificationService');



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


const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name phone email');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get active bookings (not cancelled) for this property to find current tenants
    const activeBookings = await Booking.find({
      property: req.params.id,
      status: { $ne: 'cancelled' }
    }).populate('tenant', 'name email phone');

    // Get all reviews for this property
    const reviews = await Review.find({ property: req.params.id })
      .populate('tenant', 'name _id')
      .sort({ createdAt: -1 });

    console.log('Property reviews:', reviews);

    res.json({
      ...property.toObject(),
      tenants: activeBookings.map(booking => booking.tenant),
      reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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


const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const oldPrice = property.rent;
    const newPrice = req.body.rent;

    // Update property fields
    Object.assign(property, req.body);
    await property.save();

    // NOTIFICATION FEATURE — Send price update emails if rent changed
    if (oldPrice !== newPrice && req.body.rent) {
      const landlord = await User.findById(req.user._id);
      await notifyWishlistOnPriceUpdate(
        property._id,
        oldPrice,
        newPrice,
        { name: landlord.name, email: landlord.email, phone: landlord.phone }
      );
    }

    res.json({ message: 'Property updated', property });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


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

module.exports = { getProperties, getPropertyById, createProperty, getMyListings, deleteProperty, updateProperty };
