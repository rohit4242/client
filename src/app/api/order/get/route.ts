import { createOrderDataSchema } from "@/db/schema/order";
import { auth } from "@/lib/auth";
import { Spot } from "@binance/spot";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";

export async function POST(request: NextRequest) {
  try {

    console.log("===================================================")
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedOrder = createOrderDataSchema.safeParse(body);
    if (!validatedOrder.success) {
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: validatedOrder.error,
        },
        { status: 400 }
      );
    }

    const { exchange } = validatedOrder.data;

    console.log("exchange: ", exchange);
    // Get user account
    const userAccount = await db.userAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // Configure Binance client
    const configurationRestAPI = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
    };

    const client = new Spot({
      configurationRestAPI,
    });

    const response = await client.restAPI.allOrderList();

    const data = await response.data();

    console.log("data: ", data);

    return NextResponse.json({
      success: true,
      message: "Order successfully fetched",
      data: data,
    });
  } catch (error: unknown) {
    console.error("Error fetching orders:", error);

    // Handle Binance API errors
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      const binanceError = (
        error.response as { data: { msg?: string; code?: number } }
      ).data;
      return NextResponse.json(
        {
          error: "Order fetching failed",
          message: binanceError.msg || "Unknown Binance error",
          code: binanceError.code,
        },
        { status: 400 }
      );
    }

    // Handle network or other errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
