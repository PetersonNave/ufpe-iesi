// models/PatientAnamnesis.ts
import mongoose, { Schema } from 'mongoose';

const PatientAnamnesisSchema = new Schema({
  patientId: { type: String, required: true, index: true }, 
  patientName: String,


  complaint: String,      
  history: String,       
  medications: String,   
  painLevel: Number,   
  goals: String,        

  createdAt: { type: Date, default: Date.now },
  source: { type: String, default: 'REMOTE_LINK' }
}, {
  collection: 'anamneses', 
  timestamps: true
});

export default mongoose.models.PatientAnamnesis || mongoose.model('PatientAnamnesis', PatientAnamnesisSchema);