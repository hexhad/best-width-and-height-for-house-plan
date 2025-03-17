import React, { useState, useEffect } from "react";

// Helper Functions
const generateOddNumbers = (start, end) => {
  const odds = [];
  const firstOdd = start % 2 === 0 ? start + 1 : start;
  for (let i = firstOdd; i <= end; i += 2) {
    odds.push(i);
  }
  return odds;
};

const convertInchesToFeetAndInches = (inches) =>
  `${Math.floor(inches / 12)} ft ${inches % 12} in`;

const computeMods = (multi) => ({
  aya: (multi * 8) % 12,
  weya: (multi * 9) % 10,
  yoni: (multi * 3) % 8,
  nekatha: (multi * 8) % 27,
  dawasa: (multi * 9) % 7,
  ayusha: (multi * 27) % 100,
  anshaka: (multi * 4) % 9,
  rashiya: (multi * 5) % 12,
  thithiya: (multi * 9) % 30,
  wanshaya: (multi * 3) % 4,
  dewatha: (multi * 5) % 3,
});

// Define conditions with their names
const conditions = [
  { name: "අය > 6", check: (mods) => mods.aya > 6 },
  { name: "විය < 5", check: (mods) => mods.weya < 5 },
  {
    name: "යෝනි ∈ [1,3,5,7]",
    check: (mods) => [1, 3, 5, 7].includes(mods.yoni),
  },
  {
    name: "නකත ∈ [2,5,7,9,11,14,16,18,20,23,25,27]",
    check: (mods) =>
      [2, 5, 7, 9, 11, 14, 16, 18, 20, 23, 25, 27].includes(mods.nekatha),
  },
  { name: "දවස ∈ [2,3,6]", check: (mods) => [2, 3, 6].includes(mods.dawasa) },
  { name: "අයුෂ > 50", check: (mods) => mods.ayusha > 50 },
  {
    name: "අංශක ∈ [1,3,5,6,8]",
    check: (mods) => [1, 3, 5, 6, 8].includes(mods.anshaka),
  },
  {
    name: "රාශිය ∈ [2,3,5,9,11]",
    check: (mods) => [2, 3, 5, 9, 11].includes(mods.rashiya),
  },
  {
    name: "තිථිය ∉ [5,10,15,20,25,30]",
    check: (mods) => ![5, 10, 15, 20, 25, 30].includes(mods.thithiya),
  },
  {
    name: "වංශය ∈ [1,2,3]",
    check: (mods) => [1, 2, 3].includes(mods.wanshaya),
  },
  { name: "දෙවතා ∈ [1,2]", check: (mods) => [1, 2].includes(mods.dewatha) },
];

const App = () => {
  // State declarations
  const [results, setResults] = useState([]);
  const [startX, setStartX] = useState(361);
  const [endX, setEndX] = useState(500);
  const [startY, setStartY] = useState(281);
  const [endY, setEndY] = useState(391);
  const [selectedConditions, setSelectedConditions] = useState(
    new Array(conditions.length).fill(true)
  );

  // Effect to compute results based on selected conditions
  useEffect(() => {
    const mul = (x, y) => {
      const multi = x * y;
      const mods = computeMods(multi);
      const selectedChecks = conditions
        .filter((_, index) => selectedConditions[index])
        .map((c) => c.check);
      // If no conditions selected, include all; otherwise, all selected must be true
      if (
        selectedChecks.length === 0 ||
        selectedChecks.every((check) => check(mods))
      ) {
        return {
          x: convertInchesToFeetAndInches(x),
          y: convertInchesToFeetAndInches(y),
          aya: mods.aya,
          weya: mods.weya,
          yoni: mods.yoni,
          nekatha: mods.nekatha,
          dawasa: mods.dawasa,
          ayusha: mods.ayusha,
          anshaka: mods.anshaka,
          rashiya: mods.rashiya,
        };
      }
      return null;
    };

    let tempResults = [];
    const xOdds = generateOddNumbers(startX, endX);
    const yOdds = generateOddNumbers(startY, endY);
    xOdds.forEach((x) => {
      yOdds.forEach((y) => {
        const result = mul(x, y);
        if (result) tempResults.push(result);
      });
    });
    setResults(tempResults);
  }, [startX, endX, startY, endY, selectedConditions]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Results</h1>

      {/* Sliders for adjusting ranges */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Adjust Ranges</h3>
        <div>
          <label>Start දිග: {startX}</label>
          <input
            type="range"
            min="200"
            max="600"
            value={startX}
            onChange={(e) => setStartX(Number(e.target.value))}
            style={{ width: "300px", margin: "10px" }}
          />
        </div>
        <div>
          <label>End දිග: {endX}</label>
          <input
            type="range"
            min="200"
            max="600"
            value={endX}
            onChange={(e) => setEndX(Number(e.target.value))}
            style={{ width: "300px", margin: "10px" }}
          />
        </div>
        <div>
          <label>Start පළල: {startY}</label>
          <input
            type="range"
            min="200"
            max="600"
            value={startY}
            onChange={(e) => setStartY(Number(e.target.value))}
            style={{ width: "300px", margin: "10px" }}
          />
        </div>
        <div>
          <label>End පළල: {endY}</label>
          <input
            type="range"
            min="200"
            max="600"
            value={endY}
            onChange={(e) => setEndY(Number(e.target.value))}
            style={{ width: "300px", margin: "10px" }}
          />
        </div>
      </div>

      {/* Checkboxes for selecting conditions */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Select Conditions to Apply</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "15px",
            justifyContent: "center",
          }}
        >
          {conditions.map((condition, index) => (
            <label key={index} style={{ margin: "5px 0" }}>
              <input
                type="checkbox"
                checked={selectedConditions[index]}
                onChange={() => {
                  const newSelected = [...selectedConditions];
                  newSelected[index] = !newSelected[index];
                  setSelectedConditions(newSelected);
                }}
              />
              {condition.name}
            </label>
          ))}
        </div>
      </div>

      {/* Results Display */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "15px",
          justifyContent: "center",
        }}
      >
        {results.map((res, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              width: "200px",
              boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)",
              backgroundColor: "rgba(73, 73, 73, 0.1)",
            }}
          >
            <p style={{ lineHeight: "5px" }}>
              <strong>දිග:</strong> {res.x}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>පළල:</strong> {res.y}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>අය:</strong> {res.aya}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>විය:</strong> {res.weya}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>යෝනි:</strong> {res.yoni}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>නකත:</strong> {res.nekatha}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>දවස:</strong> {res.dawasa}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>අයුෂ:</strong> {res.ayusha}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>අංශක:</strong> {res.anshaka}
            </p>
            <p style={{ lineHeight: "5px" }}>
              <strong>රාශිය:</strong> {res.rashiya}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
