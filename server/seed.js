require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

const PRODUCTS = [
  {
    id: "sb-001", name: "Hand-Hammered Seven Metal Singing Bowl", category: "singing-bowls",
    category_label: "Singing Bowls & Spiritual Items", price: 68, compare_at: 82,
    description: "Forged by hand from a traditional seven-metal alloy in a small Patan workshop, this singing bowl produces a deep, resonant tone prized for meditation and sound healing. Comes with a wooden mallet and cotton cushion.",
    origin: "Patan, Nepal", material: "Seven-metal alloy (bronze blend)", dimensions: "5\" diameter, 3\" height",
    shipping: "Ships direct from Nepal, 8-14 days", badge: "Bestseller",
    images: [
      "https://images.pexels.com/photos/3543912/pexels-photo-3543912.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/3544171/pexels-photo-3544171.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "sb-002", name: "Meditation Bowl & Mallet Gift Set", category: "singing-bowls",
    category_label: "Singing Bowls & Spiritual Items", price: 54, compare_at: null,
    description: "A ready-to-gift meditation set featuring a hand-finished brass bowl, a padded striker, and a woven silk cushion. Packaged in a kraft gift box with a note on its Himalayan origins.",
    origin: "Bhaktapur, Nepal", material: "Brass, silk cushion", dimensions: "4\" diameter, 2.5\" height",
    shipping: "Ships direct from Nepal, 8-14 days", badge: "Gift Set",
    images: [
      "https://images.pexels.com/photos/3544322/pexels-photo-3544322.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/6252093/pexels-photo-6252093.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "sb-003", name: "Hand Block-Printed Prayer Flags (Set of 5)", category: "singing-bowls",
    category_label: "Singing Bowls & Spiritual Items", price: 22, compare_at: null,
    description: "Traditional five-color prayer flags printed with mantras and wind-horse symbols, made using hand-carved wooden blocks. A meaningful addition to a garden, balcony, or altar.",
    origin: "Kathmandu Valley, Nepal", material: "Cotton, natural dye", dimensions: "10ft string, 20 flags",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/19558507/pexels-photo-19558507.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/6904727/pexels-photo-6904727.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "sb-004", name: "Om Mandala Wall Tapestry", category: "singing-bowls",
    category_label: "Singing Bowls & Spiritual Items", price: 38, compare_at: null,
    description: "A hand-drawn mandala pattern screen-printed on soft cotton, finished with hand-rolled edges. Doubles as a wall hanging, meditation mat, or picnic throw.",
    origin: "Kathmandu, Nepal", material: "100% cotton", dimensions: "80cm x 80cm",
    shipping: "Ships direct from Nepal, 8-14 days", badge: "New",
    images: [
      "https://images.pexels.com/photos/7181644/pexels-photo-7181644.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/35536122/pexels-photo-35536122.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "sb-005", name: "Brass Buddha Statue, Antique Finish", category: "singing-bowls",
    category_label: "Singing Bowls & Spiritual Items", price: 46, compare_at: null,
    description: "Sand-cast in brass and finished by hand with an antique patina, this seated Buddha figure is a quiet centerpiece for any altar or reading nook.",
    origin: "Patan, Nepal", material: "Cast brass", dimensions: "6\" height",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/2684749/pexels-photo-2684749.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/4324950/pexels-photo-4324950.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "sb-006", name: "Mini Travel Singing Bowl with Pouch", category: "singing-bowls",
    category_label: "Singing Bowls & Spiritual Items", price: 32, compare_at: null,
    description: "A palm-sized singing bowl for travelers, tucked into a hand-stitched cotton pouch. Same seven-metal alloy as our full-size bowls, tuned for a bright, clear ring.",
    origin: "Patan, Nepal", material: "Seven-metal alloy", dimensions: "2.5\" diameter",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/6252093/pexels-photo-6252093.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/3543912/pexels-photo-3543912.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "wm-001", name: "Hand-Carved Wooden Elephant Statue", category: "wood-metal",
    category_label: "Wood & Metal Decor", price: 58, compare_at: null,
    description: "Carved from a single block of sustainably sourced sal wood, this elephant figure carries the fine tool-marks of its maker. A symbol of wisdom and good fortune for the home.",
    origin: "Bhaktapur, Nepal", material: "Sal wood", dimensions: "8\" length, 6\" height",
    shipping: "Ships direct from Nepal, 8-14 days", badge: "Bestseller",
    images: [
      "https://images.pexels.com/photos/166277/pexels-photo-166277.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/7709881/pexels-photo-7709881.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "wm-002", name: "Hand-Carved Wooden Wall Mask", category: "wood-metal",
    category_label: "Wood & Metal Decor", price: 44, compare_at: null,
    description: "A striking wall mask hand-chiseled and finished with a warm oil stain that highlights the wood's natural grain. Ships with a hidden hanging bracket.",
    origin: "Bhaktapur, Nepal", material: "Carved hardwood", dimensions: "10\" height",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/35187492/pexels-photo-35187492.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/166277/pexels-photo-166277.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "wm-003", name: "Repoussé Brass Wall Plate", category: "wood-metal",
    category_label: "Wood & Metal Decor", price: 52, compare_at: null,
    description: "A decorative brass plate hand-embossed using the traditional repoussé technique, where patterns are raised from the reverse side with a hammer and punch.",
    origin: "Kathmandu, Nepal", material: "Hand-embossed brass", dimensions: "10\" diameter",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/3544171/pexels-photo-3544171.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/3543912/pexels-photo-3543912.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "wm-004", name: "Antique-Finish Metal Ganesh Statue", category: "wood-metal",
    category_label: "Wood & Metal Decor", price: 64, compare_at: null,
    description: "Cast in a copper-brass blend and hand-finished with an antique patina, this Ganesh figure is a traditional symbol of new beginnings and removed obstacles.",
    origin: "Patan, Nepal", material: "Cast copper-brass blend", dimensions: "7\" height",
    shipping: "Ships direct from Nepal, 8-14 days", badge: "New",
    images: [
      "https://images.pexels.com/photos/4324950/pexels-photo-4324950.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/2684749/pexels-photo-2684749.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "wm-005", name: "Carved Wooden Jewelry Box", category: "wood-metal",
    category_label: "Wood & Metal Decor", price: 36, compare_at: null,
    description: "A hinged keepsake box hand-carved with a mandala motif on the lid and lined with soft cotton. Made to order by a family workshop of woodworkers in Bhaktapur.",
    origin: "Bhaktapur, Nepal", material: "Carved hardwood, cotton lining", dimensions: "5\" x 3.5\" x 2.5\"",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/18947396/pexels-photo-18947396.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/166277/pexels-photo-166277.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  },
  {
    id: "wm-006", name: "Hand-Forged Brass Incense Holder", category: "wood-metal",
    category_label: "Wood & Metal Decor", price: 28, compare_at: null,
    description: "A slim brass incense holder forged by hand, designed to catch ash in its gently curved base. A quiet, functional piece for a daily ritual.",
    origin: "Kathmandu, Nepal", material: "Hand-forged brass", dimensions: "9\" length",
    shipping: "Ships direct from Nepal, 8-14 days", badge: null,
    images: [
      "https://images.pexels.com/photos/3544171/pexels-photo-3544171.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/3544322/pexels-photo-3544322.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
  }
];

function seed() {
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products
      (id, name, category, category_label, price, compare_at, description, origin, material, dimensions, shipping, badge, images)
    VALUES (@id, @name, @category, @category_label, @price, @compare_at, @description, @origin, @material, @dimensions, @shipping, @badge, @images)
  `);
  const tx = db.transaction((rows) => {
    for (const p of rows) {
      insertProduct.run({ ...p, images: JSON.stringify(p.images) });
    }
  });
  tx(PRODUCTS);
  console.log(`Seeded ${PRODUCTS.length} products (existing rows left untouched).`);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@mandala.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "mandala2026";
  const existing = db.prepare("SELECT id FROM admin_users WHERE email = ?").get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)").run(adminEmail, hash);
    console.log(`Created admin user: ${adminEmail} / ${adminPassword} (change this password after first login!)`);
  } else {
    console.log(`Admin user ${adminEmail} already exists — skipped.`);
  }
}

seed();
