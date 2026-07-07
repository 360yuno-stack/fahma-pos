const User = require('../models/User');

// GET /api/users - Get all users
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/:id - Get user by ID
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/users - Create user
exports.create = async (req, res) => {
  try {
    const { username, email, password, role, firstName, lastName, phone } = req.body;

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const user = await User.create({ username, email, password, role, firstName, lastName, phone });
    const userData = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, data: userData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/users/:id - Update user
exports.update = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // If password is provided, hash it separately
    if (password) {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.password = password;
      Object.assign(user, updateData);
      await user.save();
      const userData = await User.findById(user._id).select('-password');
      return res.json({ success: true, data: userData });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/users/:id - Delete user
exports.delete = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/users/:id/toggle-active - Toggle user active status
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    const userData = await User.findById(user._id).select('-password');
    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('Error toggling user active:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
