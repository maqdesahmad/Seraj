import mongoose, { Schema, model } from "mongoose";

const departmentSchema = new Schema(
  {
    departmentName: { type: String, required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  },
  {
    timestamps: true,
  }
);

const DepartmentModel = mongoose.model("Department", departmentSchema);
export default DepartmentModel;
