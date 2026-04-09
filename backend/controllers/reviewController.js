const Review = require('../models/Review');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

const createReview = async (req, res) => {
  const { propertyId, rating } = req.body;

  if (!propertyId || !rating) {
    return res.status(400).json({ message: 'Please provide property and rating' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if tenant has booked this property AND the booking is confirmed
    const booking = await Booking.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: 'confirmed' // Only confirmed bookings can rate
    });

    if (!booking) {
      return res.status(403).json({ message: 'You can only rate properties with confirmed bookings' });
    }

    // Check if tenant has already rated this landlord for this property
    const existingReview = await Review.findOne({
      property: propertyId,
      tenant: req.user._id,
    });

    if (existingReview) {
      // Update existing rating instead of creating new one
      existingReview.rating = Number(rating);
      await existingReview.save();
      const populated = await Review.findById(existingReview._id).populate('tenant', 'name');
      
      // Update property's average rating and total reviews
      await updatePropertyRating(propertyId);
      
      console.log('Rating updated:', populated);
      return res.status(200).json(populated);
    }

    // Create the rating
    const review = await Review.create({
      property: propertyId,
      landlord: property.landlord,
      tenant: req.user._id,
      rating: Number(rating),
    });

    // Populate tenant info
    const populated = await Review.findById(review._id).populate('tenant', 'name');

    // Update property's average rating and total reviews
    await updatePropertyRating(propertyId);

    console.log('New rating created:', populated);
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all ratings for a property
// @route   GET /api/reviews/:propertyId
// @access  Public
const getPropertyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('tenant', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (review.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this rating' });
    }

    const propertyId = review.property;
    await review.deleteOne();

    // Update property's average rating and total reviews
    await updatePropertyRating(propertyId);

    res.json({ message: 'Rating removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update property rating stats
const updatePropertyRating = async (propertyId) => {
  try {
    const reviews = await Review.find({ property: propertyId });
    
    if (reviews.length === 0) {
      await Property.findByIdAndUpdate(propertyId, {
        averageRating: 0,
        totalReviews: 0,
      });
    } else {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / reviews.length;
      
      await Property.findByIdAndUpdate(propertyId, {
        averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        totalReviews: reviews.length,
      });
    }
  } catch (err) {
    console.error('Error updating property rating:', err);
  }
};

module.exports = { createReview, getPropertyReviews, deleteReview };
