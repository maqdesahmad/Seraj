import mongoose, { Schema, model } from "mongoose";

const CardSchema = new Schema(
  {
    name: { type: String, required: true }, 
    description: { type: String }, 
    list: { type: mongoose.Schema.Types.ObjectId, ref: "List" },
    comments: [
      {
        supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor"},
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    Checklist: [
      {
        description: { type: String },
        completed: { type: Boolean, default: false }, 
      },
    ],
  },
  { timestamps: true }
);

  const CardModel = mongoose.models.Card || model("Card", CardSchema);
  export default CardModel;
  
