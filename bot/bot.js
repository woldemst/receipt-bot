import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import axios from "axios";

const API_URL = process.env.HOST;

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// User session to store temporary data
const userSessions = new Map();

// Start command
bot.start((ctx) => {
  ctx.reply(
    "Welcome! I'll help you track your expenses. Choose a command:\n" +
      "/new - Upload a new receipt\n" +
      "/stats - View your statistics\n" +
      "/help - Show help information"
  );
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    "Here's how to use this bot:\n\n" +
      "1. Use /new to start uploading a receipt\n" +
      "2. Select a category (Fuel, Groceries, etc.)\n" +
      "3. Send a photo of your receipt\n" +
      "4. Use /stats to view your expenses\n" +
      "5. Use /cancel to cancel current operation"
  );
});

// New receipt command
bot.command("new", (ctx) => {
  ctx.reply(
    "Please select a category:",
    Markup.inlineKeyboard([
      [Markup.button.callback("⛽ Fuel", "category_Fuel")],
      [Markup.button.callback("🛒 Groceries", "category_Groceries")],
      [Markup.button.callback("📝 Other", "category_Other")],
    ])
  );
});

// Handle category selection
bot.action(/category_(.+)/, (ctx) => {
  const category = ctx.match[1];
  userSessions.set(ctx.from.id, { category });
  ctx.reply(`Category "${category}" selected. Please send me a photo of your receipt.`);
});

// Handle photo messages
bot.on(message("photo"), async (ctx) => {
  const userId = ctx.from.id;
  const userSession = userSessions.get(userId);

  if (!userSession || !userSession.category) {
    return ctx.reply("Please select a category first using /newreceipt command.");
  }

  const photo = ctx.message.photo.pop(); // Get the highest resolution photo
  const fileId = photo.file_id;

  await ctx.reply("Photo received! Processing...");

  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const fileResp = await axios.get(fileLink.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(fileResp.data);

    const response = await axios.post(`${API_URL}/api/process-receipt`, {
      imageUrl: fileLink.href,
      userId,
      category: userSession.category,
    });

    const receipt = response.data.data;
    console.log("gotten receipt", receipt);

    // Clear user session
    userSessions.delete(userId);

    //  Ask for confirmation
    await ctx.reply(
      "✅ Save this receipt?",
      Markup.inlineKeyboard([[Markup.button.callback("💾 Save", `save_${userId}`)], [Markup.button.callback("❌ Cancel", "cancel")]])
    );
    await ctx.reply(
      `Amount: ${receipt.amount || "❌ not found"}\n` +
      `Quantity: ${receipt.quantity || "❌ not found"}\n` +
      `Fuel: ${receipt.fuel || "❌ not found"}\n` +
      `Price: ${receipt.price || "❌ not found"}\n` +
      `Date: ${
          receipt.date ? (typeof receipt.date === "string" ? receipt.date : receipt.date.toLocaleDateString("de-DE")) : "❌ not found"
        }\n` +
        Markup.inlineKeyboard([[Markup.button.callback("💾 Save", `save_${userId}`)], [Markup.button.callback("❌ Cancel", "cancel")]])
    );
    // If not valid, ask user for missing fields
    if (!receipt.isValid) {
      await ctx.reply("❗ Some required fields are missing. Please reply with the correct amount, or send a new photo.");
      // Optionally, you can add logic to handle user input for missing fields here
      return;
    }

    // If valid, show confirmation and save
    await ctx.reply(
      `✅ Receipt ready to be saved!\n\n` +
        `Category: ${userSession.category}\n` +
        `Amount: $${receipt.amount}\n` +
        `${userSession.category === "Fuel" ? `Quantity: ${receipt.quantity || "N/A"}L\n` : ""}` +
        `Date: ${
          receipt.date
            ? typeof receipt.date === "string"
              ? receipt.date
              : receipt.date.toLocaleDateString("de-DE")
            : new Date().toLocaleDateString()
        }\n` +
        `${receipt.station ? `Location: ${receipt.station}` : ""}`
    );
  } catch (error) {
    console.error("Error during photo processing:", error);
    await ctx.reply("Failed to process the photo. Please try again.\n\nError: " + error.message);
  }
});

// Stats command
bot.command("stats", async (ctx) => {
  ctx.reply(
    "Choose a time period:",
    Markup.inlineKeyboard([
      [Markup.button.callback("This Month", "stats_month"), Markup.button.callback("This Year", "stats_year")],
      [Markup.button.callback("All Time", "stats_all")],
    ])
  );
});

// Handle stats selection
bot.action(/stats_(.+)/, async (ctx) => {
  const period = ctx.match[1];
  const userId = ctx.from.id;

  try {
    // Get stats from server
    const response = await axios.get(`${API_URL}/stats/${userId}?period=${period}`);
    const stats = response.data;

    // Format response
    let totalAmount = 0;

    for (const [category, data] of Object.entries(stats)) {
      response += `${category}:\n`;
      response += `  Total: $${data.total.toFixed(2)}\n`;
      response += `  Receipts: ${data.count}\n\n`;
      totalAmount += data.total;
    }

    response += `💰 Total spending: $${totalAmount.toFixed(2)}`;
    await ctx.reply(response);
  } catch (error) {
    console.error("Error fetching stats:", error);
    await ctx.reply("Sorry, there was an error fetching your statistics.");
  }
});

// Cancel command
bot.command("cancel", (ctx) => {
  const userId = ctx.from.id;
  if (userSessions.has(userId)) {
    userSessions.delete(userId);
    ctx.reply("Current operation cancelled.");
  } else {
    ctx.reply("No active operation to cancel.");
  }
});

// Launch the bot
bot.launch().then(() => console.log("Bot is running!"));

// Graceful shutdown for the bot
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
