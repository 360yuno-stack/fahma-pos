const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  pin: {
    type: String,
    default: '1234'
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'waiter', 'cajero', 'cocina', 'repartidor'],
    default: 'waiter'
  },
  firstName: String,
  lastName: String,
  phone: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  // Fallback si la contraseña no está encriptada con bcrypt
  if (!this.password.startsWith('$2')) {
    const matches = candidatePassword === this.password;
    if (matches) {
      this.password = candidatePassword; // Triggers pre('save') hash
      await this.save();
    }
    return matches;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
