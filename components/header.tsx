"use client"

import { useState } from "react"
import { Moon, Sun, Menu, TrendingUp } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: "Calculator", href: "#calculator" },
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">CryptoCalc</span>
          </div>

          {/* Desktop Navigation with Tabs */}
          <div className="hidden md:flex items-center space-x-6">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calculator" className="text-sm font-medium">
                  🧮 Calculator
                </TabsTrigger>
                <TabsTrigger value="market" className="text-sm font-medium">
                  📊 Live Market
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm font-medium transition-colors hover:text-primary">
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-8">
                  <div className="pb-4 border-b">
                    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calculator" onClick={() => setIsOpen(false)}>
                          🧮 Calculator
                        </TabsTrigger>
                        <TabsTrigger value="market" onClick={() => setIsOpen(false)}>
                          📊 Market
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-lg font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
