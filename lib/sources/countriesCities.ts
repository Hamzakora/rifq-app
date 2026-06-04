export type CountryCities = {
  country: string;
  countryAr: string;
  cities: { city: string; cityAr: string }[];
};

export const countryCities: CountryCities[] = [
  { country: "Egypt", countryAr: "مصر", cities: [
    { city: "Cairo", cityAr: "القاهرة" }, { city: "Alexandria", cityAr: "الإسكندرية" },
    { city: "Giza", cityAr: "الجيزة" }, { city: "Mansoura", cityAr: "المنصورة" },
    { city: "Tanta", cityAr: "طنطا" }, { city: "Damanhur", cityAr: "دمنهور" },
    { city: "Asyut", cityAr: "أسيوط" }, { city: "Aswan", cityAr: "أسوان" },
    { city: "Luxor", cityAr: "الأقصر" }, { city: "Port Said", cityAr: "بورسعيد" }
  ]},
  { country: "Saudi Arabia", countryAr: "السعودية", cities: [
    { city: "Riyadh", cityAr: "الرياض" }, { city: "Jeddah", cityAr: "جدة" },
    { city: "Mecca", cityAr: "مكة" }, { city: "Medina", cityAr: "المدينة" },
    { city: "Dammam", cityAr: "الدمام" }, { city: "Tabuk", cityAr: "تبوك" }
  ]},
  { country: "United Arab Emirates", countryAr: "الإمارات", cities: [
    { city: "Dubai", cityAr: "دبي" }, { city: "Abu Dhabi", cityAr: "أبوظبي" },
    { city: "Sharjah", cityAr: "الشارقة" }, { city: "Ajman", cityAr: "عجمان" }
  ]},
  { country: "Kuwait", countryAr: "الكويت", cities: [
    { city: "Kuwait City", cityAr: "مدينة الكويت" }, { city: "Hawalli", cityAr: "حولي" }
  ]},
  { country: "Qatar", countryAr: "قطر", cities: [
    { city: "Doha", cityAr: "الدوحة" }, { city: "Al Rayyan", cityAr: "الريان" }
  ]},
  { country: "Bahrain", countryAr: "البحرين", cities: [
    { city: "Manama", cityAr: "المنامة" }, { city: "Muharraq", cityAr: "المحرق" }
  ]},
  { country: "Oman", countryAr: "عُمان", cities: [
    { city: "Muscat", cityAr: "مسقط" }, { city: "Salalah", cityAr: "صلالة" }
  ]},
  { country: "Jordan", countryAr: "الأردن", cities: [
    { city: "Amman", cityAr: "عمّان" }, { city: "Irbid", cityAr: "إربد" }, { city: "Zarqa", cityAr: "الزرقاء" }
  ]},
  { country: "Palestine", countryAr: "فلسطين", cities: [
    { city: "Jerusalem", cityAr: "القدس" }, { city: "Gaza", cityAr: "غزة" }, { city: "Ramallah", cityAr: "رام الله" }
  ]},
  { country: "Lebanon", countryAr: "لبنان", cities: [
    { city: "Beirut", cityAr: "بيروت" }, { city: "Tripoli", cityAr: "طرابلس" }
  ]},
  { country: "Syria", countryAr: "سوريا", cities: [
    { city: "Damascus", cityAr: "دمشق" }, { city: "Aleppo", cityAr: "حلب" }, { city: "Homs", cityAr: "حمص" }
  ]},
  { country: "Iraq", countryAr: "العراق", cities: [
    { city: "Baghdad", cityAr: "بغداد" }, { city: "Basra", cityAr: "البصرة" }, { city: "Mosul", cityAr: "الموصل" }
  ]},
  { country: "Morocco", countryAr: "المغرب", cities: [
    { city: "Rabat", cityAr: "الرباط" }, { city: "Casablanca", cityAr: "الدار البيضاء" }, { city: "Marrakesh", cityAr: "مراكش" }
  ]},
  { country: "Algeria", countryAr: "الجزائر", cities: [
    { city: "Algiers", cityAr: "الجزائر" }, { city: "Oran", cityAr: "وهران" }, { city: "Constantine", cityAr: "قسنطينة" }
  ]},
  { country: "Tunisia", countryAr: "تونس", cities: [
    { city: "Tunis", cityAr: "تونس" }, { city: "Sfax", cityAr: "صفاقس" }, { city: "Sousse", cityAr: "سوسة" }
  ]},
  { country: "Libya", countryAr: "ليبيا", cities: [
    { city: "Tripoli", cityAr: "طرابلس" }, { city: "Benghazi", cityAr: "بنغازي" }
  ]},
  { country: "Sudan", countryAr: "السودان", cities: [
    { city: "Khartoum", cityAr: "الخرطوم" }, { city: "Omdurman", cityAr: "أم درمان" }
  ]},
  { country: "Turkey", countryAr: "تركيا", cities: [
    { city: "Istanbul", cityAr: "إسطنبول" }, { city: "Ankara", cityAr: "أنقرة" }, { city: "Izmir", cityAr: "إزمير" }
  ]},
  { country: "United States", countryAr: "أمريكا", cities: [
    { city: "New York", cityAr: "نيويورك" }, { city: "Los Angeles", cityAr: "لوس أنجلوس" },
    { city: "Chicago", cityAr: "شيكاغو" }, { city: "Houston", cityAr: "هيوستن" }
  ]},
  { country: "United Kingdom", countryAr: "بريطانيا", cities: [
    { city: "London", cityAr: "لندن" }, { city: "Manchester", cityAr: "مانشستر" }, { city: "Birmingham", cityAr: "برمنغهام" }
  ]},
  { country: "France", countryAr: "فرنسا", cities: [
    { city: "Paris", cityAr: "باريس" }, { city: "Marseille", cityAr: "مارسيليا" }, { city: "Lyon", cityAr: "ليون" }
  ]},
  { country: "Germany", countryAr: "ألمانيا", cities: [
    { city: "Berlin", cityAr: "برلين" }, { city: "Munich", cityAr: "ميونخ" }, { city: "Frankfurt", cityAr: "فرانكفورت" }
  ]},
  { country: "Canada", countryAr: "كندا", cities: [
    { city: "Toronto", cityAr: "تورونتو" }, { city: "Montreal", cityAr: "مونتريال" }, { city: "Vancouver", cityAr: "فانكوفر" }
  ]},
  { country: "Australia", countryAr: "أستراليا", cities: [
    { city: "Sydney", cityAr: "سيدني" }, { city: "Melbourne", cityAr: "ملبورن" }, { city: "Brisbane", cityAr: "بريزبن" }
  ]},
  { country: "India", countryAr: "الهند", cities: [
    { city: "New Delhi", cityAr: "نيودلهي" }, { city: "Mumbai", cityAr: "مومباي" }, { city: "Hyderabad", cityAr: "حيدر آباد" }
  ]},
  { country: "Pakistan", countryAr: "باكستان", cities: [
    { city: "Islamabad", cityAr: "إسلام آباد" }, { city: "Karachi", cityAr: "كراتشي" }, { city: "Lahore", cityAr: "لاهور" }
  ]},
  { country: "Indonesia", countryAr: "إندونيسيا", cities: [
    { city: "Jakarta", cityAr: "جاكرتا" }, { city: "Surabaya", cityAr: "سورابايا" }
  ]},
  { country: "Malaysia", countryAr: "ماليزيا", cities: [
    { city: "Kuala Lumpur", cityAr: "كوالالمبور" }, { city: "George Town", cityAr: "جورج تاون" }
  ]}
];
