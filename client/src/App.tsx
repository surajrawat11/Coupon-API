
import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./App.css";

type Coupon = {
  _id: string;
  code: string;
  discountPercent?: number;
  discountValue?: number;
  expiresAt?: string;
  expiryDate?: string;
  expired?: boolean;
};

type CouponResult = {
  code: string;
  discountPercent: number;
  originalAmount: number;
  discount: number;
  finalAmount: number;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }

  return data as T;
}

export default function App() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [expiry, setExpiry] = useState("");
  const [purchaseCode, setPurchaseCode] = useState("");
  const [amount, setAmount] = useState("1000");
  const [result, setResult] = useState<CouponResult | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCoupons = useCallback(async () => {
    try {
      const data = await request<{ coupons: Coupon[] }>("/coupons");
      setCoupons(data.coupons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load coupons");
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const normalizedCode = code.trim().toUpperCase();

      await request("/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: normalizedCode,
          discountPercent: Number(discountPercent),
          expiresAt: new Date(expiry).toISOString(),
        }),
      });

      setMessage(`Coupon ${normalizedCode} created successfully.`);
      setCode("");
      setDiscountPercent("10");
      setExpiry("");
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create coupon");
    } finally {
      setLoading(false);
    }
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResult(null);
    setLoading(true);

    try {
      const data = await request<CouponResult>("/coupons/apply", {
        method: "POST",
        body: JSON.stringify({
          code: purchaseCode.trim().toUpperCase(),
          amount: Number(amount),
        }),
      });

      setResult(data);
      setMessage("Coupon applied successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply coupon");
    } finally {
      setLoading(false);
    }
  }

  function expiryOf(coupon: Coupon) {
    return coupon.expiresAt ?? coupon.expiryDate;
  }

  function isExpired(coupon: Coupon) {
    const date = expiryOf(coupon);
    return coupon.expired === true || (date ? new Date(date).getTime() <= Date.now() : false);
  }

  function discountOf(coupon: Coupon) {
    return coupon.discountPercent ?? coupon.discountValue ?? 0;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">%</span>
          <span>Perk<span className="brand-light">Pilot</span></span>
        </a>
        <span className="api-status"><span /> API connected</span>
      </header>

      <section className="hero">
        <div className="eyebrow">COUPON MANAGEMENT</div>
        <h1>Make every purchase<br /><span>more rewarding.</span></h1>
        <p>Create discount codes, manage active offers, and calculate savings in one place.</p>
        <div className="hero-stats">
          <div><strong>{coupons.length}</strong><span>Total coupons</span></div>
          <div><strong>{coupons.filter((c) => !isExpired(c)).length}</strong><span>Available offers</span></div>
          <div><strong>{coupons.filter(isExpired).length}</strong><span>Expired offers</span></div>
        </div>
      </section>

      {(message || error) && (
        <div className={`notice ${error ? "notice-error" : "notice-success"}`} role="status">
          {error || message}
          <button className="notice-close" onClick={() => { setError(""); setMessage(""); }}>×</button>
        </div>
      )}

      <section className="workspace">
        <article className="panel">
          <div className="panel-heading">
            <div className="panel-icon purple">＋</div>
            <div><h2>Create a coupon</h2><p>Launch a new customer offer</p></div>
          </div>
          <form onSubmit={createCoupon} className="form">
            <label htmlFor="coupon-code">Coupon code</label>
            <input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE20" minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" required />
            <div className="field-row">
              <div>
                <label htmlFor="discount">Discount (%)</label>
                <input id="discount" type="number" min="1" max="90" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="expiry">Expiry date and time</label>
                <input id="expiry" type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} required />
              </div>
            </div>
            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Please wait…" : "Create coupon"} <span>↗</span>
            </button>
          </form>
        </article>

        <article className="panel calculator-panel">
          <div className="panel-heading">
            <div className="panel-icon green">₹</div>
            <div><h2>Calculate savings</h2><p>Find out what your customer saves</p></div>
          </div>
          <form onSubmit={applyCoupon} className="form">
            <label htmlFor="purchase-code">Coupon code</label>
            <input id="purchase-code" value={purchaseCode} onChange={(e) => setPurchaseCode(e.target.value)} placeholder="Enter a coupon code" minLength={3} maxLength={32} required />
            <label htmlFor="amount">Purchase amount (₹)</label>
            <input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <button className="primary-button green-button" disabled={loading} type="submit">
              {loading ? "Calculating…" : "Apply coupon"} <span>→</span>
            </button>
          </form>
          {result && (
            <div className="result-card">
              <div className="result-line"><span>Original amount</span><strong>{money(result.originalAmount)}</strong></div>
              <div className="result-line savings"><span>You save ({result.discountPercent}%)</span><strong>−{money(result.discount)}</strong></div>
              <div className="result-total"><span>Final amount</span><strong>{money(result.finalAmount)}</strong></div>
            </div>
          )}
        </article>
      </section>

      <section className="panel coupon-panel">
        <div className="list-heading">
          <div><h2>Your coupons</h2><p>All offers from your database</p></div>
          <button className="refresh-button" onClick={() => void loadCoupons()}>↻ Refresh</button>
        </div>
        {coupons.length === 0 ? (
          <div className="empty-state"><span>％</span><h3>No coupons yet</h3><p>Create your first coupon to see it here.</p></div>
        ) : (
          <div className="coupon-list">
            {coupons.map((coupon) => {
              const expired = isExpired(coupon);
              const date = expiryOf(coupon);
              return (
                <div className="coupon-row" key={coupon._id}>
                  <div className="coupon-symbol">%</div>
                  <div className="coupon-info">
                    <strong>{coupon.code}</strong>
                    <span>{date ? `Expires ${new Date(date).toLocaleString()}` : "Expiry date unavailable"}</span>
                  </div>
                  <div className="discount-badge">{discountOf(coupon)}% off</div>
                  <span className={`status-badge ${expired ? "expired" : "active"}`}>
                    {expired ? "Expired" : "Active"}
                  </span>
                  {!expired && <button className="use-button" onClick={() => { setPurchaseCode(coupon.code); document.getElementById("purchase-code")?.focus(); }}>Use</button>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer><span>PerkPilot</span> · Coupon management made simple</footer>
    </main>
  );
}
