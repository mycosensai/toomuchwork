import { getDb } from "../api/queries/connection";
import { expertProfiles } from "./schema";

async function seedExperts() {
  const db = getDb();
  console.log("Seeding expert profiles...");

  const existing = await db.select().from(expertProfiles);
  if (existing.length > 0) { console.log("Experts already seeded"); return; }

  const experts = [
    { name: "Dr. Helena Van der Berg", title: "Senior Gemologist & Jewelry Historian", institution: "Gemological Institute of Antwerp", location: "Antwerp, Belgium", specialties: ["jewelry", "gemology", "antique_jewelry", "estate_jewelry", "vintage_jewelry"], credentials: "Ph.D. Gemology, GIA Graduate Gemologist, 25 years appraising fine jewelry for Christie's and Sotheby's", yearsExperience: 25, rating: "4.9", reviewCount: 342 },
    { name: "Prof. James Harrington", title: "Numismatic Scholar", institution: "Smithsonian Institution", location: "Washington, DC", specialties: ["numismatics", "coins", "currency", "medals"], credentials: "Ph.D. History, Fellow of the American Numismatic Society, Author of 'Rare Coins of the Americas'", yearsExperience: 30, rating: "5.0", reviewCount: 518 },
    { name: "Dr. Yuki Tanaka", title: "Asian Art & Antiques Specialist", institution: "Tokyo National Museum", location: "Tokyo, Japan", specialties: ["antiques", "fine_art", "asian_art", "porcelain", "jade"], credentials: "Ph.D. Art History, Former curator at Tokyo National Museum, expert in Edo period works", yearsExperience: 22, rating: "4.8", reviewCount: 267 },
    { name: "Marguerite Dubois", title: "Master Horologist", institution: "Patek Philippe Heritage Center", location: "Geneva, Switzerland", specialties: ["watches", "horology", "timepieces", "chronometers"], credentials: "Certified Master Watchmaker, 20 years at Patek Philippe, specialist in complications and vintage pieces", yearsExperience: 20, rating: "5.0", reviewCount: 189 },
    { name: "Dr. Robert Chambers", title: "Sports Memorabilia Authenticator", institution: "PSA/DNA Authentication", location: "Santa Ana, CA", specialties: ["sports", "memorabilia", "autographs", "game_used"], credentials: "Lead Authenticator at PSA/DNA, certified by all major sports leagues, expert in game-worn jerseys and equipment", yearsExperience: 18, rating: "4.9", reviewCount: 423 },
    { name: "Prof. Isabella Romano", title: "Renaissance & Baroque Art Expert", institution: "Uffizi Gallery", location: "Florence, Italy", specialties: ["fine_art", "paintings", "sculptures", "renaissance", "baroque"], credentials: "Ph.D. Art Conservation, Uffizi Gallery Senior Curator, expert in Old Master paintings and provenance research", yearsExperience: 28, rating: "5.0", reviewCount: 156 },
    { name: "Dr. Arthur Pemberton", title: "Rare Books & Manuscripts Specialist", institution: "British Library", location: "London, UK", specialties: ["rare_books", "manuscripts", "bibliography", "incunabula", "first_editions"], credentials: "Ph.D. Bibliography, British Library Rare Books Curator, expert in Shakespeare first folios and medieval manuscripts", yearsExperience: 32, rating: "4.9", reviewCount: 198 },
    { name: "Dr. Mei-Lin Chen", title: "Jade & Asian Decorative Arts Expert", institution: "Palace Museum, Beijing", location: "Beijing, China", specialties: ["antiques", "jade", "asian_art", "decorative_arts", "porcelain"], credentials: "Ph.D. Archaeology, Palace Museum Research Fellow, world's leading expert in jade authentication and dating", yearsExperience: 24, rating: "5.0", reviewCount: 301 },
    { name: "Jean-Pierre Lefevre", title: "French Furniture & Decorative Arts Specialist", institution: "Chateau de Versailles", location: "Versailles, France", specialties: ["antiques", "furniture", "decorative_arts", "giltwood", "marquetry"], credentials: "Conservateur du Patrimoine, former head conservator at Versailles, expert in Louis XIV-XVI furniture", yearsExperience: 27, rating: "4.8", reviewCount: 134 },
    { name: "Dr. Sarah Goldstein", title: "Contemporary & Modern Art Appraiser", institution: "Independent Consultant", location: "New York, NY", specialties: ["fine_art", "paintings", "contemporary_art", "modern_art", "prints"], credentials: "Ph.D. Art History, Columbia University, former head of Contemporary Art at Sotheby's New York", yearsExperience: 19, rating: "4.9", reviewCount: 287 },
    { name: "Dr. Klaus Richter", title: "Arms & Militaria Expert", institution: "Imperial War Museum", location: "London, UK", specialties: ["antiques", "militaria", "arms", "armor", "medals"], credentials: "Ph.D. Military History, Imperial War Museum curator, expert in European and Asian arms and armor", yearsExperience: 21, rating: "4.7", reviewCount: 112 },
    { name: "Aisha Patel", title: "Islamic Art & Persian Miniature Specialist", institution: "Victoria and Albert Museum", location: "London, UK", specialties: ["fine_art", "islamic_art", "persian_art", "miniatures", "textiles"], credentials: "MA Islamic Art, V&A Senior Curator, expert in Persian miniatures, Islamic calligraphy, and Ottoman textiles", yearsExperience: 16, rating: "4.8", reviewCount: 89 },
  ];

  await db.insert(expertProfiles).values(experts);
  console.log(`${experts.length} expert profiles seeded!`);
}

seedExperts().catch(console.error);
