"use client";

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

// New component for BTC price chart
interface BTCPriceChartProps {
  data: { time: string; price: number }[];
}

const BTCPriceChart = ({ data }: BTCPriceChartProps) => {
  // Get the current price from the data (last data point)
  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;

  // Calculate the y-axis domain based on the current price
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

export default function Component() {
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

  const apiKey = import.meta.env.VITE_API_KEY;

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
        // Generate a new price based on the last price
        const lastPrice = prevData.length
          ? prevData[prevData.length - 1].price
          : livePrice;
        const simulatedPrice = parseFloat(
          (lastPrice + (Math.random() - 0.5) * 100).toFixed(1)
        ); // Simulate price changes

        return [
          ...prevData,
          { time: new Date().toLocaleTimeString(), price: simulatedPrice },
        ].slice(-10); // Keep only the last 10 data points
      });
    } catch (err) {
      setError("Failed to fetch live BTC price.");
    }
  };

  useEffect(() => {
    if (useLivePrice) {
      const interval = setInterval(fetchBTCPrice, 5000); // Fetch every 5 seconds
      return () => clearInterval(interval);
    }
  }, [useLivePrice]);

  const handleCheckboxChange = (checked: boolean) => {
    setUseLivePrice(checked);
    if (checked) {
      fetchBTCPrice();
      setIsBTCPriceVisible(false);
      setIsModalOpen(true); // Open the modal when checkbox is checked
    } else {
      setEntryPrice("");
      setIsBTCPriceVisible(true);
      setIsModalOpen(false); // Close the modal when checkbox is unchecked
    }
  };

  const calculateLiquidationPrice = () => {
    setError("");
    setResult(null);

    const entryPriceNum = parseFloat(entryPrice);
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

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Liquidation Price Calculator</CardTitle>
          <CardDescription>
            Calculate the liquidation price for your position
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <label htmlFor="useLivePrice" className="text-gray-700">
                Use Live BTC Price
              </label>
            </div>
            {/* BTC Price Input Section */}
            <div>
              <Label
                className={`space-y-2 ${
                  isBTCPriceVisible ? "block" : "hidden"
                }`}
                id="text(BTCPrice)"
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
            <Button type="submit" className="w-full">
              Calculate Liquidation Price
            </Button>
          </form>
          {error && <p className="mt-4 text-red-500">{error}</p>}
          {result !== null && (
            <div className="mt-4 p-4 bg-green-100 rounded-md">
              <p className="text-green-800">Liquidation Price: ${result}</p>
            </div>
          )}
        </CardContent>

        {/* Modal for BTC Price Chart */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Live BTC Price Chart</DialogTitle>
              <DialogDescription>
                Real-time BTC price updates every 5 seconds
              </DialogDescription>
            </DialogHeader>
            <BTCPriceChart data={btcPriceData} />
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );
}
