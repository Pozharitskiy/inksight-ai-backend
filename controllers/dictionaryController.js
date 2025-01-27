const mongoose = require("mongoose");
const Dictionary = require("../models/Dictionary");
const fs = require("fs");
const csv = require("csv-parser");

module.exports = {
  // 1. getAllNames (return array of all names)
  create: async (req, res) => {
    try {
      const { name, tags, description } = req.body;

      // Create a new dictionary item
      const newItem = await Dictionary.create({
        name,
        tags: tags ?? [],
        description: description ?? "",
      });

      res.json({
        message: "Dictionary item created successfully.",
        data: newItem,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while creating the dictionary item.",
      });
    }
  },
  getAllNames: async (req, res) => {
    try {
      // Projection: { name: 1, _id: 0 } will only return 'name' field in the result
      const items = await Dictionary.find({}, { name: 1, _id: 0 }).lean();
      const allNames = items.map((item) => item.name);

      res.json({ names: allNames, count: allNames.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while fetching all dictionary names.",
      });
    }
  },

  getAll: async (req, res) => {
    try {
      // Projection: { name: 1, _id: 0 } will only return 'name' field in the result
      const items = await Dictionary.find({});

      res.json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while fetching all dictionary names.",
      });
    }
  },

  // 2. getItem (return item by name)
  getItem: async (req, res) => {
    try {
      const { name } = req.params; // or you can get from query if you want

      // Find a single dictionary item by name
      const item = await Dictionary.findOne({ name }).lean();

      if (!item) {
        return res.status(404).json({ error: "Dictionary item not found." });
      }

      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while fetching the dictionary item.",
      });
    }
  },

  getItemById: async (req, res) => {
    try {
      const { id } = req.params; // or you can get from query if you want

      // Find a single dictionary item by name
      console.log("id", id);
      const all = await Dictionary.find({});
      const item = await all.find((item) => item._id == id);

      if (!item) {
        return res.status(404).json({ error: "Dictionary item not found." });
      }

      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while fetching the dictionary item.",
      });
    }
  },

  // 3. delete (remove item by name)
  deleteItem: async (req, res) => {
    try {
      const { id } = req.params;

      console.log("params", req.params);

      const all = await Dictionary.find({});
      const item = await all.find((item) => item._id == id);

      console.log("Item with id", id, item);

      if (!item) {
        return res.status(404).json({ error: "Dictionary item not found." });
      }

      await Dictionary.deleteOne({ _id: id });

      res.json({ message: "Dictionary item deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while deleting the dictionary item.",
      });
    }
  },

  // 4. update (update item by name)
  updateItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, tags, description } = req.body;

      // Option 1: Using findByIdAndUpdate
      const updatedItem = await Dictionary.findByIdAndUpdate(
        id,
        {
          $set: {
            name: name ?? "",
            tags: tags ?? [],
            description: description ?? "",
          },
        },
        { new: true } // Return the modified document rather than the original
      );

      // Option 2: Using findOneAndUpdate explicitly with { _id: id }
      // const updatedItem = await Dictionary.findOneAndUpdate(
      //   { _id: id },
      //   {
      //     $set: {
      //       tags: tags ?? [],
      //       description: description ?? "",
      //     },
      //   },
      //   { new: true }
      // );

      if (!updatedItem) {
        return res.status(404).json({ error: "Dictionary item not found." });
      }

      res.json({
        message: "Dictionary item updated successfully.",
        data: updatedItem,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "An error occurred while updating the dictionary item.",
      });
    }
  },
  importBulk: async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required." });
      }

      const filePath = req.file.path;
      const entries = [];

      // Read and parse the CSV file
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          // Example row object structure:
          // {
          //   name: "some name",
          //   tags: "tag1;tag2;tag3",
          //   description: "some description"
          // }

          // Convert tags from a string to an array if needed
          // e.g., if the CSV has tags separated by semicolons:
          let tagsArray = [];
          if (row.tags) {
            tagsArray = row.tags.split(";").map((tag) => tag.trim());
          }

          // Push a new entry object
          entries.push({
            name: row.name?.trim(),
            tags: tagsArray,
            description: row.description || "",
          });
        })
        .on("end", async () => {
          try {
            // Option A: Insert all without checking duplicates
            // await Dictionary.insertMany(entries);

            // Option B: "Upsert" each row to update if name exists, else create new
            // (This is more robust if you don't want duplicates.)
            for (const item of entries) {
              // Skip empty or invalid entries
              if (!item.name) continue;

              await Dictionary.findOneAndUpdate(
                { name: item.name },
                { $set: { tags: item.tags, description: item.description } },
                { upsert: true, new: true } // upsert = create if not found
              );
            }

            // Cleanup: Remove the uploaded file from the server if desired
            fs.unlink(filePath, (err) => {
              if (err) console.error("Error deleting uploaded CSV file:", err);
            });

            res.json({
              message: "CSV import completed successfully.",
              totalRows: entries.length,
            });
          } catch (dbError) {
            console.error(dbError);
            res.status(500).json({
              error: "An error occurred while importing the CSV data.",
            });
          }
        })
        .on("error", (err) => {
          console.error("Error reading CSV file:", err);
          res.status(500).json({ error: "Error processing CSV file." });
        });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred during the CSV import process." });
    }
  },
};
