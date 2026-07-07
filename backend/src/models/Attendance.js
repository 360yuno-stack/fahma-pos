const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clockInTime: { type: Date, required: true },
  clockOutTime: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  pinUsed: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
