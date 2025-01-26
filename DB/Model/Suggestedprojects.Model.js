import mongoose, { Schema, model } from "mongoose";

const SuggestedprojectSchema = new Schema(
  {
    projectName: { type: String, required: true },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },
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
    projectIdea: { type: String, required: true },
    projectFile: { type: String },
    reservation: {
      reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      teamMembers: [
        {
          email: { type: String, required: true, unique: true ,sparse: true},
          name: { type: String, required: true },
          registrationNumber: { type: String, required: true },
        },
      ],
      approved: { type: Boolean, default: null },
    },
  },
  {
    timestamps: true,
  }
);

const SuggestedprojectModel = mongoose.models.Suggestedproject || model("Suggestedproject", SuggestedprojectSchema);
export default SuggestedprojectModel;
