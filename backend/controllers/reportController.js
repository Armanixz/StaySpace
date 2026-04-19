const Report = require('../models/Report');
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

// @desc    Tenant reports a landlord
// @route   POST /api/reports/landlord/:landlordId
// @access  Private (Tenant)
const reportLandlord = async (req, res) => {
  try {
    const { propertyId, description } = req.body;
    const { landlordId } = req.params;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Please provide a report description' });
    }

    if (description.length > 1000) {
      return res.status(400).json({ message: 'Report description cannot exceed 1000 characters' });
    }

    // Verify landlord exists
    const landlord = await User.findById(landlordId);
    if (!landlord || landlord.role !== 'landlord') {
      return res.status(404).json({ message: 'Landlord not found' });
    }

    // If propertyId provided, verify it belongs to landlord
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property || property.landlord.toString() !== landlordId) {
        return res.status(400).json({ message: 'Property does not belong to this landlord' });
      }
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: landlordId,
      reportType: 'tenant-to-landlord',
      property: propertyId || null,
      description: description.trim(),
    });

    const populatedReport = await Report.findById(report._id)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('property', 'name address');

    res.status(201).json(populatedReport);
  } catch (err) {
    console.error('Error in reportLandlord:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Landlord reports a tenant
// @route   POST /api/reports/tenant/:tenantId
// @access  Private (Landlord)
const reportTenant = async (req, res) => {
  try {
    const { propertyId, description } = req.body;
    const { tenantId } = req.params;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Please provide a report description' });
    }

    if (description.length > 1000) {
      return res.status(400).json({ message: 'Report description cannot exceed 1000 characters' });
    }

    // Verify tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // If propertyId provided, verify it belongs to landlord
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property || property.landlord.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Property does not belong to you' });
      }
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: tenantId,
      reportType: 'landlord-to-tenant',
      property: propertyId || null,
      description: description.trim(),
    });

    const populatedReport = await Report.findById(report._id)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('property', 'name address');

    res.status(201).json(populatedReport);
  } catch (err) {
    console.error('Error in reportTenant:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all reports against a user (landlord reports about a tenant, or tenant reports about a landlord)
// @route   GET /api/reports/:userId
// @access  Private (Admin or relevant user)
const getReportsAboutUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const reports = await Report.find({ reportedUser: userId })
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('property', 'name address')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get reports filed by a user
// @route   GET /api/reports/by/:userId
// @access  Private
const getReportsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to view their own reports, or admin to view any
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reports = await Report.find({ reporter: userId })
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('property', 'name address')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:reportId
// @access  Private (Reporter or Admin)
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only allow reporter or admin to delete
    if (report.reporter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await Report.findByIdAndDelete(reportId);
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  reportLandlord,
  reportTenant,
  getReportsAboutUser,
  getReportsByUser,
  deleteReport,
};
