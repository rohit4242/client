#!/usr/bin/env node
/**
 * Position Monitor Cron Script for PM2
 * 
 * This script runs the position monitoring independently
 * Can be run with PM2 or as a standalone cron job
 */

import { monitorPositions } from "../lib/signal-bot/position-monitor";

async function runMonitor() {
  console.log("=".repeat(60));
  console.log(`⏰ Position Monitor Started - ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  try {
    await monitorPositions();
    console.log("✅ Monitoring completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error in monitoring:", error);
    process.exit(1);
  }
}

runMonitor();

