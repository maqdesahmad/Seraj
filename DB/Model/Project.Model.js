import mongoose, { Schema, model } from "mongoose";

const projectSchema = new Schema(
  {
    projectName: { type: String, required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor", required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    projectIdea: { type: String, required: true },
    projectFile: { type: String },
  },
  {
    timestamps: true,
  }
);

const ProjectModel = mongoose.model("Project", projectSchema);
export default ProjectModel;
