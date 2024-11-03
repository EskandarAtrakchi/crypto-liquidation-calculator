"use client";

import { useState } from "react";
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

export default function Component() {
  const [entryPrice, setEntryPrice] = useState("");
  const [leverage, setLeverage] = useState("");
  const [positionType, setPositionType] = useState("long");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");

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
          <div className="space-y-2">
            <Label htmlFor="entryPrice">Entry Price (USD)</Label>
            <Input
              id="entryPrice"
              type="number"
              placeholder="Enter price"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
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
    </Card>
  );
}
