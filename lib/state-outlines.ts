export type StateOutline = {
  path: string
  viewBox: string
  center: [number, number]
}

export const STATE_OUTLINES: Record<string, StateOutline> = {
  // Alabama - tall rectangle with a small notch at bottom-left (Mobile Bay) and small panhandle area at top
  'AL': {
    path: 'M15 5 L80 5 L82 8 L80 12 L80 105 L75 108 L55 115 L50 112 L45 115 L15 115 L15 5 Z',
    viewBox: '0 0 95 120',
    center: [48, 58],
  },

  // Alaska - large irregular mass with panhandle going southeast, Aleutian chain below
  'AK': {
    path: 'M5 55 L10 45 L18 35 L28 25 L40 18 L52 12 L65 8 L78 10 L88 16 L95 25 L92 35 L85 42 L75 45 L65 42 L55 48 L45 52 L35 50 L25 55 L15 60 L8 62 Z M5 75 L12 70 L20 72 L22 78 L15 82 L8 80 Z M25 78 L32 74 L38 78 L35 84 L28 82 Z M42 76 L48 72 L52 76 L48 80 Z',
    viewBox: '0 0 100 90',
    center: [52, 32],
  },

  // Arizona - nearly rectangular but with a notch cut from the top-left (Four Corners area gives it a step)
  'AZ': {
    path: 'M5 18 L28 5 L35 10 L40 5 L80 5 L80 115 L5 115 L5 85 L12 72 L5 55 Z',
    viewBox: '0 0 85 120',
    center: [42, 60],
  },

  // Arkansas - roughly rectangular, slightly wider at top, notched southeastern corner
  'AR': {
    path: 'M8 8 L88 5 L92 12 L88 22 L92 32 L88 42 L90 52 L92 62 L88 72 L85 82 L8 85 L5 75 L8 60 L5 45 L8 30 L5 18 Z',
    viewBox: '0 0 97 90',
    center: [48, 45],
  },

  // California - long coastal state, narrow, curving inward then bulging at bottom
  'CA': {
    path: 'M60 5 L75 5 L88 12 L95 22 L90 32 L82 38 L75 48 L68 55 L60 62 L52 72 L48 80 L50 88 L55 92 L52 100 L45 110 L38 115 L28 112 L22 102 L18 90 L12 75 L8 60 L5 48 L10 35 L18 25 L28 15 L42 8 Z',
    viewBox: '0 0 100 120',
    center: [42, 55],
  },

  // Colorado - perfect rectangle
  'CO': {
    path: 'M5 5 L95 5 L95 72 L5 72 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },

  // Connecticut - small, roughly rectangular, wider on east, with coast on south
  'CT': {
    path: 'M5 8 L85 5 L90 15 L88 28 L82 38 L72 48 L60 55 L5 55 Z',
    viewBox: '0 0 95 60',
    center: [45, 28],
  },

  // Delaware - very small, narrow, shaped like a slightly curved finger pointing south
  'DE': {
    path: 'M25 5 L65 5 L70 15 L75 28 L78 42 L72 58 L62 72 L50 85 L38 92 L30 85 L28 68 L25 48 L22 28 Z',
    viewBox: '0 0 100 97',
    center: [50, 45],
  },

  // Florida - distinctive panhandle going west, then peninsula going south
  'FL': {
    path: 'M5 5 L85 5 L92 10 L95 20 L88 28 L82 25 L78 28 L78 38 L74 50 L68 62 L62 72 L56 82 L50 92 L45 100 L40 108 L35 112 L30 108 L28 98 L25 88 L20 78 L15 68 L10 55 L5 40 L8 28 L15 22 L18 15 L5 12 Z',
    viewBox: '0 0 100 118',
    center: [42, 40],
  },

  // Georgia - tall, wide at top, narrowing to bottom, with a notch at southeast coast
  'GA': {
    path: 'M12 5 L85 5 L88 12 L85 22 L82 35 L78 50 L72 65 L68 78 L62 88 L55 98 L48 108 L42 112 L38 108 L32 98 L28 85 L22 70 L18 55 L15 38 L12 20 Z',
    viewBox: '0 0 100 118',
    center: [50, 52],
  },

  // Hawaii - chain of islands from southeast (Big Island) to northwest
  'HI': {
    path: 'M5 68 L10 62 L15 65 L12 72 L7 73 Z M22 55 L30 48 L38 52 L34 60 L25 60 Z M42 38 L52 32 L60 35 L56 45 L46 46 L40 42 Z M65 22 L76 16 L86 15 L94 20 L96 28 L92 36 L82 38 L72 34 L66 28 Z',
    viewBox: '0 0 100 80',
    center: [55, 38],
  },

  // Idaho - panhandle at top (narrow), wide at bottom, looks like an "L" or boot
  'ID': {
    path: 'M30 5 L50 5 L55 12 L62 18 L55 28 L52 35 L58 40 L68 38 L78 35 L82 42 L78 52 L75 65 L78 78 L78 115 L18 115 L18 82 L15 68 L18 52 L22 40 L18 28 L22 18 L28 10 Z',
    viewBox: '0 0 95 120',
    center: [48, 68],
  },

  // Illinois - tall, wider at south, pointy southern tip
  'IL': {
    path: 'M22 5 L72 5 L78 12 L78 22 L75 32 L72 42 L70 52 L68 62 L65 72 L60 82 L55 88 L48 95 L42 100 L35 105 L28 108 L22 102 L20 92 L25 82 L28 72 L28 58 L22 42 L18 28 L18 15 Z',
    viewBox: '0 0 95 112',
    center: [48, 50],
  },

  // Indiana - roughly rectangular, narrower at bottom
  'IN': {
    path: 'M15 5 L82 5 L82 18 L80 32 L78 48 L75 62 L72 78 L68 88 L58 98 L48 105 L38 100 L30 90 L25 78 L20 62 L18 45 L15 28 L15 15 Z',
    viewBox: '0 0 95 110',
    center: [48, 50],
  },

  // Iowa - wider at top, rounded bottom, slightly irregular
  'IA': {
    path: 'M5 18 L18 8 L78 5 L92 12 L95 22 L90 32 L85 38 L85 52 L88 62 L82 72 L78 78 L12 78 L5 68 L8 55 L5 42 L8 30 Z',
    viewBox: '0 0 100 83',
    center: [50, 40],
  },

  // Kansas - nearly rectangular, very slightly wider at east
  'KS': {
    path: 'M5 12 L12 5 L95 5 L95 72 L5 72 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },

  // Kentucky - very wide, thin, irregular. Shaped like a bone/strip, pointed on west end
  'KY': {
    path: 'M5 38 L12 28 L22 22 L35 15 L48 10 L60 5 L72 8 L82 5 L92 8 L95 18 L92 28 L88 35 L82 42 L72 48 L62 52 L50 55 L38 58 L28 60 L18 58 L10 52 L5 45 Z',
    viewBox: '0 0 100 65',
    center: [50, 32],
  },

  // Louisiana - boot shape with ragged coastal edge at bottom
  'LA': {
    path: 'M8 5 L82 5 L82 52 L85 58 L90 62 L92 68 L88 72 L82 70 L78 75 L72 78 L68 75 L62 80 L58 82 L52 78 L48 72 L45 75 L40 78 L35 75 L38 68 L42 62 L38 58 L32 62 L28 65 L22 62 L18 68 L12 65 L8 58 Z',
    viewBox: '0 0 97 88',
    center: [42, 35],
  },

  // Maine - tall, irregular, with rocky coast, wider at bottom, pointy top right
  'ME': {
    path: 'M35 108 L30 95 L25 82 L22 68 L18 55 L15 42 L18 30 L25 20 L35 12 L45 5 L55 8 L65 15 L72 22 L78 18 L82 22 L78 32 L72 38 L65 35 L60 40 L55 52 L52 62 L52 72 L55 82 L55 92 L50 102 L42 108 Z',
    viewBox: '0 0 90 112',
    center: [42, 55],
  },

  // Maryland - very irregular, thin, with Chesapeake Bay cutting into center
  'MD': {
    path: 'M5 28 L18 22 L32 15 L48 10 L65 5 L80 8 L95 15 L90 22 L82 28 L72 25 L65 30 L58 35 L52 38 L48 32 L42 38 L38 42 L32 38 L28 42 L22 40 L18 45 L12 42 L8 38 L5 35 Z',
    viewBox: '0 0 100 50',
    center: [50, 25],
  },

  // Massachusetts - small, wide, with Cape Cod hook on right side
  'MA': {
    path: 'M5 22 L22 18 L42 12 L62 8 L78 5 L88 8 L95 15 L90 20 L85 18 L80 22 L82 28 L88 32 L85 38 L78 35 L70 30 L62 32 L52 30 L40 35 L28 38 L18 35 L10 32 L5 28 Z',
    viewBox: '0 0 100 42',
    center: [42, 22],
  },

  // Michigan - two peninsulas. Upper (smaller, horizontal) and Lower (mitten shape)
  'MI': {
    path: 'M28 42 L35 35 L42 30 L52 28 L62 30 L70 35 L75 42 L78 52 L78 65 L72 78 L65 88 L55 95 L45 98 L38 92 L32 82 L28 70 L25 58 L28 48 Z M12 5 L28 5 L38 10 L48 15 L52 22 L48 28 L38 30 L28 25 L22 18 L15 10 Z',
    viewBox: '0 0 90 102',
    center: [52, 62],
  },

  // Minnesota - tall rectangle with angular notch at top (Northwest Angle) and NE point (Arrowhead)
  'MN': {
    path: 'M18 5 L42 5 L52 8 L58 5 L78 5 L82 15 L88 25 L92 38 L88 52 L82 68 L82 80 L85 88 L82 98 L78 108 L12 108 L8 95 L8 78 L12 62 L15 48 L10 35 L15 22 L18 12 Z',
    viewBox: '0 0 97 112',
    center: [48, 55],
  },

  // Mississippi - tall, slightly wider at top, ragged bottom coast
  'MS': {
    path: 'M18 5 L78 5 L78 92 L74 98 L68 102 L62 108 L55 112 L48 115 L42 112 L38 108 L32 112 L28 108 L22 102 L18 92 Z',
    viewBox: '0 0 95 118',
    center: [48, 55],
  },

  // Missouri - wide, bootheel sticking down at SE corner
  'MO': {
    path: 'M5 12 L18 5 L82 5 L95 12 L92 25 L88 38 L90 52 L88 62 L82 72 L78 78 L82 88 L82 95 L72 95 L68 85 L62 82 L52 80 L42 78 L32 75 L22 70 L15 62 L10 52 L5 38 L8 25 Z',
    viewBox: '0 0 100 100',
    center: [48, 42],
  },

  // Montana - wide rectangle, irregular southern border
  'MT': {
    path: 'M5 22 L12 10 L22 5 L92 5 L95 72 L5 72 L5 55 L10 45 L5 35 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },

  // Nebraska - roughly trapezoidal, wider on east, with river-carved north border
  'NE': {
    path: 'M5 22 L12 12 L22 5 L92 5 L95 28 L90 42 L82 55 L72 65 L58 72 L42 72 L28 68 L18 62 L8 52 L5 38 Z',
    viewBox: '0 0 100 77',
    center: [50, 35],
  },

  // Nevada - shaped like a cleaver/wedge - flat top and left, angled right side going to a point at bottom
  'NV': {
    path: 'M5 5 L68 5 L92 112 L82 115 L5 42 Z',
    viewBox: '0 0 97 120',
    center: [38, 42],
  },

  // New Hampshire - tall, narrow, wider at south, pointy at north
  'NH': {
    path: 'M28 108 L25 92 L22 78 L22 62 L25 45 L28 32 L32 18 L38 8 L45 5 L55 8 L62 15 L65 25 L58 30 L52 28 L48 35 L45 48 L42 60 L45 72 L42 85 L38 98 L32 105 Z',
    viewBox: '0 0 75 112',
    center: [40, 55],
  },

  // New Jersey - shaped like a slightly curved letter form, wider at top than bottom
  'NJ': {
    path: 'M32 5 L58 5 L68 12 L70 22 L65 32 L60 42 L55 52 L52 62 L55 72 L58 80 L52 90 L45 100 L38 105 L32 98 L30 88 L32 78 L35 68 L32 55 L30 42 L28 28 L30 15 Z',
    viewBox: '0 0 80 110',
    center: [48, 52],
  },

  // New Mexico - nearly rectangular with a small step notch at SW corner
  'NM': {
    path: 'M5 5 L82 5 L82 12 L88 15 L82 18 L82 108 L5 108 Z',
    viewBox: '0 0 93 113',
    center: [44, 55],
  },

  // New York - irregular, Long Island extending east, wider at west end
  'NY': {
    path: 'M5 52 L12 42 L22 35 L35 28 L48 22 L62 18 L75 12 L85 8 L92 5 L95 12 L90 22 L85 28 L80 32 L78 38 L82 42 L88 40 L92 45 L88 48 L80 50 L72 52 L65 55 L55 58 L45 55 L35 52 L25 55 L15 58 L8 55 Z',
    viewBox: '0 0 100 63',
    center: [52, 35],
  },

  // North Carolina - very wide and thin, with Outer Banks bumps on east coast
  'NC': {
    path: 'M5 22 L15 12 L30 8 L50 5 L70 5 L82 8 L92 12 L95 18 L92 25 L88 28 L92 32 L95 38 L88 42 L78 40 L68 42 L55 45 L42 48 L30 50 L18 48 L10 42 L5 35 Z',
    viewBox: '0 0 100 55',
    center: [48, 25],
  },

  // North Dakota - nearly rectangular, slightly irregular south border
  'ND': {
    path: 'M5 12 L15 5 L92 5 L95 72 L5 72 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },

  // Ohio - shaped like a heart/irregular rectangle, with NE corner pointing up (Erie coast)
  'OH': {
    path: 'M15 5 L38 5 L52 8 L68 5 L78 10 L82 20 L80 32 L78 45 L75 58 L72 72 L65 82 L55 90 L45 92 L35 88 L28 78 L22 65 L18 52 L15 38 L12 22 Z',
    viewBox: '0 0 90 97',
    center: [48, 45],
  },

  // Oklahoma - panhandle on the west (long rectangle), wider body on east
  'OK': {
    path: 'M5 28 L5 5 L35 5 L35 28 L92 28 L95 38 L92 52 L88 62 L82 70 L72 78 L60 82 L48 78 L38 72 L28 65 L18 55 L10 42 Z',
    viewBox: '0 0 100 87',
    center: [55, 48],
  },

  // Oregon - wide, with irregular coast on west and straight borders elsewhere
  'OR': {
    path: 'M5 28 L12 15 L22 8 L38 5 L55 5 L72 8 L88 5 L95 12 L95 72 L5 72 L5 58 L10 48 L5 38 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },

  // Pennsylvania - wide rectangle, slightly irregular at SE corner
  'PA': {
    path: 'M5 8 L88 5 L92 10 L95 22 L90 32 L85 38 L78 40 L72 38 L68 42 L62 48 L5 48 Z',
    viewBox: '0 0 100 53',
    center: [48, 25],
  },

  // Rhode Island - tiny, roughly rectangular with Narragansett Bay indentation
  'RI': {
    path: 'M15 5 L55 5 L68 15 L72 28 L65 42 L55 52 L42 58 L32 55 L22 45 L18 32 L15 18 Z',
    viewBox: '0 0 82 63',
    center: [42, 30],
  },

  // South Carolina - triangular, wider at west, narrowing to coast at east
  'SC': {
    path: 'M5 8 L22 5 L42 5 L58 8 L72 15 L82 25 L92 38 L88 52 L78 62 L65 68 L50 72 L38 68 L28 58 L18 45 L12 32 L5 20 Z',
    viewBox: '0 0 97 77',
    center: [48, 35],
  },

  // South Dakota - nearly rectangular with irregular east border (Missouri River valley)
  'SD': {
    path: 'M5 12 L15 5 L92 5 L95 78 L5 78 L5 58 L12 48 L8 38 L12 28 Z',
    viewBox: '0 0 100 83',
    center: [50, 40],
  },

  // Tennessee - very wide and thin parallelogram shape
  'TN': {
    path: 'M5 12 L18 8 L35 5 L55 5 L75 5 L88 8 L95 12 L95 52 L82 55 L68 52 L55 55 L42 52 L28 55 L15 52 L5 48 Z',
    viewBox: '0 0 100 60',
    center: [50, 28],
  },

  // Texas - very distinctive. Panhandle at top, then main body widens, long coast, Rio Grande bottom
  'TX': {
    path: 'M28 5 L52 5 L52 28 L72 28 L78 32 L85 18 L92 22 L95 32 L90 42 L85 52 L78 58 L70 65 L62 72 L55 80 L48 88 L40 95 L32 102 L25 108 L18 105 L12 95 L8 85 L5 72 L5 58 L8 45 L15 35 L22 25 L25 15 Z',
    viewBox: '0 0 100 112',
    center: [48, 52],
  },

  // Utah - rectangular with rectangular notch cut from top-right corner
  'UT': {
    path: 'M5 5 L38 5 L38 32 L82 32 L82 112 L5 112 Z',
    viewBox: '0 0 87 117',
    center: [42, 68],
  },

  // Vermont - tall, narrow, wider at south, irregular east border
  'VT': {
    path: 'M22 105 L20 90 L18 75 L18 58 L22 42 L25 28 L30 15 L38 5 L52 5 L60 12 L62 22 L58 30 L52 28 L48 35 L45 48 L48 62 L48 75 L45 88 L38 98 L28 105 Z',
    viewBox: '0 0 72 110',
    center: [38, 52],
  },

  // Virginia - very wide and thin, with Eastern Shore peninsula, wider at west
  'VA': {
    path: 'M5 28 L15 22 L28 15 L45 10 L62 5 L78 5 L92 8 L95 15 L92 22 L85 28 L78 32 L72 28 L65 32 L58 38 L50 42 L42 45 L32 48 L22 50 L12 48 L5 40 Z',
    viewBox: '0 0 100 55',
    center: [48, 25],
  },

  // Washington - wide rectangle, with Puget Sound indentation and Olympic Peninsula at NW
  'WA': {
    path: 'M5 18 L10 10 L22 5 L38 5 L55 8 L68 5 L82 5 L95 12 L95 72 L5 72 L5 55 L12 48 L8 40 L12 32 L5 25 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },

  // West Virginia - very irregular, shaped like a frog or two-lobed figure
  'WV': {
    path: 'M28 5 L42 5 L52 10 L58 18 L55 28 L52 38 L55 48 L62 55 L68 65 L72 75 L68 85 L58 90 L48 92 L38 88 L32 78 L28 68 L25 55 L22 45 L25 35 L30 25 L28 15 Z',
    viewBox: '0 0 82 97',
    center: [45, 48],
  },

  // Wisconsin - shaped somewhat like a mitten, wider at top with Door County peninsula poking up NE
  'WI': {
    path: 'M18 5 L38 5 L52 8 L62 5 L75 8 L82 15 L85 25 L82 35 L78 45 L78 58 L82 68 L82 82 L78 92 L68 98 L55 102 L42 98 L32 88 L22 78 L15 62 L12 48 L15 32 L18 18 Z',
    viewBox: '0 0 95 107',
    center: [48, 52],
  },

  // Wyoming - perfect rectangle
  'WY': {
    path: 'M5 5 L95 5 L95 72 L5 72 Z',
    viewBox: '0 0 100 77',
    center: [50, 38],
  },
}
