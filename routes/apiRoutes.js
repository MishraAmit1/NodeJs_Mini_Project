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

// API: All expenses with filtering
router.get("/", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const { category, startDate, endDate, minAmount, maxAmount } = req.query;
    let filteredExpenses = [...expenses];

    // Apply filters
    if (category) {
      filteredExpenses = filteredExpenses.filter(
        (exp) => exp.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (startDate && endDate) {
      filteredExpenses = filteredExpenses.filter(
        (exp) => exp.date >= startDate && exp.date <= endDate
      );
    }
    if (minAmount) {
      filteredExpenses = filteredExpenses.filter(
        (exp) => exp.amount >= parseFloat(minAmount)
      );
    }
    if (maxAmount) {
      filteredExpenses = filteredExpenses.filter(
        (exp) => exp.amount <= parseFloat(maxAmount)
      );
    }

    console.log("Filtered expenses for API:", filteredExpenses);
    res.status(200).json({
      message: "Expense data fetched successfully",
      expenseData: filteredExpenses,
    });
  } catch (error) {
    console.error("Error in GET / API route:", error);
    res.status(500).json({ message: "Error fetching expense data" });
  }
});

// API: Single expense
router.get("/:id", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const expense = expenses.find((exp) => exp.id === paramsId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    console.log("Fetched expense for API:", expense);
    res.status(200).json({
      message: "Expense fetched successfully",
      expenseData: expense,
    });
  } catch (error) {
    console.error("Error in GET /:id API route:", error);
    res.status(500).json({ message: "Error fetching expense data" });
  }
});

// API: Create expense
router.post("/create", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const { title, amount, category, date } = req.body;
    if (!title || !category || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
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
    console.log("Created expense for API:", expenseBody);
    res.status(201).json({
      message: "Expense created successfully",
      expense: expenseBody,
    });
  } catch (error) {
    console.error("Error in POST /create API route:", error);
    res.status(500).json({ message: "Error creating expense" });
  }
});

// API: Update expense (PUT)
router.put("/:id", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const { title, amount, category, date } = req.body;
    if (!title || !category || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const expenseIndex = expenses.findIndex((exp) => exp.id === paramsId);
    if (expenseIndex === -1) {
      return res.status(404).json({ message: "Expense not found" });
    }
    const expenseBody = {
      id: paramsId,
      title,
      amount: parseFloat(amount),
      category,
      date,
    };
    expenses.splice(expenseIndex, 1, expenseBody);
    await saveExpensedata(expenses);
    console.log("Updated expense for API:", expenseBody);
    res.status(200).json({
      message: "Expense updated successfully",
      expense: expenseBody,
    });
  } catch (error) {
    console.error("Error in PUT /:id API route:", error);
    res.status(500).json({ message: "Error updating expense" });
  }
});

// API: Update expense (PATCH)
router.patch("/:id", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const expenseIndex = expenses.findIndex((exp) => exp.id === paramsId);
    if (expenseIndex === -1) {
      return res.status(404).json({ message: "Expense not found" });
    }
    const existingExpense = expenses[expenseIndex];
    const expenseBody = { ...existingExpense, ...req.body, id: paramsId };
    expenses.splice(expenseIndex, 1, expenseBody);
    await saveExpensedata(expenses);
    console.log("Patched expense for API:", expenseBody);
    res.status(200).json({
      message: "Expense updated successfully",
      expense: expenseBody,
    });
  } catch (error) {
    console.error("Error in PATCH /:id API route:", error);
    res.status(500).json({ message: "Error updating expense" });
  }
});

// API: Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const expenses = await loadExpenseData();
    const paramsId = req.params.id;
    const expenseIndex = expenses.findIndex((exp) => exp.id === paramsId);
    if (expenseIndex === -1) {
      return res.status(404).json({ message: "Expense not found" });
    }
    expenses.splice(expenseIndex, 1);
    await saveExpensedata(expenses);
    console.log("Deleted expense for API, ID:", paramsId);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /:id API route:", error);
    res.status(500).json({ message: "Error deleting expense" });
  }
});

module.exports = router;
