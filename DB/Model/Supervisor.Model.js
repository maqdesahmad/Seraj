import mongoose, { Schema } from "mongoose";

const supervisorSchema = new Schema(
  {
    supervisorName: { type: String, required: true },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    email: { type: String, required: true, unique: true },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["Supervisor"],
      required: true,
      default: "Supervisor",
    },
    password: {
      type: String,
      required: true,
    },
    sendCode: {
      type: String,
      default: null,
    },
    maxGroups: {
      type: Number,
      default: 3,
    },
    reservation: {
      teams: {
        type: [
          {
            teamName: { 
              type: String, 
              required: true, 
              unique: true, 
              sparse: true, // Allows null values while ensuring uniqueness
            },
            members: [
              {
                  email: {
                      type: String,
                      unique: true, // Unique index
                      sparse: true, // Allows multiple `null` values
                  },
                  name: { type: String, required: true },
                  registrationNumber: { type: String, required: true },
              },
          ],
            approved: { type: Boolean, default: null },
            reservedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          },
        ],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

const SupervisorModel = mongoose.model("Supervisor", supervisorSchema);
export default SupervisorModel;
