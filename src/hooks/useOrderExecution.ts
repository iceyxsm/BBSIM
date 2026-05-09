import { db, type Order, type Trade } from '../db';

export function useOrderExecution() {
  const submitOrder = async (
    order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'filledPrice' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = Date.now();
    const newOrder: Order = {
      ...order,
      status: 'PENDING',
      filledQuantity: 0,
      filledPrice: 0,
      createdAt: now,
      updatedAt: now,
    };

    const orderId = await db.orders.add(newOrder);

    // For market orders, execute immediately
    if (order.type === 'MARKET') {
      await executeOrder(orderId as number, order.symbol, order.side, order.quantity);
    }

    return orderId;
  };

  const executeOrder = async (
    orderId: number,
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number
  ) => {
    const market = await db.marketData.where('symbol').equals(symbol).first();
    if (!market) return;

    const execPrice = side === 'BUY' ? market.ask : market.bid;
    const now = Date.now();

    // Update order
    await db.orders.update(orderId, {
      status: 'FILLED',
      filledQuantity: quantity,
      filledPrice: execPrice,
      updatedAt: now,
    });

    // Record trade
    const trade: Trade = {
      orderId,
      symbol,
      side,
      quantity,
      price: execPrice,
      pnl: 0,
      executedAt: now,
    };

    // Update position
    const existingPos = await db.positions.where('symbol').equals(symbol).first();

    if (existingPos) {
      if (side === 'BUY') {
        const totalCost = existingPos.avgEntryPrice * existingPos.quantity + execPrice * quantity;
        const newQty = existingPos.quantity + quantity;
        await db.positions.update(existingPos.id!, {
          quantity: newQty,
          avgEntryPrice: +(totalCost / newQty).toFixed(2),
          currentPrice: execPrice,
          updatedAt: now,
        });
      } else {
        // SELL - realize P&L
        const pnl = +((execPrice - existingPos.avgEntryPrice) * quantity).toFixed(2);
        trade.pnl = pnl;
        const newQty = existingPos.quantity - quantity;

        if (newQty <= 0) {
          await db.positions.delete(existingPos.id!);
        } else {
          await db.positions.update(existingPos.id!, {
            quantity: newQty,
            realizedPnl: +(existingPos.realizedPnl + pnl).toFixed(2),
            currentPrice: execPrice,
            updatedAt: now,
          });
        }
      }
    } else if (side === 'BUY') {
      await db.positions.add({
        symbol,
        quantity,
        avgEntryPrice: execPrice,
        currentPrice: execPrice,
        unrealizedPnl: 0,
        realizedPnl: 0,
        updatedAt: now,
      });
    } else {
      // Short selling - negative position
      await db.positions.add({
        symbol,
        quantity: -quantity,
        avgEntryPrice: execPrice,
        currentPrice: execPrice,
        unrealizedPnl: 0,
        realizedPnl: 0,
        updatedAt: now,
      });
    }

    await db.trades.add(trade);
  };

  const cancelOrder = async (orderId: number) => {
    await db.orders.update(orderId, {
      status: 'CANCELLED',
      updatedAt: Date.now(),
    });
  };

  return { submitOrder, cancelOrder };
}
