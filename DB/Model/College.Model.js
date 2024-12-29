import mongoose, { Schema, model } from "mongoose";

const collegeSchema = new Schema(
  {
    collegeName: { type: String, required: true },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
  },
  {
    timestamps: true,
  }
);

const CollegeModel = mongoose.model("College", collegeSchema);
export default CollegeModel;
