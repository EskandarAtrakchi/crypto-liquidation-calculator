"use client"

import { useState } from "react"
import { LiquidationCalculator } from "@/components/liquidation-calculator"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DynamicCryptoSearch } from "@/components/dynamic-crypto-search"

export default function Home() {
  const [activeTab, setActiveTab] = useState("calculator")

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-0">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {activeTab === "calculator" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Crypto Liquidation Calculator
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Advanced trading tool with live market data, risk management, and comprehensive position analysis
                </p>
              </div>
              <LiquidationCalculator />
            </div>
          )}

          {activeTab === "market" && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Live Crypto Market
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Search and explore real-time data for thousands of cryptocurrencies
                </p>
              </div>
              <DynamicCryptoSearch />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
