# Market overview tool — 2026-11-06

Problem: the terminal loaded batch market quotes, but the Agent only knew
single-symbol quotes, Ethereum balances, driver analysis and strategy backtests.
A request such as 今天的市场行情概况 could therefore be refused despite a populated
market panel.

Added get_market_overview with optional global/us/hk/cn/jp scope. It reuses
loadQuotes and its cache/allowlist, returns compact quotes without sparkline
arrays, preserves per-instrument timestamps/session state, reports missing
symbols, and identifies index points, Treasury yield percent and gold/oil
futures proxies correctly. It does not supply news, volume or market breadth.

The system prompt now directs broad market questions to this tool without
requiring tickers, and discourages dismissing the question or redirecting to a
previous portfolio. MCP registration, tool evidence labels, terminal activity
summary and the displayed tool count are updated together.

Validation: typecheck, lint and production build passed; 47/47 unit tests and
30/30 offline evaluations passed. Regression coverage includes the exact Chinese
question through a mocked model/tool stream, partial and missing feeds, regional
allowlists, invalid input, timeout, quote time and unit semantics, and MCP discovery.
No real DeepSeek call was made; model tool-selection behavior still needs a small
live acceptance check before claiming production end-to-end verification.

This change has not been deployed. No database/user records or production
configuration were modified. Current production remains v2026.11.03.1.
