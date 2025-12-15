// models/PatientAnalytics.ts
import mongoose, { Schema } from 'mongoose';

const PatientAnalyticsSchema = new Schema({
  cpf: { type: String, index: true }, 
  name: String,
  createdAt: { type: Date, default: Date.now },

  demographics: {
    birthDate: Date,
    ageAtRegistration: Number,
    gender: String,
    raceColor: String,
    city: String,
    neighborhood: String,
  },

  socioeconomic: {
    educationLevel: String,
    maritalStatus: String,
    familyIncome: String, 
    housingStatus: String,
    residentsCount: Number,
    transportType: String,
    isUfpeCommunity: String,
    ufpeLinkType: String,
  },

  triage: {
    referralSource: String, 
    priority: String,
    specialties: [String], 
    complaint: String,
    lifestyle: String,
  },
  
  system: {
    legacyPatientId: String, 
    status: { type: String, default: 'TRIAGE_COMPLETED' }
  }
});

export default mongoose.models.PatientAnalytics || mongoose.model('PatientAnalytics', PatientAnalyticsSchema);