import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  // 🏢 Machine Master
  machineId: {
    type: String,
    unique: true,
    required: true,
    sparse: true,
    default: () => `LM-${Math.floor(100000 + Math.random() * 900000)}`
  },
  category: { type: String, default: 'Wheeled' },
  machineType: String, // Dynamic: BS IV, BS V, EV, etc.
  name: { type: String, required: true },
  model: { type: String, required: true },
  brand: { type: String, default: 'LiuGong' },
  images: { type: [String], default: () => [] }, // Array of image URLs

  // 💰 Pricing & Commission
  pricing: {
    type: {
      totalPrice: { type: Number, default: 0 },
      oemNetSaleValue: { type: Number, default: 0 },
      commissionA: { type: Number, default: 0 },
      commissionB: { type: Number, default: 0 },
      serviceCommission: { type: Number, default: 0 }
    },
    default: () => ({ totalPrice: 0, oemNetSaleValue: 0, commissionA: 0, commissionB: 0, serviceCommission: 0 })
  },

  // 🛡️ Warranty
  warranty: {
    type: {
      standardMonths: { type: Number, default: 12 },
      standardHours: { type: Number, default: 2000 },
      extendedMonths: { type: Number, default: 6 },
      extendedHours: { type: Number, default: 1600 },
      catalogUrl: { type: String, default: '' },
      manualUrl: { type: String, default: '' }
    },
    default: () => ({ standardMonths: 12, standardHours: 2000, extendedMonths: 6, extendedHours: 1600, catalogUrl: '', manualUrl: '' })
  },

  // ⚙️ Attachments
  attachments: {
    type: [{
      type: { type: String, default: 'Bucket' },
      config: { type: String, default: '' },
      capacity: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      isStandard: { type: Boolean, default: true }
    }],
    default: () => ([])
  },

  // ⚙️ 2. Model Specification
  specs: {
    type: {
      horsePower: { type: String, default: '' },
      fuelType: { type: String, default: 'Diesel' },
      cylinders: { type: String, default: '' },
      year: { type: String, default: '' },
      seating: { type: String, default: '' },
      unladenWeight: { type: String, default: '' },

      // Technical
      engineModel: { type: String, default: '' },
      ratedPowerKw: { type: String, default: '' },
      maxTorque: { type: String, default: '' },
      transmissionType: { type: String, default: '' },
      driveType: { type: String, default: '4WD' },
      hydraulicSystem: { type: String, default: '' },
      fuelTankCapacity: { type: String, default: '' },
      batteryCapacity: { type: String, default: '' } // for EV
    },
    default: () => ({ fuelType: 'Diesel', driveType: '4WD' })
  },

  // 📷 Media & Documents
  img: String,
  brochurePdf: String,
  specSheet: String,
  catalogUrl: String,
  manualUrl: String,
  documents: {
    type: [{
      name: String,
      url: String,
      docType: String // pdf, png, jpg, etc.
    }],
    default: () => []
  },

  status: { type: String, enum: ['Available', 'Assigned', 'Maintenance'], default: 'Available' }
}, { timestamps: true });

export default mongoose.model('Machine', machineSchema, 'machines');
