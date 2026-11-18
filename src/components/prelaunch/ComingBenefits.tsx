import { MapPin, ShoppingBasket, MessageCircle } from "lucide-react";
import styles from "./Campaign.module.css";

export function ComingBenefits() {
  return <section className={styles.benefits} aria-labelledby="benefits-title">
    <h2 id="benefits-title">What is coming</h2>
    <div>
      <article><MapPin size={24} aria-hidden="true" /><h3>Find Farms &amp; Agri-Suppliers</h3><p>Discover farmers and agricultural businesses across Ghana.</p></article>
      <article><ShoppingBasket size={24} aria-hidden="true" /><h3>Buy &amp; Sell More Clearly</h3><p>Browse produce and tell farmers what buyers need.</p></article>
      <article><MessageCircle size={24} aria-hidden="true" /><h3>Practical Farm Support</h3><p>Use Mama G and specialist farm tools when you need a clear next step.</p></article>
    </div>
  </section>;
}
