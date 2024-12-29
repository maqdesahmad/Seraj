import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    Name: {
      type: String,
      minlength: 4,
      maxlength: 20,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "Student",
      enum: ["Student", "Supervisor", "Admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "active",
    },
    sendCode: {
      type: String,
      default: null,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College"
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.models.User || model("User", UserSchema);
export default UserModel;

