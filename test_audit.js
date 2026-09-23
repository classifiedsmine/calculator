const P = 10000;
const PMT = 500;

function runModelA(n, m, years, r) {
  const i = Math.pow(1 + r / n, n / m) - 1;
  let bal = P;
  for (let yr = 1; yr <= years; yr++) {
    for (let k = 1; k <= m; k++) {
      bal += bal * i;
      bal += PMT;
    }
  }
  return { periodRate: i, balance: bal };
}

function runModelB(n, m, years, r) {
  let bal = P;
  const compPeriodsTotal = n * years;
  const contribsPerComp = m / n; // e.g., 12 / 1 = 12, or 12 / 4 = 3
  const ratePerComp = r / n;

  for (let cp = 1; cp <= compPeriodsTotal; cp++) {
    let subPeriodDeposits = 0;
    for (let c = 1; c <= contribsPerComp; c++) {
      bal += PMT;
      subPeriodDeposits += PMT;
    }
    // Strict literal milestone model: interest is calculated on the balance prior to this period's deposits
    bal += (bal - subPeriodDeposits) * ratePerComp;
  }
  return bal;
}

const tests = [
  { id: 1, name: 'Test 1', n: 1, m: 12, years: 1, r: 0.10 },
  { id: 2, name: 'Test 2', n: 4, m: 12, years: 1, r: 0.12 },
  { id: 3, name: 'Test 3', n: 12, m: 4, years: 1, r: 0.10 },
  { id: 4, name: 'Test 4', n: 365, m: 12, years: 1, r: 0.10 },
  { id: 5, name: 'Test 5', n: 12, m: 12, years: 1, r: 0.10 },
  { id: 6, name: 'Test 6', n: 1, m: 12, years: 10, r: 0.10 }
];

tests.forEach(t => {
  const resA = runModelA(t.n, t.m, t.years, t.r);
  const resB = runModelB(t.n, t.m, t.years, t.r);
  const diff = resA.balance - resB;
  const pctDiff = (diff / resB) * 100;
  console.log(`TEST ${t.id} (${t.name}):`);
  console.log(`  n = ${t.n}, m = ${t.m}, r = ${t.r}, years = ${t.years}`);
  console.log(`  periodRate = ${resA.periodRate.toFixed(10)}`);
  console.log(`  Model A Balance = ${resA.balance.toFixed(4)}`);
  console.log(`  Model B Balance = ${resB.toFixed(4)}`);
  console.log(`  Difference = ${diff.toFixed(4)}`);
  console.log(`  Pct Difference = ${pctDiff.toFixed(4)}%`);
});
