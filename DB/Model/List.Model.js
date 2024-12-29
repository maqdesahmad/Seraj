import mongoose, { Schema, model } from "mongoose";

const ListSchema = new Schema(
    {
      name: { type: String, required: true },
      board: { type: mongoose.Schema.Types.ObjectId, ref: "Board" }, 
    },
    { timestamps: true }
  );
  
  const ListModel = mongoose.models.List || model("List", ListSchema);
  export default ListModel;
  