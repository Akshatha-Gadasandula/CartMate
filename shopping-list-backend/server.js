const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes); // to match your frontend's POST request URL



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Item Schema
const itemSchema = new mongoose.Schema({
  name: String,
  completed: {
    type: Boolean,
    default: false
  }
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
  createdAt: {
    type: Date,
    default: Date.now, // will apply automatically to new docs
  }
});


const List = mongoose.model("List", listSchema);

// Get all lists sorted by creation date
app.get("/lists", async (req, res) => {
  try {
    const lists = await List.find().sort({ createdAt: -1 }); // newest first
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new list
app.post("/lists", async (req, res) => {
  try {
    const newList = new List({ name: req.body.name, items: [] });
    await newList.save();
    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a list
app.delete("/lists/:listId", async (req, res) => {
  try {
    const deleted = await List.findByIdAndDelete(req.params.listId);
    if (!deleted) return res.status(404).json({ error: "List not found" });
    res.json({ message: "List deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to a list
app.post("/lists/:listId/items", async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ error: "List not found" });

    list.items.push({ name: req.body.name });
    await list.save();
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an item from a list
app.delete("/lists/:listId/items/:itemId", async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ error: "List not found" });

    list.items = list.items.filter((item) => item._id.toString() !== itemId);
    await list.save();

    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Toggle item completed
app.patch("/lists/:listId/items/:itemId/toggle", async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ error: "List not found" });

    const item = list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.completed = !item.completed;
    await list.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
