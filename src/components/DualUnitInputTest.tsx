import React from "react";
import DualUnitInput from "../components/DualUnitInput";

// Test component to verify DualUnitInput functionality
export default function DualUnitInputTest() {
  const [weight, setWeight] = React.useState(5.0);
  const [volume, setVolume] = React.useState(20.0);
  const [temperature, setTemperature] = React.useState(20.0);

  return (
    <div className="p-8 space-y-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">DualUnitInput Test</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Weight (kg ↔ lb)
          </label>
          <DualUnitInput
            value={weight}
            onChange={(newValue) => {
              setWeight(newValue);
            }}
            unitType="weight"
            placeholder="5.0"
          />
          <p className="text-xs text-gray-400 mt-1">
            Current value: {weight} kg
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Volume (L ↔ gal)
          </label>
          <DualUnitInput
            value={volume}
            onChange={(newValue) => {
              console.log("Volume changed from", volume, "to", newValue);
              setVolume(newValue);
            }}
            unitType="volume"
            placeholder="20.0"
          />
          <p className="text-xs text-gray-400 mt-1">
            Current value: {volume} L
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Temperature (°C ↔ °F)
          </label>
          <DualUnitInput
            value={temperature}
            onChange={(newValue) => {
              console.log(
                "Temperature changed from",
                temperature,
                "to",
                newValue
              );
              setTemperature(newValue);
            }}
            unitType="temperature"
            placeholder="20.0"
          />
          <p className="text-xs text-gray-400 mt-1">
            Current value: {temperature} °C
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Gravity (read-only)
          </label>
          <DualUnitInput
            value={1.05}
            onChange={() => {}}
            unitType="gravity"
            placeholder="1.050"
            readOnly={true}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Instructions:</h2>
        <ul className="text-sm space-y-1">
          <li>
            • Click on the unit labels (kg, L, °C) to toggle between units
          </li>
          <li>• Values should convert automatically when you toggle</li>
          <li>• Rounding should occur when switching units</li>
          <li>• All calculations should use the primary unit (kg, L, °C)</li>
          <li>• The read-only input should not allow unit toggling</li>
          <li>• Check browser console for debug logs</li>
        </ul>
      </div>
    </div>
  );
}
