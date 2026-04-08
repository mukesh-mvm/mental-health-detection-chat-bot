import mongoose from "mongoose";

const journalSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  mood: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Journal = mongoose.model("Journal", journalSchema);
export default Journal;
