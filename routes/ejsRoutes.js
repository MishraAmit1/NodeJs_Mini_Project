const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const router = express.Router();
const filePath = path.join(__dirname, "../data", "expense.json");

const loadExpenseData = async () => {
  try {
    const rawData = await fs.readFile(filePath, "utf-8");
    if (!rawData.trim()) {
      console.log("File is empty, returning empty array");
      return [];
    }
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("File does not exist, creating empty expense.json");
      await saveExpensedata([]);
      return [];
    }
    console.error("Error loading data:", error);
    throw new Error("Failed to load expense data");
  }
};

const saveExpensedata = async (exp) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(exp, null, 2));
  } catch (error) {
    console.error("Error saving data:", error);
    throw new Error("Failed to save expense data");
  }
};

// EJS: All expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    console.log("Rendering expense.ejs with expenses:", expenses);
    res.render("expense", { expenses, message: null });
  } catch (error) {
    console.error("Error in EJS / route:", error);
    res.status(500).render("error", { error: "Failed to load expenses" });
  }
});

// EJS: Create form
router.get("/create", async (req, res) => {
  console.log("Rendering expense-form.ejs");
  res.render("expense-form", { message: null });
});

// EJS: Single expense
router.get("/:id", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const expense = expenses.find((exp) => exp.id === paramsId);
    if (!expense) {
      console.log("Expense not found for ID:", paramsId);
      return res.render("error", { error: "Expense not found" });
    }
    console.log("Rendering expense-details.ejs for ID:", paramsId);
    res.render("expense-details", { expense });
  } catch (error) {
    console.error("Error in EJS /:id route:", error);
    res.status(500).render("error", { error: "Failed to load expense" });
  }
});

// EJS: Create expense
router.post("/create", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const { title, amount, category, date } = req.body;
    if (!title || !category || !amount || !date) {
      console.log("Missing fields in create expense");
      return res.render("expense-form", {
        message: { type: "error", text: "All fields are required" },
      });
    }
    const expenseBody = {
      id: String(expenses.length + 1),
      title,
      amount: parseFloat(amount),
      category,
      date,
    };
    expenses.push(expenseBody);
    await saveExpensedata(expenses);
    console.log("Created expense for EJS:", expenseBody);
    res.render("expense", {
      expenses,
      message: { type: "success", text: "Expense created successfully!" },
    });
  } catch (error) {
    console.error("Error in EJS /create route:", error);
    res.render("expense-form", {
      message: { type: "error", text: "Failed to create expense" },
    });
  }
});

// EJS: Edit form
router.get("/:id/edit", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const expense = expenses.find((exp) => exp.id === paramsId);
    if (!expense) {
      console.log("Expense not found for edit, ID:", paramsId);
      return res.render("error", { error: "Expense not found" });
    }
    console.log("Rendering expense-edit.ejs for ID:", paramsId);
    res.render("expense-edit", { expense, message: null });
  } catch (error) {
    console.error("Error in EJS /:id/edit route:", error);
    res.status(500).render("error", { error: "Failed to load expense" });
  }
});

// EJS: Update expense
router.post("/:id/update", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const { title, amount, category, date } = req.body;
    if (!title || !category || !amount || !date) {
      const expense = expenses.find((exp) => exp.id === paramsId);
      console.log("Missing fields in update expense, ID:", paramsId);
      return res.render("expense-edit", {
        expense,
        message: { type: "error", text: "All fields are required" },
      });
    }
    const expenseIndex = expenses.findIndex((exp) => exp.id === paramsId);
    if (expenseIndex === -1) {
      console.log("Expense not found for update, ID:", paramsId);
      return res.render("error", { error: "Expense not found" });
    }
    expenses[expenseIndex] = {
      id: paramsId,
      title,
      amount: parseFloat(amount),
      category,
      date,
    };
    await saveExpensedata(expenses);
    console.log("Updated expense for EJS, ID:", paramsId);
    res.render("expense", {
      expenses,
      message: { type: "success", text: "Expense updated successfully!" },
    });
  } catch (error) {
    console.error("Error in EJS /:id/update route:", error);
    res.render("expense-edit", {
      expense: req.body,
      message: { type: "error", text: "Failed to update expense" },
    });
  }
});

// EJS: Delete expense
router.post("/:id/delete", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const expenseIndex = expenses.findIndex((exp) => exp.id === paramsId);
    if (expenseIndex === -1) {
      console.log("Expense not found for delete, ID:", paramsId);
      return res.render("error", { error: "Expense not found" });
    }
    expenses.splice(expenseIndex, 1);
    await saveExpensedata(expenses);
    console.log("Deleted expense for EJS, ID:", paramsId);
    res.render("expense", {
      expenses,
      message: { type: "success", text: "Expense deleted successfully!" },
    });
  } catch (error) {
    console.error("Error in EJS /:id/delete route:", error);
    res.status(500).render("error", { error: "Failed to delete expense" });
  }
});

module.exports = router;
