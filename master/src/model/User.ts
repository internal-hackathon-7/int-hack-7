import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
    name: string;
    picture: string;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    picture: String,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
