import { db, initDatabase } from "./db.js";

export function seedData(reset = true): void {
  initDatabase();

  if (reset) {
    db.exec(`
      DELETE FROM dismissed_matches;
      DELETE FROM reports;
      DELETE FROM sqlite_sequence WHERE name IN ('reports', 'dismissed_matches');
    `);
  } else {
    const count = (db.prepare("SELECT COUNT(*) as count FROM reports").get() as { count: number }).count;
    if (count > 0) {
      console.log(`Database already initialized with ${count} reports; skipping duplicate seed.`);
      return;
    }
  }

  const insertReport = db.prepare(`
    INSERT INTO reports (
      type, title, category, subcategory, color, location,
      event_date, event_time, brand, description, distinguishing_features, status
    ) VALUES (
      @type, @title, @category, @subcategory, @color, @location,
      @event_date, @event_time, @brand, @description, @distinguishing_features, @status
    )
  `);

  const reports = [
    // 1. AirPods case lost/found pair (Strong match)
    {
      type: "lost",
      title: "Black AirPods Pro Case",
      category: "electronics",
      subcategory: "earbud_case",
      color: "black",
      location: "cafeteria",
      event_date: "2026-11-10",
      event_time: "12:30",
      brand: "Apple",
      description: "Matte black silicone protective case with small scratch on the hinge",
      distinguishing_features: "Small carabiner clip attached to the side loop",
      status: "open",
    },
    {
      type: "found",
      title: "Apple AirPods Charging Case",
      category: "electronics",
      subcategory: "wireless_earbuds",
      color: "black",
      location: "coffee_shop",
      event_date: "2026-11-11",
      event_time: "14:15",
      brand: "Apple",
      description: "Black wireless earbuds case found under coffee shop seating",
      distinguishing_features: "Has a black carabiner clip ring",
      status: "open",
    },

    // 2. Backpack lost/found pair (Strong match)
    {
      type: "lost",
      title: "North Face Borealis Backpack",
      category: "bags",
      subcategory: "backpack",
      color: "black",
      location: "library",
      event_date: "2026-11-12",
      event_time: "16:00",
      brand: "The North Face",
      description: "Black classic backpack with front bungee cords and mesh pockets",
      distinguishing_features: "Yellow ribbon tag attached to internal zipper",
      status: "open",
    },
    {
      type: "found",
      title: "Black The North Face Backpack",
      category: "bags",
      subcategory: "backpack",
      color: "black",
      location: "library_entrance",
      event_date: "2026-11-13",
      event_time: "09:00",
      brand: "The North Face",
      description: "Found black North Face backpack near turnstiles at opening",
      distinguishing_features: "Yellow ribbon tag inside front compartment",
      status: "open",
    },

    // 3. Wallet with incomplete information (Missing color -> reduced coverage)
    {
      type: "lost",
      title: "Leather Bifold Wallet",
      category: "personal_items",
      subcategory: "wallet",
      color: null, // Incomplete information demonstration
      location: "study_hall",
      event_date: "2026-11-14",
      event_time: "18:00",
      brand: null,
      description: "Lost leather wallet containing university student ID card",
      distinguishing_features: null,
      status: "open",
    },
    {
      type: "found",
      title: "Brown Leather Bifold Wallet",
      category: "personal_items",
      subcategory: "wallet",
      color: "brown",
      location: "main_building",
      event_date: "2026-11-15",
      event_time: "10:30",
      brand: "Fossil",
      description: "Leather wallet handed into main building desk with student cards inside",
      distinguishing_features: "Brown stitching on corners",
      status: "open",
    },

    // 4. Similar items reported at different locations & distant times
    {
      type: "lost",
      title: "Blue Stainless Water Bottle",
      category: "personal_items",
      subcategory: "accessories",
      color: "blue",
      location: "gymnasium",
      event_date: "2026-11-04",
      event_time: "19:00",
      brand: "Hydro Flask",
      description: "Blue 32oz wide mouth insulated bottle",
      distinguishing_features: "Campus stickers on bottle",
      status: "open",
    },
    {
      type: "found",
      title: "Navy Sports Bottle",
      category: "personal_items",
      subcategory: "accessories",
      color: "navy",
      location: "dormitory",
      event_date: "2026-11-15",
      event_time: "21:00",
      brand: "Hydro Flask",
      description: "Navy blue insulated flask found in residential lounge",
      distinguishing_features: null,
      status: "open",
    },

    // 5. Unrelated categories (Incompatible)
    {
      type: "lost",
      title: "Dell XPS 15 Laptop",
      category: "electronics",
      subcategory: "laptop",
      color: "silver",
      location: "library",
      event_date: "2026-11-12",
      event_time: "15:00",
      brand: "Dell",
      description: "Silver aluminum 15-inch laptop with charger",
      distinguishing_features: "CS department asset sticker on bottom",
      status: "open",
    },
    {
      type: "found",
      title: "Set of Dormitory Keys",
      category: "personal_items",
      subcategory: "keys",
      color: "silver",
      location: "library",
      event_date: "2026-11-12",
      event_time: "17:00",
      brand: null,
      description: "Three silver keys on a circular brass ring",
      distinguishing_features: "Room number 204 etched",
      status: "open",
    },

    // 6. Dismissed match demonstration pair
    {
      type: "lost",
      title: "Grey Felt Laptop Sleeve",
      category: "bags",
      subcategory: "laptop_bag",
      color: "gray",
      location: "library",
      event_date: "2026-11-08",
      event_time: "11:00",
      brand: "Incase",
      description: "Grey zipped sleeve for 13 inch notebook",
      distinguishing_features: null,
      status: "open",
    },
    {
      type: "found",
      title: "Gray Canvas Laptop Bag",
      category: "bags",
      subcategory: "laptop_bag",
      color: "gray",
      location: "study_hall",
      event_date: "2026-11-09",
      event_time: "13:00",
      brand: "Tomtoc",
      description: "Gray laptop shoulder bag with front pocket",
      distinguishing_features: null,
      status: "open",
    },

    // 7. Claimed report demonstration pair
    {
      type: "lost",
      title: "Sony WH-1000XM4 Wireless Headphones",
      category: "electronics",
      subcategory: "headphones",
      color: "black",
      location: "main_building",
      event_date: "2026-11-02",
      event_time: "14:00",
      brand: "Sony",
      description: "Black over-ear noise cancelling headphones in zip case",
      distinguishing_features: "Small scratch on left earcup",
      status: "claimed", // Claimed
    },
    {
      type: "found",
      title: "Black Sony Over-Ear Headphones",
      category: "electronics",
      subcategory: "headphones",
      color: "black",
      location: "main_building",
      event_date: "2026-11-03",
      event_time: "08:30",
      brand: "Sony",
      description: "Found black Sony headphones in lecture room 101",
      distinguishing_features: "Inside matching black zip case",
      status: "claimed", // Claimed
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertReport.run(item);
    }
  });

  insertMany(reports);

  // Retrieve IDs for pair 6 to insert into dismissed_matches
  const lost6 = db.prepare("SELECT id FROM reports WHERE title = 'Grey Felt Laptop Sleeve'").get() as { id: number };
  const found6 = db.prepare("SELECT id FROM reports WHERE title = 'Gray Canvas Laptop Bag'").get() as { id: number };

  if (lost6 && found6) {
    db.prepare(`
      INSERT OR IGNORE INTO dismissed_matches (lost_report_id, found_report_id)
      VALUES (?, ?)
    `).run(lost6.id, found6.id);
  }

  console.log(`Database seeded with ${reports.length} reports and 1 dismissed match.`);
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith("seed.ts")) {
  seedData(true);
}
