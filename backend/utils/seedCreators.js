const Creator = require('../Models/Creator');

const profiles = [
  ['Aarohi Mehta', 'aarohi.mehta@example.com', 'Mumbai', 'Maharashtra', ['Travel', 'Luxury Lifestyle']],
  ['Rohan Khanna', 'rohan.khanna@example.com', 'Delhi', 'Delhi', ['Technology', 'Business']],
  ['Meera Iyer', 'meera.iyer@example.com', 'Bengaluru', 'Karnataka', ['Fashion', 'Beauty']],
  ['Karan Malhotra', 'karan.malhotra@example.com', 'Mumbai', 'Maharashtra', ['Food', 'Hospitality']],
  ['Diya Sharma', 'diya.sharma@example.com', 'Jaipur', 'Rajasthan', ['Luxury Lifestyle', 'Travel']],
  ['Arjun Rao', 'arjun.rao@example.com', 'Hyderabad', 'Telangana', ['Technology', 'Entertainment']],
  ['Sana Khan', 'sana.khan@example.com', 'Lucknow', 'Uttar Pradesh', ['Beauty', 'Wellness']],
  ['Vikram Sethi', 'vikram.sethi@example.com', 'Chandigarh', 'Chandigarh', ['Business', 'Technology']],
  ['Nisha Verma', 'nisha.verma@example.com', 'Pune', 'Maharashtra', ['Wellness', 'Fashion']],
  ['Aditya Kulkarni', 'aditya.kulkarni@example.com', 'Mumbai', 'Maharashtra', ['Travel', 'Photography']],
  ['Priya Nair', 'priya.nair@example.com', 'Kochi', 'Kerala', ['Food', 'Travel']],
  ['Kabir Singh', 'kabir.singh@example.com', 'Delhi', 'Delhi', ['Entertainment', 'Fashion']],
  ['Ananya Bose', 'ananya.bose@example.com', 'Kolkata', 'West Bengal', ['Parenting', 'Wellness']],
  ['Dev Patel', 'dev.patel@example.com', 'Ahmedabad', 'Gujarat', ['Business', 'Technology']],
  ['Ishita Kapoor', 'ishita.kapoor@example.com', 'Gurugram', 'Haryana', ['Fashion', 'Luxury Lifestyle']],
];

const application = ([fullName, email, city, state, category], index) => ({
  fullName, email, mobile: `+91 98${String(76540000 + index).padStart(8, '0')}`, city, state,
  ageGroup: [index % 3 === 0 ? '18-24' : index % 3 === 1 ? '25-34' : '35-44'],
  category, intro: `${fullName} creates practical, engaging content for a growing Indian audience.`,
  unique: 'Clear storytelling, authentic recommendations, and polished visual production.',
  igLink: `https://instagram.com/${fullName.toLowerCase().replace(/\s+/g, '.')}`,
  igFollowers: `${24 + index * 7}K`, avgReel: `${12 + index * 3}K`, avgStory: `${3 + index}K`,
  highestReel: `${110 + index * 20}K`, audLocation: `${city}, India`,
  gender: index % 2 ? 'Balanced' : 'Mostly Female', audAge: index % 3 ? '25-34' : '18-24',
  engagement: `${(3.8 + (index % 5) * 0.4).toFixed(1)}%`,
  collabTypes: ['Paid Collaborations', 'Brand Ambassadorships'], reelFee: `₹${15000 + index * 2500}`,
  storyFee: `₹${5000 + index * 500}`, retainer: `₹${45000 + index * 5000}`,
  capabilities: ['Reels', 'Stories', 'Photography'], selfEdit: 'Yes', proGear: index % 2 ? 'No' : 'Yes',
  workedBefore: 'Yes', brands: 'Sample Brand, Local Collective',
  collabLinks: 'https://instagram.com/p/sample-collaboration', openTravel: 'Yes',
  openHospitality: 'Yes', openFashion: index % 2 ? 'No' : 'Yes', gifted: 'Yes',
  consent1: true, consent2: true, consent3: true, sourceDomain: 'seed.local',
});

const seedCreators = async () => {
  const operations = profiles.map((profile, index) => {
    const creator = application(profile, index);
    return { updateOne: { filter: { email: creator.email }, update: { $setOnInsert: creator }, upsert: true } };
  });
  const result = await Creator.bulkWrite(operations);
  console.log(`Creator seed complete: ${result.upsertedCount} added, ${profiles.length - result.upsertedCount} already present`);
  return result;
};

module.exports = seedCreators;

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const connectDB = require('../config/db');
  connectDB().then(seedCreators).then(() => mongoose.disconnect()).catch((error) => {
    console.error(`Creator seed failed: ${error.message}`);
    process.exitCode = 1;
  });
}
