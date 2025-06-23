import mongoose from 'mongoose';

export const connectDB = async () => {
  // eslint-disable-next-line no-undef
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
};
