import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Header } from "./components/Header";


// Existing BTCPriceChart component
interface BTCPriceChartProps {
  data: { time: string; price: number }[];
}

const BTCPriceChart = ({ data }: BTCPriceChartProps) => {
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const lowerBound = Math.max(0, currentPrice - 75);
  const upperBound = currentPrice;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={[lowerBound, upperBound]} />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};


// Main component
export default function LiquidationCalculatorPage() {
  const [theme, setTheme] = useState("light");
  const [entryPrice, setEntryPrice] = useState("");
  const [leverage, setLeverage] = useState("");
  const [positionType, setPositionType] = useState("long");
  const [useLivePrice, setUseLivePrice] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isBTCPriceVisible, setIsBTCPriceVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [btcPriceData, setBtcPriceData] = useState<
    { time: string; price: number }[]
  >([]);

  const apiKey = import.meta.env.VITE_API_KEY; // Using Vite's environment variable convention

  const fetchBTCPrice = async () => {
    try {
      const response = await fetch(
        "https://api.api-ninjas.com/v1/cryptoprice?symbol=BTCUSDT",
        {
          headers: {
            "X-Api-Key": apiKey,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch live BTC price.");

      const data = await response.json();
      const livePrice = parseFloat(data.price);
      setEntryPrice(livePrice.toString());

      // Simulate historical price data
      setBtcPriceData((prevData) => {
        const lastPrice = prevData.length
          ? prevData[prevData.length - 1].price
          : livePrice;
        const simulatedPrice = parseFloat(
          (lastPrice + (Math.random() - 0.5) * 100).toFixed(1)
        );

        return [
          ...prevData,
          { time: new Date().toLocaleTimeString(), price: simulatedPrice },
        ].slice(-10);
      });
    } catch (err) {
      setError("Failed to fetch live BTC price.");
      alert(
        "Failed to fetch live BTC price! API out of credits. Please wait for refill or use static price"
      );
    }
  };

  useEffect(() => {
    if (useLivePrice) {
      const interval = setInterval(fetchBTCPrice, 5000);
      return () => clearInterval(interval);
    }
  }, [useLivePrice]);

  const handleCheckboxChange = (checked: boolean) => {
    setUseLivePrice(checked);
    if (checked) {
      fetchBTCPrice();
      setIsBTCPriceVisible(false);
      setIsModalOpen(true);
    } else {
      setEntryPrice("");
      setIsBTCPriceVisible(true);
      setIsModalOpen(false);
    }
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const calculateLiquidationPrice = () => {
    setError("");
    setResult(null);

    const entryPriceNum = useLivePrice
      ? parseFloat(entryPrice)
      : parseFloat(entryPrice);
    const leverageNum = parseFloat(leverage);

    if (isNaN(entryPriceNum) || isNaN(leverageNum)) {
      setError("Please enter valid numbers for Entry Price and Leverage.");
      return;
    }

    if (leverageNum <= 1) {
      setError("Leverage must be greater than 1.");
      return;
    }

    let liquidationPrice;
    if (positionType === "long") {
      liquidationPrice = entryPriceNum * (1 - 1 / leverageNum);
    } else {
      liquidationPrice = entryPriceNum * (1 + 1 / leverageNum);
    }

    setResult(parseFloat(liquidationPrice.toFixed(2)));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme); // Save theme to local storage
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === "dark" ? "bg-slate-800 text-white" : "bg-slate-200 text-black"
      }`}
    >
      <Header toggleTheme={toggleTheme} theme={theme} />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card
          className={`${
            theme === "dark"
              ? "bg-slate-900 text-white"
              : "bg-slate-300 text-black"
          }`}
        >
          <CardHeader>
            <CardTitle>Liquidation Price Calculator</CardTitle>
            <CardDescription>
              Calculate the liquidation price for your position
            </CardDescription>
          </CardHeader>
          <CardContent
            className={`${
              theme === "dark"
                ? "bg-slate-900 text-white"
                : "bg-slate-300 text-black"
            }`}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                calculateLiquidationPrice();
              }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useLivePrice"
                  className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={useLivePrice}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                />
                <label htmlFor="useLivePrice" className="text-amber-800">
                  Use Live BTC Price
                </label>
              </div>
              {useLivePrice && (
                <Button onClick={handleModalOpen} className="mt-2">
                  View BTC Price Chart
                </Button>
              )}
              <div>
                <Label
                  className={`space-y-2 ${
                    isBTCPriceVisible ? "block" : "hidden"
                  }`}
                  htmlFor="entryPrice"
                >
                  Entry Price (USD)
                </Label>
                <Input
                  id="entryPrice"
                  type="number"
                  placeholder="Enter price"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  disabled={useLivePrice}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leverage">Leverage</Label>
                <Input
                  id="leverage"
                  type="number"
                  placeholder="Enter leverage"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionType">Position Type</Label>
                <Select value={positionType} onValueChange={setPositionType}>
                  <SelectTrigger id="positionType">
                    <SelectValue placeholder="Select position type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit">Calculate</Button>
              {result && (
                <p className="text-green-500">
                  Liquidation Price:{" "}
                  <span className="font-bold">${result}</span>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
      <hr></hr>
      <footer
        className={`text-center p-4 bg-background text-foreground ${
          theme === "dark"
            ? "bg-slate-800 text-white"
            : "bg-slate-300 text-black"
        }`}
      >
        <p>
          This project is public by{" "}
          <a href="https://github.com/EskandarAtrakchi/crypto-liquidation-calc">
            {" "}
            Eskandar Atrakchi. Feel free to use the code and modify it as you
            wish. ٩(｡•́‿•̀｡)۶
          </a>
        </p>
      </footer>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className={`text-center p-4 bg-background text-foreground ${
            theme === "dark"
              ? "bg-slate-800 text-white"
              : "bg-stone-400 text-black"
          }`}
        >
          <DialogHeader>
            <DialogTitle>BTC Price Chart</DialogTitle>
            <DialogDescription>
              Live BTC price chart over time
            </DialogDescription>
          </DialogHeader>
          <BTCPriceChart data={btcPriceData} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
