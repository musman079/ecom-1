export interface NormalizedData {
  stitch_type: 'stitched' | 'unstitched' | null;
  pieces: 1 | 2 | 3 | 4 | null;
  design_type: 'embroidered' | 'printed' | null;
  fabric: string | null;
  season: string | null;
  category: string | null;
  occasion: string | null;
  is_valid: boolean;
}

export class Normalizer {
  /**
   * Extracts attributes from title and description using Regex/Keyword matching
   */
  public static extractAttributes(title: string, description: string): NormalizedData {
    const text = `${title} ${description}`.toLowerCase();
    
    // 1. Stitch Type (Required)
    let stitch_type: 'stitched' | 'unstitched' | null = null;
    if (text.includes('unstitched') || text.includes('un-stitched')) {
      stitch_type = 'unstitched';
    } else if (text.includes('stitched') || text.includes('ready to wear') || text.includes('pret')) {
      stitch_type = 'stitched';
    }

    // 2. Pieces (Required)
    let pieces: 1 | 2 | 3 | 4 | null = null;
    if (text.match(/4\s*piece|4pc|4\s*pc|four\s*piece/)) {
      pieces = 4;
    } else if (text.match(/3\s*piece|3pc|3\s*pc|three\s*piece/)) {
      pieces = 3;
    } else if (text.match(/2\s*piece|2pc|2\s*pc|two\s*piece/)) {
      pieces = 2;
    } else if (text.match(/1\s*piece|1pc|1\s*pc|one\s*piece|kurti|shirt/)) {
      pieces = 1;
    }

    // 3. Design Type (Required)
    let design_type: 'embroidered' | 'printed' | null = null;
    if (text.includes('embroidered') || text.includes('embroidery')) {
      design_type = 'embroidered';
    } else if (text.includes('printed') || text.includes('print')) {
      design_type = 'printed';
    }

    // 4. Fabric (Required if possible)
    let fabric: string | null = null;
    const fabrics = ['lawn', 'silk', 'cotton', 'khaddar', 'cambric', 'linen', 'chiffon', 'velvet', 'organza', 'jacquard', 'viscose'];
    for (const f of fabrics) {
      if (text.includes(f)) {
        fabric = f;
        break;
      }
    }

    // 5. Season (Optional)
    let season: string | null = null;
    if (text.includes('summer')) season = 'summer';
    else if (text.includes('winter')) season = 'winter';
    else if (text.includes('spring')) season = 'spring';

    // 6. Category / Occasion (Optional)
    let category: string | null = null;
    let occasion: string | null = null;
    
    if (text.includes('bridal')) category = 'bridal';
    else if (text.includes('casual')) category = 'casual';
    else if (text.includes('festive') || text.includes('formal')) category = 'festive';

    if (text.includes('eid')) occasion = 'eid';
    else if (text.includes('wedding')) occasion = 'wedding';

    // Validation Check: If any of the 3 required are missing, mark as invalid.
    const is_valid = (stitch_type !== null && pieces !== null && design_type !== null);

    return {
      stitch_type,
      pieces,
      design_type,
      fabric,
      season,
      category,
      occasion,
      is_valid
    };
  }
}
