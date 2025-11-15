// src/models/FamilyUser.ts
import mongoose from 'mongoose';

const familyUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String },
  relation: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientId: { type: String }, // Will be filled after linking
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.FamilyUser || mongoose.model('FamilyUser', familyUserSchema);