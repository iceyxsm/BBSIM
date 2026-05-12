"""
QALGO Cryptofeed Bridge Server

Connects to crypto exchanges via cryptofeed and forwards normalized
market data to the React frontend over WebSocket.

Usage:
    pip install -r requirements.txt
    python server.py [--exchange EXCHANGE] [--port PORT]

Examples:
    python server.py --exchange binance
    python server.py --exchange coinbase --port 8765
    python server.py --exchange kraken
"""

import asyncio
import json
import argparse
from datetime import datetime
from typing import Set

import websockets
from websockets.server import WebSocketServerProtocol

from cryptofeed import FeedHandler
from cryptofeed.defines import TICKER, TRADES, L2_BOOK
from cryptofeed.exchanges import (
    Binance, Coinbase, Kraken, Bybit, OKX,
    Bitfinex, Gemini, KuCoin, Deribit
)

# Map exchange names to cryptofeed classes
EXCHANGE_MAP = {
    'binance': Binance,
    'coinbase': Coinbase,
    'kraken': Kraken,
    'bybit': Bybit,
    'okx': OKX,
    'bitfinex': Bitfinex,
    'gemini': Gemini,
    'kucoin': KuCoin,
    'deribit': Deribit,
}

# Default symbols per exchange (cryptofeed format)
DEFAULT_SYMBOLS = {
    'binance': ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT', 'XRP-USDT', 'ADA-USDT', 'AVAX-USDT', 'LINK-USDT'],
    'coinbase': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'],
    'kraken': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'],
    'bybit': ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT', 'XRP-USDT', 'ADA-USDT', 'AVAX-USDT', 'LINK-USDT'],
    'okx': ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT', 'XRP-USDT', 'ADA-USDT', 'AVAX-USDT', 'LINK-USDT'],
    'bitfinex': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'],
    'gemini': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD'],
    'kucoin': ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT', 'XRP-USDT', 'ADA-USDT'],
    'deribit': ['BTC-PERPETUAL', 'ETH-PERPETUAL'],
}

# Connected WebSocket clients
clients: Set[WebSocketServerProtocol] = set()

# Latest market data cache
market_cache: dict = {}


def normalize_symbol(symbol: str) -> str:
    """Normalize exchange symbol to display format (e.g., BTC-USDT -> BTC-USD)."""
    return symbol.replace('-USDT', '-USD').replace('-PERPETUAL', '-USD')


async def broadcast(message: dict):
    """Send message to all connected clients."""
    if not clients:
        return
    payload = json.dumps(message)
    disconnected = set()
    for client in clients:
        try:
            await client.send(payload)
        except websockets.exceptions.ConnectionClosed:
            disconnected.add(client)
    clients.difference_update(disconnected)


async def ticker_callback(ticker, receipt_timestamp):
    """Handle ticker updates from cryptofeed."""
    symbol = normalize_symbol(ticker.symbol)
    tick = {
        'type': 'tick',
        'symbol': symbol,
        'bid': float(ticker.bid) if ticker.bid else 0,
        'ask': float(ticker.ask) if ticker.ask else 0,
        'last': float(ticker.bid + ticker.ask) / 2 if ticker.bid and ticker.ask else 0,
        'volume': 0,
        'timestamp': int(receipt_timestamp * 1000),
    }
    market_cache[symbol] = tick
    await broadcast(tick)


async def trade_callback(trade, receipt_timestamp):
    """Handle trade updates from cryptofeed."""
    symbol = normalize_symbol(trade.symbol)
    existing = market_cache.get(symbol, {})
    tick = {
        'type': 'tick',
        'symbol': symbol,
        'bid': existing.get('bid', float(trade.price)),
        'ask': existing.get('ask', float(trade.price)),
        'last': float(trade.price),
        'volume': float(trade.amount),
        'timestamp': int(receipt_timestamp * 1000),
    }
    market_cache[symbol] = tick
    await broadcast(tick)


async def ws_handler(websocket: WebSocketServerProtocol):
    """Handle incoming WebSocket connections from the React frontend."""
    clients.add(websocket)
    print(f"[Bridge] Client connected ({len(clients)} total)")

    try:
        # Send current market state on connect
        for tick in market_cache.values():
            await websocket.send(json.dumps(tick))

        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get('type') == 'subscribe':
                    # Client requesting specific symbols (future use)
                    print(f"[Bridge] Client subscribed to: {data.get('symbols', [])}")
            except json.JSONDecodeError:
                pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.discard(websocket)
        print(f"[Bridge] Client disconnected ({len(clients)} total)")


def run_bridge(exchange_name: str, port: int):
    """Start the cryptofeed bridge server."""
    exchange_name = exchange_name.lower()

    if exchange_name not in EXCHANGE_MAP:
        print(f"Unknown exchange: {exchange_name}")
        print(f"Available: {', '.join(EXCHANGE_MAP.keys())}")
        return

    ExchangeClass = EXCHANGE_MAP[exchange_name]
    symbols = DEFAULT_SYMBOLS.get(exchange_name, DEFAULT_SYMBOLS['binance'])

    print(f"[Bridge] Starting QALGO Cryptofeed Bridge")
    print(f"[Bridge] Exchange: {exchange_name}")
    print(f"[Bridge] Symbols: {symbols}")
    print(f"[Bridge] WebSocket server on ws://localhost:{port}")
    print(f"[Bridge] Connect your QALGO frontend to this address")
    print()

    # Start WebSocket server for frontend clients
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    ws_server = websockets.serve(ws_handler, "localhost", port)
    loop.run_until_complete(ws_server)
    print(f"[Bridge] WebSocket server ready")

    # Start cryptofeed
    fh = FeedHandler()
    fh.add_feed(
        ExchangeClass(
            symbols=symbols,
            channels=[TICKER],
            callbacks={TICKER: ticker_callback, TRADES: trade_callback}
        )
    )

    print(f"[Bridge] Connecting to {exchange_name}...")
    fh.run(start_loop=False)
    loop.run_forever()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='QALGO Cryptofeed Bridge Server')
    parser.add_argument('--exchange', '-e', default='binance',
                        help=f"Exchange to connect to ({', '.join(EXCHANGE_MAP.keys())})")
    parser.add_argument('--port', '-p', type=int, default=8765,
                        help='WebSocket server port (default: 8765)')
    args = parser.parse_args()

    run_bridge(args.exchange, args.port)
