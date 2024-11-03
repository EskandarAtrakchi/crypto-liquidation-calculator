import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// New Header component
interface HeaderProps {
  toggleTheme: () => void;
  theme: string;
}

export const Header = ({ toggleTheme, theme }: HeaderProps) => (
  <header className="flex justify-between items-center p-4 bg-background text-foreground">
    <h1 className="text-2xl font-bold">Liquidation Calculator</h1>
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  </header>
);
