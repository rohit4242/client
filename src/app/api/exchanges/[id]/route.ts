import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import db from "@/db";
import { auth } from "@/lib/auth";
import { updateExchangeSchema } from "@/db/schema/exchange";
import { Spot } from "@binance/spot";
import { calculateTotalUSDValue } from "@/lib/trading-utils";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET single exchange
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const exchange = await db.exchange.findFirst({
      where: {
        id,
      },
    });

    if (!exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    const configurationRestAPI = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
    };

    const totalPortfolioValue = await calculateTotalUSDValue(
      configurationRestAPI
    );

    const updatedExchange = await db.exchange.update({
      where: { id },
      data: {
        totalValue: totalPortfolioValue.toString(),
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json(updatedExchange);
  } catch (error) {
    console.error("Error fetching exchange:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange" },
      { status: 500 }
    );
  }
}

// UPDATE exchange
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validatedExchange = updateExchangeSchema.safeParse(body);

    if (!validatedExchange.success) {
      return NextResponse.json(
        { error: validatedExchange.error.message },
        { status: 400 }
      );
    }

    // Check if exchange exists and belongs to user
    const existingExchange = await db.exchange.findFirst({
      where: {
        id,
        portfolioId: session.user.id,
      },
    });

    if (!existingExchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    const updateData = validatedExchange.data;

    // If API credentials are being updated, validate them
    if (updateData.apiKey || updateData.apiSecret) {
      const apiKey = updateData.apiKey || existingExchange.apiKey;
      const apiSecret = updateData.apiSecret || existingExchange.apiSecret;

      try {
        const configurationRestAPI = {
          apiKey: apiKey,
          apiSecret: apiSecret,
        };

        const client = new Spot({ configurationRestAPI });
        const accountResponse = await client.restAPI.getAccount();

        if (!accountResponse || typeof accountResponse !== "object") {
          return NextResponse.json(
            { error: "Invalid API key or secret - Authentication failed" },
            { status: 400 }
          );
        }

        console.log("Binance API validation successful for update");
      } catch (apiError: unknown) {
        console.error("Binance API validation error during update:", apiError);

        if (apiError && typeof apiError === "object") {
          const error = apiError as {
            name?: string;
            message?: string;
            response?: { status: number; data?: { msg?: string } };
          };

          if (
            error.name === "UnauthorizedError" ||
            (error.message && error.message.includes("Invalid API-key"))
          ) {
            return NextResponse.json(
              {
                error:
                  "Invalid API key, IP address not whitelisted, or insufficient permissions",
              },
              { status: 400 }
            );
          }

          if (error.response) {
            const statusCode = error.response.status;
            const errorData = error.response.data;

            if (statusCode === 401) {
              return NextResponse.json(
                { error: "Invalid API key or secret - Unauthorized access" },
                { status: 400 }
              );
            } else if (statusCode === 403) {
              return NextResponse.json(
                { error: "API key does not have required permissions" },
                { status: 400 }
              );
            } else if (errorData && errorData.msg) {
              return NextResponse.json(
                { error: `Binance API Error: ${errorData.msg}` },
                { status: 400 }
              );
            }
          }

          if (error.message) {
            return NextResponse.json(
              { error: `API validation failed: ${error.message}` },
              { status: 400 }
            );
          }
        }

        return NextResponse.json(
          { error: "Failed to validate API credentials with Binance" },
          { status: 400 }
        );
      }
    }

    // Update the exchange
    const updatedExchange = await db.exchange.update({
      where: {
        id,
      },
      data: {
        ...updateData,
        name: updateData.name?.toUpperCase() || existingExchange.name,
      },
    });

    return NextResponse.json(updatedExchange);
  } catch (error) {
    console.error("Error updating exchange:", error);
    return NextResponse.json(
      { error: "Failed to update exchange" },
      { status: 500 }
    );
  }
}

// DELETE exchange
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if exchange exists and belongs to user
    const existingExchange = await db.exchange.findFirst({
      where: {
        id,
        portfolioId: session.user.id,
      },
    });

    if (!existingExchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    // Delete the exchange
    await db.exchange.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Exchange deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting exchange:", error);
    return NextResponse.json(
      { error: "Failed to delete exchange" },
      { status: 500 }
    );
  }
}
