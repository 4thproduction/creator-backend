const mongoose = require('mongoose');

const text = { type: String, trim: true };
const choices = (values) => ({ type: String, enum: values });
const capitalizeName = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase());
};
const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], required: true },
  data: { type: Buffer, required: true, select: false },
}, { _id: false });

// Field names match creator-hub/src/components/onboarding/OnboardingForm.tsx.
const creatorSchema = new mongoose.Schema({
  // 01 Basic details
  fullName: { ...text, required: true, set: capitalizeName }, email: { ...text, required: true, lowercase: true },
  mobile: { ...text, required: true }, city: { ...text, required: true }, state: text,
  ageGroup: [{ type: String, enum: ['18-24', '25-34', '35-44', '45+'] }],
  // 02 Creator profile
  category: {
    type: [{ type: String }],
    required: true,
    validate: { validator: (values) => values.length > 0, message: 'At least one category is required' },
  },
  intro: text, unique: text,
  // 03 Platform details
  igLink: text, igFollowers: text, avgReel: text, avgStory: text, highestReel: text,
  ytLink: text, ytSubs: text, ytAvgViews: text, fbLink: text, fbFollowers: text, fbAvgViews: text,
  liLink: text, liFollowers: text, liAvgViews: text, webLink: text, otherLink: text,
  // 04 Audience details
  audLocation: text, gender: choices(['Mostly Female', 'Mostly Male', 'Balanced']),
  audAge: choices(['13-17', '18-24', '25-34', '35-44', '45+']), engagement: text,
  // 05 Collaboration preferences
  collabTypes: [String], reelFee: text, storyFee: text, ytFee: text, ugcFee: text, retainer: text,
  // 06 Content capabilities
  capabilities: [String], selfEdit: choices(['Yes', 'No']), proGear: choices(['Yes', 'No']),
  // 07 Previous collaborations
  workedBefore: choices(['Yes', 'No']), brands: text, collabLinks: text,
  // 08 Hospitality and fashion fit
  openTravel: choices(['Yes', 'No']), openHospitality: choices(['Yes', 'No']),
  openFashion: choices(['Yes', 'No']), apparelSize: choices(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  gifted: choices(['Yes', 'No']),
  // 09 Analytics uploads
  file_insights: fileSchema, file_demo: fileSchema, file_reach: fileSchema,
  // 10 Consent
  consent1: { type: Boolean, required: true }, consent2: { type: Boolean, required: true },
  consent3: { type: Boolean, required: true }, sourceDomain: text,
}, { timestamps: true });

creatorSchema.index({ createdAt: -1, _id: -1 });



module.exports = mongoose.model('Creator', creatorSchema);
