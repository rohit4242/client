"use client"

import * as React from "react"
import { Search, BarChart3, Activity, Users, Bot, TrendingUp, Plus, Link2, Eye, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Popular trading pairs for quick access
const popularSymbols = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT", 
  "SOLUSDT", "DOTUSDT", "LINKUSDT", "LTCUSDT", "BCHUSDT"
]

const navigationItems = [
  {
    group: "Navigation",
    items: [
      {
        title: "Dashboard",
        description: "View trading overview and statistics",
        icon: BarChart3,
        href: "/dashboard",
        keywords: ["home", "overview", "stats", "analytics", "portfolio"]
      },
      {
        title: "Positions",
        description: "Manage your trading positions",
        icon: Activity,
        href: "/positions",
        keywords: ["positions", "trades", "open", "closed", "pnl", "portfolio"]
      },
      {
        title: "Manual Trading",
        description: "Execute trades manually",
        icon: TrendingUp,
        href: "/manual-trading",
        keywords: ["trade", "buy", "sell", "order", "manual", "chart"]
      },
      {
        title: "My Exchanges",
        description: "Manage exchange connections",
        icon: Users,
        href: "/my-exchanges",
        keywords: ["exchanges", "binance", "api", "connect", "account"]
      },
      {
        title: "Signal Bot",
        description: "Automated trading signals",
        icon: Bot,
        href: "/signal-bot",
        keywords: ["bot", "signals", "automated", "alerts"]
      },
    ]
  }
]

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const [positions, setPositions] = useState<any[]>([])
  const [exchanges, setExchanges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open && !loading) {
      fetchSearchData()
    }
  }, [open])

  const fetchSearchData = async () => {
    setLoading(true)
    try {
      const positionsResponse = await fetch('/api/positions')
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json()
        setPositions(positionsData.positions?.slice(0, 10) || []) // Limit to recent 10
      }

      // Fetch exchanges
      const exchangesResponse = await fetch('/api/exchanges')
      if (exchangesResponse.ok) {
        const exchangesData = await exchangesResponse.json()
        setExchanges(exchangesData.exchanges || [])
      }
    } catch (error) {
      console.error('Failed to fetch search data:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search trading...</span>
        <span className="inline-flex lg:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search positions, symbols, or navigate..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Navigation */}
          {navigationItems.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.title} ${item.description} ${item.keywords.join(" ")}`}
                  onSelect={() => {
                    runCommand(() => router.push(item.href))
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {/* Recent Positions */}
          {positions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Positions">
                {positions.map((position) => (
                  <CommandItem
                    key={position.id}
                    value={`${position.symbol} ${position.side} position ${position.status} ${position.id}`}
                    onSelect={() => {
                      runCommand(() => router.push("/positions"))
                    }}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{position.symbol}</span>
                          <Badge variant={position.side === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                            {position.side}
                          </Badge>
                          <Badge variant={position.status === 'OPEN' ? 'outline' : 'secondary'} className="text-xs">
                            {position.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {position.quantity} @ ${position.entryPrice}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${
                          position.status === 'OPEN' 
                            ? (position.unrealizedPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            : (position.realizedPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {position.status === 'OPEN' 
                            ? `${(position.unrealizedPnl || 0) >= 0 ? '+' : ''}$${position.unrealizedPnl?.toFixed(2) || '0.00'}`
                            : `${(position.realizedPnl || 0) >= 0 ? '+' : ''}$${position.realizedPnl?.toFixed(2) || '0.00'}`
                          }
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Popular Trading Pairs */}
          <CommandSeparator />
          <CommandGroup heading="Popular Trading Pairs">
            {popularSymbols.map((symbol) => (
              <CommandItem
                key={symbol}
                value={`${symbol} trade buy sell chart`}
                onSelect={() => {
                  runCommand(() => router.push(`/manual-trading?symbol=${symbol}`))
                }}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span>{symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      Start trading {symbol.replace('USDT', '/USDT')}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Quick Actions */}
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/manual-trading"))
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>New Trade</span>
                <span className="text-xs text-muted-foreground">Open manual trading interface</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/my-exchanges"))
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Connect Exchange</span>
                <span className="text-xs text-muted-foreground">Add or manage exchange connections</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/positions"))
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>View All Positions</span>
                <span className="text-xs text-muted-foreground">See all open and closed positions</span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/signal-bot"))
              }}
            >
              <Target className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Trading Signals</span>
                <span className="text-xs text-muted-foreground">Access automated trading signals</span>
              </div>
            </CommandItem>
          </CommandGroup>

          {/* Connected Exchanges */}
          {exchanges.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Connected Exchanges">
                {exchanges.map((exchange) => (
                  <CommandItem
                    key={exchange.id}
                    value={`${exchange.name} ${exchange.accountName} exchange`}
                    onSelect={() => {
                      runCommand(() => router.push("/my-exchanges"))
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{exchange.name}</span>
                          {exchange.isTestnet && (
                            <Badge variant="outline" className="text-xs">TESTNET</Badge>
                          )}
                          {!exchange.isEnabled && (
                            <Badge variant="destructive" className="text-xs">DISABLED</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {exchange.accountName}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
} 