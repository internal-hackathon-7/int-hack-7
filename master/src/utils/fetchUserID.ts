import { User } from "../model/User.ts";

export const getMemberIdByEmail = async (email: string): Promise<string | null> => {
  const user = await User.findOne({ email }).select("_id").lean();
  return user?._id?.toString() || null;
};

export const getEmailByGoogleId = async (googleId: string): Promise<string | null> => {
  const user = await User.findOne({ googleId }).select("email").lean();
  return user?.email || null;
};