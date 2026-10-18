export type TeamTheme = {
  navBackground: { name: string; hex: string };
  navHighlight: { name: string; hex: string };
  navText: { name: string; hex: string };
};

export const nflThemes: Record<string, TeamTheme> = {
  ARI: { 
    navBackground: { name: "Cardinal Red", hex: "#97233F" },
    navHighlight: { name: "Black", hex: "#000000" }, 
    navText: { name: "White", hex: "#FFB612" } 
  },
  ATL: { 
    navBackground: { name: "Red", hex: "#A71930" }, 
    navHighlight: { name: "Black", hex: "#000000" }, 
    navText: { name: "Silver", hex: "#a5acaf" } 
  },
  BAL: { 
    navBackground: { name: "Purple", hex: "#241773" }, 
    navHighlight: { name: "Black", hex: "#9E7C0C" }, 
    navText: { name: "Metallic Gold", hex: "#FFFFFF" } 
  },
  BUF: { 
    navBackground: { name: "Royal Blue", hex: "#00338D" }, 
    navHighlight: { name: "Red", hex: "#C60C30" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  CAR: { 
    navBackground: { name: "Process Blue", hex: "#0085CA" }, 
    navHighlight: { name: "Black", hex: "#101820" }, 
    navText: { name: "Silver", hex: "#BFC0BF" } 
  },
  CHI: { 
    navBackground: { name: "Navy Blue", hex: "#00133F" }, 
    navHighlight: { name: "Orange", hex: "#C83803" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  CIN: { 
    navBackground: { name: "Orange", hex: "#FB4F14" }, 
    navHighlight: { name: "Black", hex: "#000000" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  CLE: { 
    navBackground: { name: "Brown", hex: "#311D00" }, 
    navHighlight: { name: "Orange", hex: "#FF3C00" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  DAL: { 
    navBackground: { name: "Navy Blue", hex: "#003594" }, 
    navHighlight: { name: "Silver", hex: "#7F9695" }, 
    navText: { name: "Royal Blue", hex: "#FFFFFF" } 
  },
  DEN: { 
    navBackground: { name: "Broncos Orange", hex: "#FB4F14" }, 
    navHighlight: { name: "Broncos Navy", hex: "#002244" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  DET: { 
    navBackground: { name: "Honolulu Blue", hex: "#0076B6" }, 
    navHighlight: { name: "Silver", hex: "#B0B7BC" }, 
    navText: { name: "Black", hex: "#000000" } 
  },
  GB: { 
    navBackground: { name: "Dark Green", hex: "#203731" }, 
    navHighlight: { name: "Gold", hex: "#FFB612" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  HOU: { 
    navBackground: { name: "Deep Steel Blue", hex: "#03202F" }, 
    navHighlight: { name: "Battle Red", hex: "#A71930" }, 
    navText: { name: "Liberty White", hex: "#FFFFFF" } 
  },
  IND: { 
    navBackground: { name: "Speed Blue", hex: "#002C5F" }, 
    navHighlight: { name: "White", hex: "#FFFFFF" }, 
    navText: { name: "Anvil Gray", hex: "#A2AAAD" } 
  },
  JAX: { 
    navBackground: { name: "Teal", hex: "#006778" }, 
    navHighlight: { name: "Black", hex: "#D7A22A" }, 
    navText: { name: "Gold", hex: "#101820" } 
  },
  KC: { 
    navBackground: { name: "Red", hex: "#E31837" }, 
    navHighlight: { name: "Gold", hex: "#FFB81C" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  LV: { 
    navBackground: { name: "Silver", hex: "#A5ACAF" }, 
    navHighlight: { name: "Black", hex: "#000000" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  LAC: { 
    navBackground: { name: "Powder Blue", hex: "#0080C6" }, 
    navHighlight: { name: "Sunshine Gold", hex: "#FFC20E" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  LAR: { 
    navBackground: { name: "Royal Blue", hex: "#003594" }, 
    navHighlight: { name: "Sol", hex: "#FFA300" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  MIA: { 
    navBackground: { name: "Aqua", hex: "#008E97" }, 
    navHighlight: { name: "Orange", hex: "#FC4C02" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  MIN: { 
    navBackground: { name: "Purple", hex: "#4F2683" }, 
    navHighlight: { name: "Gold", hex: "#FFC62F" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  NE: { 
    navBackground: { name: "Nautical Blue", hex: "#002244" }, 
    navHighlight: { name: "Red", hex: "#C60C30" }, 
    navText: { name: "New Century Silver", hex: "#B0B7BC" } 
  },
  NO: { 
    navBackground: { name: "Old Gold", hex: "#D3BC8D" }, 
    navHighlight: { name: "Black", hex: "#101820" }, 
    navText: { name: "White", hex: "#101820" } 
  },
  NYG: { 
    navBackground: { name: "Dark Blue", hex: "#0B2265" }, 
    navHighlight: { name: "Red", hex: "#A71930" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  NYJ: { 
    navBackground: { name: "Gotham Green", hex: "#125740" }, 
    navHighlight: { name: "Spotlight White", hex: "#000000" }, 
    navText: { name: "Stealth Black", hex: "#FFFFFF" } 
  },
  PHI: { 
    navBackground: { name: "Midnight Green", hex: "#004C54" }, 
    navHighlight: { name: "Silver", hex: "#A5ACAF" }, 
    navText: { name: "Black", hex: "#A5ACAF" } 
  },
  PIT: { 
    navBackground: { name: "Black", hex: "#101820" }, 
    navHighlight: { name: "Gold", hex: "#FFB612" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  SF: { 
    navBackground: { name: "49ers Red", hex: "#AA0000" }, 
    navHighlight: { name: "Gold", hex: "#B3995D" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  },
  SEA: { 
    navBackground: { name: "College Navy", hex: "#002244" }, 
    navHighlight: { name: "Action Green", hex: "#69BE28" }, 
    navText: { name: "Wolf Grey", hex: "#A5ACAF" } 
  },
  TB: { 
    navBackground: { name: "Buccaneer Red", hex: "#D50A0A" }, 
    navHighlight: { name: "Pewter", hex: "#34302B" }, 
    navText: { name: "Black", hex: "#000000" } 
  },
  TEN: { 
    navBackground: { name: "Navy", hex: "#0C2340" }, 
    navHighlight: { name: "Titans Blue", hex: "#4B92DB" }, 
    navText: { name: "Red", hex: "#C8102E" } 
  },
  WAS : { 
    navBackground: { name: "Burgundy", hex: "#5A1414" }, 
    navHighlight: { name: "Gold", hex: "#FFB612" }, 
    navText: { name: "White", hex: "#FFFFFF" } 
  }
};