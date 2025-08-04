"use client"

import { useState, useRef, useEffect } from "react"
import { LiquidationCalculator } from "@/components/liquidation-calculator"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DynamicCryptoSearch } from "@/components/dynamic-crypto-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, BarChart3, Calculator, Globe, Code, BookOpen } from "lucide-react"

export default function Home() {
  const [activeTab, setActiveTab] = useState("calculator")

  // Refs for scrolling to sections
  const featuresRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === "#features" && featuresRef.current) {
        featuresRef.current.scrollIntoView({ behavior: "smooth" })
      } else if (hash === "#about" && aboutRef.current) {
        aboutRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }

    // Check hash on initial load
    handleHashChange()

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-0">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {activeTab === "calculator" && (
            <div className="space-y-16">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Crypto Liquidation Calculator
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Advanced trading tool with live market data, risk management, and comprehensive position analysis
                </p>
              </div>
              <LiquidationCalculator />

              {/* Features Section */}
              <div id="features" ref={featuresRef} className="pt-16 scroll-mt-20">
                <div className="text-center mb-12">
                  <Badge variant="outline" className="mb-2">
                    Features
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Trading Tools</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Our platform offers comprehensive tools for cryptocurrency traders to manage risk and optimize
                    positions
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="h-5 w-5 text-primary mr-2" />
                        Liquidation Calculator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Calculate liquidation prices for any cryptocurrency with customizable leverage and position
                        size. Supports both long and short positions with real-time market data.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 text-primary mr-2" />
                        Risk Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Comprehensive risk analysis tools to help you understand your exposure and make informed trading
                        decisions. Visual indicators for risk levels and distance to liquidation.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-primary mr-2" />
                        Price Charts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Interactive price charts with liquidation levels and risk zones. Visualize your position and
                        understand market movements with real-time data.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="h-5 w-5 text-primary mr-2" />
                        Market Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Access real-time market data for thousands of cryptocurrencies. Search, filter, and sort to find
                        the information you need for your trading decisions.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="h-5 w-5 text-primary mr-2" />
                        Multi-Asset Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Support for all major cryptocurrencies and thousands of altcoins. Calculate liquidation prices
                        for any tradable digital asset with accurate market data.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Code className="h-5 w-5 text-primary mr-2" />
                        Open Source
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Fully open source and transparent. Review the code, contribute improvements, or fork the project
                        for your own needs. Built with modern web technologies.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* About Section */}
              <div id="about" ref={aboutRef} className="pt-16 scroll-mt-20">
                <div className="text-center mb-12">
                  <Badge variant="outline" className="mb-2">
                    About
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">About This Project</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Learn more about the Crypto Liquidation Calculator and its development
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6 md:p-8">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <BookOpen className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Project Background</h3>
                          <p className="text-muted-foreground">
                            The Crypto Liquidation Calculator was developed to help traders understand and manage risk
                            in leveraged cryptocurrency trading. With the growing popularity of margin trading, many
                            traders needed a simple yet powerful tool to calculate liquidation prices and visualize
                            risk.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Shield className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Risk Management Philosophy</h3>
                          <p className="text-muted-foreground">
                            We believe that successful trading requires proper risk management. This tool helps traders
                            understand their exposure and make informed decisions. Remember that leveraged trading
                            carries significant risk, and you should never risk more than you can afford to lose.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Code className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Technology Stack</h3>
                          <p className="text-muted-foreground">
                            Built with modern web technologies including Next.js, TypeScript, Tailwind CSS, and
                            shadcn/ui components. The application uses real-time cryptocurrency data from public APIs
                            and implements client-side calculations for maximum performance and privacy.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Globe className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Open Source Contribution</h3>
                          <p className="text-muted-foreground">
                            This project is open source and available on GitHub. We welcome contributions, bug reports,
                            and feature requests from the community. Whether you're a developer, designer, or trader,
                            your input helps make this tool better for everyone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "market" && (
            <div className="space-y-16">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Live Crypto Market
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Search and explore real-time data for thousands of cryptocurrencies
                </p>
              </div>
              <DynamicCryptoSearch />

              {/* Features Section - Market Tab */}
              <div id="features" ref={featuresRef} className="pt-16 scroll-mt-20">
                <div className="text-center mb-12">
                  <Badge variant="outline" className="mb-2">
                    Features
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Market Data Features</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Explore our comprehensive cryptocurrency market data tools
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="h-5 w-5 text-primary mr-2" />
                        Comprehensive Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Access real-time data for thousands of cryptocurrencies including price, market cap, volume, and
                        price changes. Stay informed with the most up-to-date market information.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="h-5 w-5 text-primary mr-2" />
                        Dynamic Search
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Powerful search functionality lets you find any cryptocurrency by name or symbol. Filter results
                        by gainers, losers, or your favorite coins for quick access.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-primary mr-2" />
                        Advanced Sorting
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Sort cryptocurrencies by rank, price, 24-hour change, market cap, or volume. Customize your view
                        to focus on the metrics that matter most to your trading strategy.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* About Section - Market Tab */}
              <div id="about" ref={aboutRef} className="pt-16 scroll-mt-20">
                <div className="text-center mb-12">
                  <Badge variant="outline" className="mb-2">
                    About
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">About Our Market Data</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Learn more about our cryptocurrency market data sources and features
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6 md:p-8">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <Globe className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Data Sources</h3>
                          <p className="text-muted-foreground">
                            Our market data is sourced from reliable cryptocurrency APIs that aggregate information from
                            major exchanges worldwide. We refresh this data regularly to ensure you have access to the
                            most current market information.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Shield className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Data Accuracy</h3>
                          <p className="text-muted-foreground">
                            While we strive to provide accurate and up-to-date information, cryptocurrency markets are
                            highly volatile. Always verify critical data with multiple sources before making important
                            trading decisions.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <Zap className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Performance Optimizations</h3>
                          <p className="text-muted-foreground">
                            Our market data interface is optimized for performance with features like data caching,
                            progressive loading, and efficient search algorithms. This ensures a smooth experience even
                            when browsing thousands of cryptocurrencies.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
