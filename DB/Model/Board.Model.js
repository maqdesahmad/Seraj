import mongoose, { Schema, model } from "mongoose";

const BoardSchema = new Schema(
  {
    name: { type: String, required: true }, 
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Suggestedproject' }, 
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" }
  },
  { timestamps: true }
);

const BoardModel = mongoose.models.Board || model("Board", BoardSchema);
export default BoardModel;
