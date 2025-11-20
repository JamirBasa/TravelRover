/**
 * Professional PDF Export Service for Travel Itineraries
 * 
 * Features:
 * - Elegant cover page with branding
 * - Comprehensive trip overview with all metadata
 * - Detailed budget breakdown with visual elements
 * - Day-by-day itinerary with complete activity details
 * - Must-see places and attractions
 * - Professional typography and layout
 * - Page numbers and headers
 * - Print-optimized (hotels & flights excluded)
 */

import jsPDF from 'jspdf';
import { calculateTotalBudget } from '../utils/budgetCalculator';

// ========================================
// CONFIGURATION
// ========================================
const PDF_CONFIG = {
  format: 'a4',
  unit: 'mm',
  orientation: 'portrait',
  compress: true,
  
  // Page dimensions - OPTIMIZED FOR SPACE
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 15, // ✅ Reduced from 20mm to 15mm (saves 10mm width)
  contentWidth: 180, // pageWidth - (margin * 2)
  
  // Colors (matching TravelRover brand)
  colors: {
    primary: [14, 165, 233], // Sky-500
    secondary: [2, 132, 199], // Blue-600
    accent: [99, 102, 241], // Indigo-500
    success: [16, 185, 129], // Emerald-500
    warning: [245, 158, 11], // Amber-500
    text: [31, 41, 55], // Gray-800
    lightText: [107, 114, 128], // Gray-500
    border: [229, 231, 235], // Gray-200
    bgLight: [249, 250, 251], // Gray-50
  },
  
  // Typography - BALANCED: Compact but readable
  fonts: {
    title: 16, // ✅ Header title (was 14pt, now 16pt for readability)
    heading: 13, // ✅ Section headers (was 12pt, now 13pt)
    subheading: 11, // ✅ Day headers (was 10pt, now 11pt for boldness)
    body: 9, // ✅ Activity names (was 8pt, now 9pt - easier to read)
    small: 7.5, // ✅ Compact activities (was 7pt, now 7.5pt)
    tiny: 6.5, // ✅ Details/descriptions (was 6pt, now 6.5pt)
  },
  
  // Spacing constants - BALANCED: Tight but breathable
  spacing: {
    sectionGap: 6, // ✅ Between major sections (was 5mm, now 6mm)
    paragraphGap: 3.5, // ✅ Between paragraphs (was 3mm, now 3.5mm)
    lineHeight: 4, // ✅ Text line height (was 3.5mm, now 4mm)
    cardGap: 5, // ✅ Between cards (was 4mm, now 5mm)
    dayGap: 3, // ✅ Between days (was 2mm, now 3mm - more breathing room)
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Safe GState constructor resolver
 * Handles different jsPDF bundle configurations
 */
const getGState = (pdf) => {
  // Try instance method first (some bundles)
  if (pdf.GState) return pdf.GState;
  // Try class constructor (most bundles)
  if (typeof jsPDF !== 'undefined' && jsPDF.GState) return jsPDF.GState;
  // Fallback: return null and caller should handle gracefully
  return null;
};

/**
 * Set opacity with fallback
 */
const withOpacity = (pdf, opacity, drawFn) => {
  const GState = getGState(pdf);
  if (GState) {
    pdf.setGState(new GState({ opacity }));
    drawFn();
    pdf.setGState(new GState({ opacity: 1 }));
  } else {
    // No opacity support, just draw normally
    drawFn();
  }
};

/**
 * Centralized currency formatter (ASCII-safe)
 */
const fmtPHP = (amount) => {
  const num = parseFloat(amount || 0);
  return `PHP ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Check if we need a new page with minimum space
 */
const ensureSpace = (pdf, currentY, requiredSpace) => {
  const { pageHeight, margin } = PDF_CONFIG;
  if (currentY + requiredSpace > pageHeight - margin - 20) { // 20mm safety for footer
    pdf.addPage();
    return margin;
  }
  return currentY;
};

/**
 * Normalize time format to 12-hour with AM/PM
 * Handles: "20:00", "8:00 PM", "8:00PM", "20:00:00", etc.
 */
const normalizeTime = (timeString) => {
  if (!timeString || timeString === 'Flexible') return 'Flexible';
  
  // Already in 12-hour format with AM/PM
  if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(timeString)) {
    return timeString.replace(/\s*(AM|PM)/i, ' $1').toUpperCase();
  }
  
  // Parse 24-hour format (20:00, 20:00:00)
  const match24 = timeString.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    let hours = parseInt(match24[1]);
    const minutes = match24[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour
    if (hours === 0) hours = 12; // Midnight
    else if (hours > 12) hours -= 12;
    
    return `${hours}:${minutes} ${ampm}`;
  }
  
  // If can't parse, return as-is
  return timeString;
};

// ========================================
// MAIN EXPORT FUNCTION
// ========================================
export const generateTripPDF = async (tripData) => {
  try {
    console.log('📄 Starting compact PDF generation (optimized for minimal paper)...', tripData);
    
    const pdf = new jsPDF({
      orientation: PDF_CONFIG.orientation,
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format,
      compress: PDF_CONFIG.compress
    });
    
    let currentY = PDF_CONFIG.margin;
    
    // ✅ 1. REMOVED Cover Page - saves 1 full page
    // Instead: Add compact header banner on first page
    currentY = addCompactHeader(pdf, tripData, currentY);
    
    // ✅ 2. Add Trip Overview - COMPACT single column format
    currentY = addTripOverview(pdf, tripData, currentY);
    
    // 3. Hotels & Must-See Places - Removed for clean, focused itinerary
    // Note: Hotel and attraction details remain in the app for booking reference
    
    // ✅ 4. Add Budget Breakdown - COMPACT table format
    currentY = addBudgetSection(pdf, tripData, currentY);
    
    // ✅ 5. Add Daily Itinerary - COMPACT two-column table format
    currentY = ensureSpace(pdf, currentY, 40); // Reduced from 80mm to 40mm
    addDailyItinerary(pdf, tripData, currentY);
    
    // 6. Add Footer & Page Numbers to all pages
    addFooterToAllPages(pdf);
    
    // 7. Save PDF
    const filename = generateFilename(tripData);
    pdf.save(filename);
    
    const pageCount = pdf.internal.getNumberOfPages();
    console.log(`✅ Compact PDF generated: ${filename} (${pageCount} pages - optimized for printing)`);
    return { success: true, filename, pages: pageCount };
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// COMPACT HEADER - Replaces full cover page (saves 1 page)
// ========================================
const addCompactHeader = (pdf, tripData, startY) => {
  const { pageWidth, margin, colors, fonts } = PDF_CONFIG;
  let y = startY;
  
  // Compact gradient header bar (15mm total)
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, y, pageWidth, 15, 'F');
  
  // Brand name (left)
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fonts.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TRAVELROVER', margin, y + 6);
  
  // Destination (center-right)
  const destination = tripData?.userSelection?.location || 'Your Trip';
  pdf.setFontSize(fonts.subheading);
  const destWidth = pdf.getTextWidth(destination);
  pdf.text(destination, pageWidth - margin - destWidth, y + 6);
  
  // Tagline (bottom)
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'normal');
  withOpacity(pdf, 0.8, () => {
    pdf.text('AI-Powered Travel Itinerary', margin, y + 12);
  });
  
  return y + 18; // 15mm header + 3mm spacing
};

// ========================================
// COVER PAGE - Professional Design (DEPRECATED - kept for reference)
// ========================================
/* eslint-disable no-unused-vars */
const addCoverPage = (pdf, tripData) => {
  const { pageWidth, pageHeight, margin, colors, fonts } = PDF_CONFIG;
  const centerX = pageWidth / 2;
  
  // ===== Header Section with Gradient Effect =====
  // Top gradient bar
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 80, 'F');
  
  // Accent gradient overlay
  pdf.setFillColor(...colors.secondary);
  withOpacity(pdf, 0.3, () => {
    pdf.rect(0, 40, pageWidth, 40, 'F');
  });
  
  // Diagonal design elements
  pdf.setFillColor(255, 255, 255);
  withOpacity(pdf, 0.1, () => {
    pdf.circle(pageWidth - 20, 20, 40, 'F');
    pdf.circle(20, 60, 25, 'F');
  });
  
  // ===== Branding =====
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fonts.title + 8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TRAVELROVER', centerX, 35, { align: 'center' });
  
  pdf.setFontSize(fonts.body);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Your AI-Powered Travel Companion', centerX, 45, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.line(centerX - 40, 50, centerX + 40, 50);
  
  // ===== Destination Section =====
  pdf.setTextColor(...colors.text);
  pdf.setFontSize(fonts.title + 2);
  pdf.setFont('helvetica', 'bold');
  const destination = tripData?.userSelection?.location || 'Your Dream Destination';
  
  // Word wrap destination if too long
  const maxWidth = pageWidth - (margin * 4);
  const destinationLines = pdf.splitTextToSize(destination, maxWidth);
  let destY = 100;
  destinationLines.forEach(line => {
    pdf.text(line, centerX, destY, { align: 'center' });
    destY += 10;
  });
  
  // ===== Trip Details Cards =====
  const cardY = destY + 15;
  const cardWidth = 80;
  const cardHeight = 25;
  const cardSpacing = 10;
  
  // Card 1: Dates
  let cardX = (pageWidth - (cardWidth * 2 + cardSpacing)) / 2;
  drawInfoCard(pdf, cardX, cardY, cardWidth, cardHeight, 
    'TRAVEL DATES', 
    getTripDates(tripData), 
    colors.primary);
  
  // Card 2: Duration
  cardX += cardWidth + cardSpacing;
  drawInfoCard(pdf, cardX, cardY, cardWidth, cardHeight, 
    'DURATION', 
    `${getTripDuration(tripData)} Days`, 
    colors.secondary);
  
  // Card 3: Travelers
  cardX = (pageWidth - (cardWidth * 2 + cardSpacing)) / 2;
  const card2Y = cardY + cardHeight + 8;
  drawInfoCard(pdf, cardX, card2Y, cardWidth, cardHeight, 
    'TRAVELERS', 
    tripData?.userSelection?.traveler || 'Solo Trip', 
    colors.accent);
  
  // Card 4: Budget - Enhanced split design showing ACTUAL COST
  cardX += cardWidth + cardSpacing;
  
  // Get budget info - handle multiple formats
  const budgetType = tripData?.userSelection?.budget || 'Flexible';
  
  // ✅ CALCULATE ACTUAL TRIP COST from itinerary (most accurate)
  const { total: actualTripCost } = calculateTotalBudget(tripData);
  
  // ✅ Try to get user's budget preference (custom amount or tier default)
  let userBudgetPreference = null;
  
  // Priority 1: customBudget (user entered specific amount)
  if (tripData?.userSelection?.customBudget) {
    const parsed = parseFloat(String(tripData.userSelection.customBudget).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      userBudgetPreference = parsed;
    }
  }
  
  // Priority 2: budgetAmount field
  if (!userBudgetPreference && tripData?.userSelection?.budgetAmount) {
    const parsed = parseFloat(String(tripData.userSelection.budgetAmount).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      userBudgetPreference = parsed;
    }
  }
  
  // Priority 3: Extract from budget string
  if (!userBudgetPreference && typeof budgetType === 'string' && budgetType.includes('₱')) {
    const match = budgetType.match(/₱[\d,]+/);
    if (match) {
      const parsed = parseFloat(match[0].replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        userBudgetPreference = parsed;
      }
    }
  }
  
  // Draw budget card with custom layout
  const budgetCardX = cardX;
  const budgetCardY = card2Y;
  const budgetCardWidth = cardWidth;
  const budgetCardHeight = cardHeight;
  
  // Card background with shadow
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(budgetCardX + 1, budgetCardY + 1, budgetCardWidth, budgetCardHeight, 2, 2, 'F');
  
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...colors.success);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(budgetCardX, budgetCardY, budgetCardWidth, budgetCardHeight, 2, 2, 'FD');
  
  // Green top bar
  pdf.setFillColor(...colors.success);
  pdf.rect(budgetCardX, budgetCardY, budgetCardWidth, 3, 'F');
  
  // ✅ IMPROVED: Show actual trip cost, not tier default
  if (actualTripCost > 0) {
    // Label: "TRIP COST"
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.success);
    pdf.text('TRIP COST', budgetCardX + budgetCardWidth / 2, budgetCardY + 9, { align: 'center' });
    
    // Budget tier (smaller text)
    pdf.setFontSize(fonts.small - 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // Gray-500
    // Clean budget tier text aggressively - remove all special chars and normalize Unicode
    const cleanBudgetTier = budgetType
      .split(':')[0]
      .trim()
      .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013\u200B\u200C\u200D\uFEFF!'"]/g, '') // Remove special chars including !, ', "
      .replace(/[^\x20-\x7E]/g, '') // Keep only printable ASCII
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
    pdf.text(`${cleanBudgetTier} Tier`, budgetCardX + budgetCardWidth / 2, budgetCardY + 13, { align: 'center' });
    
    // Actual cost (large, prominent)
    pdf.setFontSize(fonts.subheading);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.success);
    const formattedCost = `P ${actualTripCost.toLocaleString()}`;
    pdf.text(formattedCost, budgetCardX + budgetCardWidth / 2, budgetCardY + 20, { align: 'center' });
  } else {
    // Fallback: Show tier name only if no cost calculated
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.success);
    pdf.text('BUDGET TYPE', budgetCardX + budgetCardWidth / 2, budgetCardY + 10, { align: 'center' });
    
    pdf.setFontSize(fonts.body);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    // Clean budget tier text aggressively - remove all special chars and normalize Unicode
    const cleanBudgetTier = budgetType
      .split(':')[0]
      .trim()
      .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013\u200B\u200C\u200D\uFEFF!'"]/g, '') // Remove special chars including !, ', "
      .replace(/[^\x20-\x7E]/g, '') // Keep only printable ASCII
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
    pdf.text(cleanBudgetTier, budgetCardX + budgetCardWidth / 2, budgetCardY + 17, { align: 'center' });
  }
  
  // ===== Special Preferences Badge (if exists) - OPTIMIZED =====
  let currentY = card2Y + cardHeight + 15; // Start after budget card
  
  if (tripData?.userSelection?.specificRequests) {
    const requestText = tripData.userSelection.specificRequests.trim();
    
    // Calculate dynamic height based on text content
    const maxTextWidth = pageWidth - (margin * 3);
    const wrappedText = pdf.splitTextToSize(requestText, maxTextWidth);
    const textHeight = wrappedText.length * 4.5; // 4.5mm per line
    const badgeHeight = Math.max(28, textHeight + 14); // Min 28mm, or content + padding
    
    // Reserve space for badge + "What's Inside" box + spacing
    const infoBoxHeight = 38;
    const requiredSpace = badgeHeight + 10 + infoBoxHeight + 5; // badge + gap + info box + buffer
    currentY = ensureSpace(pdf, currentY, requiredSpace);
    
    // Background with gradient effect
    pdf.setFillColor(...colors.warning);
    withOpacity(pdf, 0.1, () => {
      pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), badgeHeight, 3, 3, 'F');
    });
    
    // Left accent bar
    pdf.setFillColor(...colors.warning);
    pdf.rect(margin, currentY, 3, badgeHeight, 'F');
    
    // Title
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.warning);
    pdf.text('CUSTOMIZED ITINERARY', margin + 8, currentY + 7);
    
    // Full content (no truncation)
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    pdf.text(wrappedText, margin + 8, currentY + 13);
    
    currentY += badgeHeight + 10; // Update Y position for next section
  }
  
  // ===== PDF Contents Info - SEQUENTIAL LAYOUT =====
  // Always position sequentially below previous content (no upward movement)
  const infoBoxHeight = 38;
  // Ensure space for the info box (prevents collision with footer)
  currentY = ensureSpace(pdf, currentY, infoBoxHeight + 5);
  let infoY = currentY;
  
  // Box with subtle shadow
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(margin + 0.5, infoY + 0.5, pageWidth - (margin * 2), infoBoxHeight, 2, 2, 'F');
  
  pdf.setFillColor(249, 250, 251); // Gray-50
  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, infoY, pageWidth - (margin * 2), infoBoxHeight, 2, 2, 'FD');
  
  // Icon/Badge effect
  pdf.setFillColor(...colors.primary);
  pdf.circle(margin + 8, infoY + 8, 2.5, 'F');
  
  // Title with better positioning
  pdf.setFontSize(fonts.small);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.text);
  pdf.text('What\'s Inside This Guide:', margin + 13, infoY + 9);
  
  // Content list with consistent spacing
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.lightText);
  const contents = [
    '- Complete daily itinerary with timings',
    '- Budget breakdown from activities',
    '- Travel logistics and estimated costs',
    '- Activity details with pricing'
  ];
  let contentY = infoY + 15;
  contents.forEach(item => {
    pdf.text(item, margin + 8, contentY);
    contentY += 4.8; // Slightly increased spacing
  });
  
  // Bottom note with better wrapping
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...colors.lightText);
  const noteText = pdf.splitTextToSize(
    'Complete hotel and attraction details with photos available in the TravelRover app.',
    pageWidth - (margin * 2) - 16
  );
  pdf.text(noteText, margin + 8, infoY + 33, { align: 'left' });
  
  // ===== Footer Section =====
  const footerY = pageHeight - 35;
  
  // Decorative separator
  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  // Generation info
  pdf.setFontSize(fonts.small);
  pdf.setTextColor(...colors.lightText);
  pdf.setFont('helvetica', 'normal');
  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(`Generated on ${generatedDate}`, centerX, footerY + 8, { align: 'center' });
  
  // Tagline
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Travel smarter, not harder - Powered by AI', centerX, footerY + 14, { align: 'center' });
  
  return pageHeight; // Cover page uses full page
};

// Helper function to draw info cards - OPTIMIZED
const drawInfoCard = (pdf, x, y, width, height, label, value, color) => {
  const { fonts } = PDF_CONFIG;
  
  // Shadow effect (subtle)
  pdf.setFillColor(240, 240, 240);
  withOpacity(pdf, 0.5, () => {
    pdf.roundedRect(x + 0.8, y + 0.8, width, height, 2, 2, 'F');
  });
  
  // Card background with border
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 2, 2, 'FD');
  
  // Colored top accent bar
  pdf.setFillColor(...color);
  pdf.rect(x, y, width, 3, 'F');
  
  // Label (uppercase for consistency)
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...color);
  pdf.text(label, x + width / 2, y + 10, { align: 'center' });
  
  // Value with better wrapping
  pdf.setFontSize(fonts.body + 1);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  const valueLines = pdf.splitTextToSize(value, width - 6);
  const valueY = y + (valueLines.length > 1 ? 15 : 17); // Adjust for multi-line
  pdf.text(valueLines, x + width / 2, valueY, { align: 'center' });
};

// ========================================
// TRIP OVERVIEW SECTION - Modern Card Layout
// ========================================
const addTripOverview = (pdf, tripData, startY) => {
  const { margin, pageWidth, pageHeight, colors, fonts, contentWidth } = PDF_CONFIG;
  let y = startY;
  
  // Section header
  addSectionHeader(pdf, 'TRIP OVERVIEW', y, colors.primary);
  y += 15;
  
  // Helper function to extract traveler count
  const getTravelerInfo = (tripData) => {
    const traveler = tripData?.userSelection?.traveler || 
                     tripData?.userSelection?.travelers ||
                     tripData?.userSelection?.noOfTravelers;
    
    if (!traveler) return '1 Solo Traveler';
    
    // If it's already formatted text, return it
    if (typeof traveler === 'string' && isNaN(traveler)) {
      return traveler;
    }
    
    // If it's a number, format it
    const count = parseInt(traveler);
    if (count === 1) return '1 Solo Traveler';
    return `${count} Travelers`;
  };
  
  // Helper function to extract budget info
  const getBudgetInfo = (tripData) => {
    const budgetTypeText = tripData?.userSelection?.budget || 'Flexible';
    
    console.log('💰 PDF Budget Extraction Debug:', {
      budgetTypeText,
      customBudget: tripData?.userSelection?.customBudget,
      budgetAmount: tripData?.userSelection?.budgetAmount,
      tripDataBudget: tripData?.tripData?.budget
    });
    
    // ✅ CALCULATE ACTUAL TRIP COST (most accurate)
    const { total: actualTripCost } = calculateTotalBudget(tripData);
    
    // ✅ Try to get user's budget preference/limit
    let userBudgetPreference = null;
    
    // Priority 1: customBudget (user entered specific amount)
    if (tripData?.userSelection?.customBudget) {
      const parsed = parseFloat(String(tripData.userSelection.customBudget).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        userBudgetPreference = parsed;
        console.log('✅ Budget preference from customBudget:', userBudgetPreference);
      }
    }
    
    // Priority 2: budgetAmount field
    if (!userBudgetPreference && tripData?.userSelection?.budgetAmount) {
      const parsed = parseFloat(String(tripData.userSelection.budgetAmount).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        userBudgetPreference = parsed;
        console.log('✅ Budget preference from budgetAmount:', userBudgetPreference);
      }
    }
    
    // Priority 3: Extract from budget string (e.g., "Custom: ₱18990")
    if (!userBudgetPreference && typeof budgetTypeText === 'string' && budgetTypeText.includes('₱')) {
      const match = budgetTypeText.match(/₱[\d,]+/);
      if (match) {
        const parsed = parseFloat(match[0].replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          userBudgetPreference = parsed;
          console.log('✅ Budget preference from budget string:', userBudgetPreference);
        }
      }
    }
    
    // ✅ ALWAYS show actual trip cost (primary info)
    if (actualTripCost > 0) {
      // Clean budget type text aggressively - remove all special chars
      const cleanBudgetType = budgetTypeText
        .split(':')[0]
        .trim()
        .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013\u200B\u200C\u200D\uFEFF!'"]/g, '')
        .replace(/[^\x20-\x7E]/g, '') // Keep only printable ASCII
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // If user set custom budget, show comparison
      if (userBudgetPreference && userBudgetPreference !== actualTripCost) {
        return `${cleanBudgetType} (${fmtPHP(userBudgetPreference)} budget) → Actual: ${fmtPHP(actualTripCost)}`;
      }
      
      // Otherwise just show actual cost with tier label
      return `${cleanBudgetType} Tier → ${fmtPHP(actualTripCost)}`;
    }
    
    // ✅ Fallback: Show preference or tier only
    if (userBudgetPreference) {
      const cleanBudgetType = budgetTypeText
        .split(':')[0]
        .trim()
        .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013\u200B\u200C\u200D\uFEFF!'"]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `${cleanBudgetType} (${fmtPHP(userBudgetPreference)})`;
    }
    
    console.warn('⚠️ No budget info found, returning tier only:', budgetTypeText);
    // Clean all special characters before returning
    return budgetTypeText
      .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013\u200B\u200C\u200D\uFEFF!'"]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Info card drawing helper
  const drawInfoBox = (label, value, x, y, width) => {
    // Label
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text(label, x, y);
    
    // Value
    pdf.setFontSize(fonts.body);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    const valueLines = pdf.splitTextToSize(value, width - 2);
    pdf.text(valueLines, x, y + 4.5);
    
    return 4.5 + (valueLines.length * 4.5); // Return height used
  };
  
  // Grid layout: 2 columns with proper spacing
  const colWidth = (contentWidth - 10) / 2;
  const col1X = margin;
  const col2X = pageWidth / 2 + 5;
  const rowSpacing = 12;
  
  let leftY = y;
  let rightY = y;
  
  // === Column 1 ===
  // Destination
  const destHeight = drawInfoBox(
    'DESTINATION',
    tripData?.userSelection?.location || 'Not specified',
    col1X, leftY, colWidth
  );
  leftY += destHeight + rowSpacing;
  
  // Travel Dates
  const datesHeight = drawInfoBox(
    'DATES',
    getTripDates(tripData),
    col1X, leftY, colWidth
  );
  leftY += datesHeight + rowSpacing;
  
  // Duration
  const duration = getTripDuration(tripData);
  const durationHeight = drawInfoBox(
    'DURATION',
    `${duration} ${duration === 1 ? 'Day' : 'Days'}`,
    col1X, leftY, colWidth
  );
  leftY += durationHeight + rowSpacing;
  
  // === Column 2 ===
  // Travelers
  const travelerHeight = drawInfoBox(
    'TRAVELERS',
    getTravelerInfo(tripData),
    col2X, rightY, colWidth
  );
  rightY += travelerHeight + rowSpacing;
  
  // Budget
  const budgetHeight = drawInfoBox(
    'BUDGET',
    getBudgetInfo(tripData),
    col2X, rightY, colWidth
  );
  rightY += budgetHeight + rowSpacing;
  
  // Travel Style
  const styleHeight = drawInfoBox(
    'TRAVEL STYLE',
    tripData?.userSelection?.travelStyle || 'Moderate Pace',
    col2X, rightY, colWidth
  );
  rightY += styleHeight + rowSpacing;
  
  y = Math.max(leftY, rightY);
  
  // === Special Preferences Box (if exists) - OPTIMIZED ===
  if (tripData?.userSelection?.specificRequests) {
    y += 5;
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }
    
    const requestText = tripData.userSelection.specificRequests.trim();
    const requestLines = pdf.splitTextToSize(requestText, contentWidth - 12);
    const boxHeight = Math.max(32, requestLines.length * 4.5 + 18);
    
    // Background box with border
    pdf.setFillColor(...colors.bgLight);
    pdf.setDrawColor(...colors.warning);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
    
    // Left accent bar
    pdf.setFillColor(...colors.warning);
    pdf.rect(margin, y, 3, boxHeight, 'F');
    
    // Icon circle
    pdf.setFillColor(...colors.warning);
    pdf.circle(margin + 10, y + 8, 2, 'F');
    
    // Title
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.warning);
    pdf.text('YOUR SPECIAL PREFERENCES', margin + 15, y + 9);
    
    // Content (full text, no truncation)
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    pdf.text(requestLines, margin + 8, y + 16);
    
    y += boxHeight + 8;
  }
  
  return y;
};

// Helper function to add section headers - OPTIMIZED
const addSectionHeader = (pdf, title, y, color) => {
  const { margin, contentWidth, fonts } = PDF_CONFIG;
  
  // Gradient background effect
  pdf.setFillColor(...color);
  pdf.rect(margin, y, contentWidth, 9, 'F');
  
  // Lighter overlay for gradient effect
  withOpacity(pdf, 0.3, () => {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, y, contentWidth / 3, 9, 'F');
  });
  
  // Border accent
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 9, margin + contentWidth, y + 9);
  
  // Title text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fonts.subheading);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin + 4, y + 6.5);
};

// ========================================
// MUST-SEE PLACES SECTION - REMOVED FOR CLEAN PDF
// ========================================
// Keeping function for future use if needed
/* eslint-disable no-unused-vars */
const addPlacesToVisitSection = (pdf, places, startY) => {
  const { margin, pageWidth, pageHeight, colors, fonts, contentWidth } = PDF_CONFIG;
  let y = startY;
  
  // Check if we need a new page
  if (y > pageHeight - 80) {
    pdf.addPage();
    y = margin;
  }
  
  y += 10;
  addSectionHeader(pdf, 'MUST-SEE ATTRACTIONS', y, colors.secondary);
  y += 15;
  
  const validPlaces = places.filter(p => p && p.placeName).slice(0, 5);
  
  validPlaces.forEach((place, index) => {
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = margin;
    }
    
    // Place card
    pdf.setFillColor(...colors.bgLight);
    pdf.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');
    
    // Number
    pdf.setTextColor(...colors.secondary);
    pdf.setFontSize(fonts.body);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}.`, margin + 3, y + 6);
    
    // Place name
    pdf.setTextColor(...colors.text);
    const nameLines = pdf.splitTextToSize(place.placeName, contentWidth - 50);
    pdf.text(nameLines, margin + 10, y + 6);
    
    // Pricing if available
    if (place.ticketPricing && place.ticketPricing !== 'Free') {
      pdf.setFontSize(fonts.small);
      pdf.setTextColor(...colors.success);
      // Clean price: remove ± and ₱, replace with P, add comma formatting
      let cleanPrice = place.ticketPricing
        .replace(/±/g, '')
        .replace(/₱/g, '')
        .trim();
      
      // Try to parse and format with commas
      const priceNum = parseFloat(cleanPrice.replace(/,/g, ''));
      if (!isNaN(priceNum)) {
        cleanPrice = `P ${priceNum.toLocaleString()}`;
      } else {
        cleanPrice = `P ${cleanPrice}`;
      }
      
      pdf.text(cleanPrice, pageWidth - margin - 3, y + 6, { align: 'right' });
    }
    
    // Details if available
    if (place.placeDetails && place.placeDetails !== place.placeName) {
      pdf.setFontSize(fonts.tiny);
      pdf.setTextColor(...colors.lightText);
      const detailLines = pdf.splitTextToSize(
        place.placeDetails.substring(0, 100), 
        contentWidth - 15
      );
      pdf.text(detailLines.slice(0, 1), margin + 10, y + 11);
    }
    
    y += 18;
  });
  
  return y;
};
/* eslint-enable no-unused-vars */

// ========================================
// BUDGET BREAKDOWN SECTION
// ========================================
const addBudgetSection = (pdf, tripData, startY) => {
  const { margin, pageWidth, pageHeight, colors, fonts, contentWidth } = PDF_CONFIG;
  let y = startY;
  
  // Check if we need a new page
  if (y > pageHeight - 80) {
    pdf.addPage();
    y = margin;
  }
  
  y += 10;
  addSectionHeader(pdf, 'BUDGET BREAKDOWN', y, colors.success);
  y += 15;
  
  // ✅ USE CORRECT CALCULATION from budgetCalculator.js (same as app)
  // This ensures PDF matches the app's displayed budget
  const budgetInfo = calculateTotalBudget(tripData);
  const { total, breakdown } = budgetInfo;
  
  // Log for debugging/validation
  console.log('💰 PDF Budget Calculation:', {
    activities: breakdown.activities,
    hotels: breakdown.hotels,
    flights: breakdown.flights,
    total: total,
    appGrandTotal: tripData?.tripData?.grandTotal,
    matches: total === tripData?.tripData?.grandTotal
  });
  
  // Build budget items from correct breakdown
  // Note: Hotels are now correctly calculated as (pricePerNight × numNights)
  let budgetItems = [
    { 
      label: 'Accommodation (Hotels)', 
      value: breakdown.hotels, 
      category: 'accommodation' 
    },
    { 
      label: 'Transportation & Flights', 
      value: breakdown.flights, 
      category: 'transportation' 
    },
    { 
      label: 'Food & Activities', 
      value: breakdown.activities, 
      category: 'activities' 
    }
  ].filter(item => item.value > 0);
  
  if (total === 0 || budgetItems.length === 0) {
    pdf.setFillColor(...colors.bgLight);
    pdf.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');
    pdf.setFontSize(fonts.body);
    pdf.setTextColor(...colors.lightText);
    pdf.text('Budget information will be calculated and displayed here', margin + 5, y + 8);
    y += 20;
    return y;
  }
  
  // Display budget items with enhanced visual bars
  const maxBarWidth = contentWidth - 85;
  const maxAmount = Math.max(...budgetItems.map(i => i.value));
  
  budgetItems.forEach((item, index) => {
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }
    
    const percentage = ((item.value / total) * 100).toFixed(1);
    const barWidth = (item.value / maxAmount) * maxBarWidth;
    
    // Category name
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.body);
    pdf.text(item.label, margin + 5, y + 4);
    
    // Visual bar with enhanced design
    const barY = y + 7;
    const barHeight = 5;
    
    // Bar background with border
    pdf.setFillColor(245, 245, 245);
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin + 5, barY, maxBarWidth, barHeight, 1.5, 1.5, 'FD');
    
    // Bar fill with gradient colors
    const barColors = [
      [14, 165, 233],   // primary
      [2, 132, 199],    // secondary
      [99, 102, 241],   // accent
      [16, 185, 129],   // success
    ];
    const colorIndex = index % barColors.length;
    pdf.setFillColor(...barColors[colorIndex]);
    pdf.roundedRect(margin + 5, barY, barWidth, barHeight, 1.5, 1.5, 'F');
    
    // Amount and percentage (aligned right)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(...colors.text);
    const priceText = fmtPHP(item.value);
    const percentText = `(${percentage}%)`;
    pdf.text(priceText, pageWidth - margin - 25, y + 4, { align: 'right' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fonts.tiny);
    pdf.setTextColor(...colors.lightText);
    pdf.text(percentText, pageWidth - margin - 5, y + 4, { align: 'right' });
    
    y += 16;
  });
  
  // Total budget card (prominent) - ENHANCED FOR CLARITY
  y += 5;
  
  // ✅ ROBUST EXTRACTION: Check if user provided a custom budget amount
  let userBudgetAmount = null;
  
  // Priority 1: customBudget (most reliable)
  if (tripData?.userSelection?.customBudget) {
    const parsed = parseFloat(String(tripData.userSelection.customBudget).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      userBudgetAmount = parsed;
    }
  }
  
  // Priority 2: budgetAmount field
  if (!userBudgetAmount && tripData?.userSelection?.budgetAmount) {
    const parsed = parseFloat(String(tripData.userSelection.budgetAmount).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      userBudgetAmount = parsed;
    }
  }
  
  // Priority 3: Extract from budget string
  if (!userBudgetAmount && tripData?.userSelection?.budget && typeof tripData.userSelection.budget === 'string') {
    const match = tripData.userSelection.budget.match(/₱[\d,]+/);
    if (match) {
      const parsed = parseFloat(match[0].replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        userBudgetAmount = parsed;
      }
    }
  }
  
  // Priority 4: tripData.budget
  if (!userBudgetAmount && tripData?.tripData?.budget && typeof tripData.tripData.budget === 'string') {
    const parsed = parseFloat(tripData.tripData.budget.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      userBudgetAmount = parsed;
    }
  }
  
  const hasCustomBudget = userBudgetAmount && !isNaN(userBudgetAmount) && userBudgetAmount !== total;
  
  // Large total card with gradient - REDESIGNED FOR CLARITY
  const cardHeight = hasCustomBudget ? 35 : 22;
  pdf.setFillColor(...colors.success);
  pdf.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'F');
  
  // Gradient overlay effect
  withOpacity(pdf, 0.2, () => {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, y, contentWidth / 2, cardHeight, 3, 3, 'F');
  });
  
  // Total text - IMPROVED CLARITY
  pdf.setFontSize(fonts.heading - 2);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  
  if (hasCustomBudget) {
    // Show clear distinction between budget limit and actual cost
    pdf.text('TOTAL TRIP COST', margin + 8, y + 8);
    pdf.setFontSize(fonts.title);
    pdf.text(fmtPHP(total), margin + 8, y + 18);
    
    // Show budget comparison clearly
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'normal');
    const variance = userBudgetAmount - total;
    const percentUsed = ((total / userBudgetAmount) * 100).toFixed(0);
    
    if (variance >= 0) {
      // Under budget - show positive message
      pdf.text(
        `Your budget: ${fmtPHP(userBudgetAmount)} | Under by ${fmtPHP(variance)} (${percentUsed}% used)`,
        margin + 8,
        y + 26
      );
    } else {
      // Over budget - show clear warning
      pdf.text(
        `Your budget: ${fmtPHP(userBudgetAmount)} | Over by ${fmtPHP(Math.abs(variance))} (${percentUsed}% used)`,
        margin + 8,
        y + 26
      );
    }
    
    // Additional clarity line
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      'This is what you will actually spend based on your itinerary',
      margin + 8,
      y + 31
    );
  } else {
    // Show calculated total only - CLEARER LABEL
    pdf.text('TOTAL TRIP COST', margin + 8, y + 8);
    pdf.setFontSize(fonts.title);
    pdf.text(fmtPHP(total), margin + 8, y + 18);
  }
  
  y += cardHeight + 5;
  
  // Clear explanation with visual layout - ENHANCED
  if (total > 0) {
    const boxHeight = hasCustomBudget ? 38 : 26;
    
    // Ensure space for explanation box
    y = ensureSpace(pdf, y, boxHeight + 5);
    
    pdf.setFillColor(254, 249, 195); // Yellow-100 (attention color)
    pdf.setDrawColor(251, 191, 36); // Yellow-400 border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
    
    // Info icon
    pdf.setFillColor(251, 191, 36);
    pdf.circle(margin + 6, y + 7, 2.5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'bold');
    pdf.text('i', margin + 6, y + 8, { align: 'center' });
    
    // Title
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(133, 77, 14); // Yellow-800
    pdf.text('WHAT\'S INCLUDED IN THIS COST:', margin + 11, y + 8);
    
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(113, 63, 18); // Yellow-900
    
    // Explain the total calculation clearly
    const duration = tripData?.userSelection?.duration || 1;
    const numNights = Math.max(1, duration - 1);
    const explanationLines = [
      `- Accommodation: ${numNights} night${numNights > 1 ? 's' : ''} of hotel stays`,
      `- Food & Dining: All meals listed in your itinerary`,
      `- Activities: Entrance fees and tickets for attractions`,
      `- Transportation: Flights and local travel between locations`
    ];
    
    let textY = y + 14;
    explanationLines.forEach((line) => {
      pdf.text(line, margin + 6, textY);
      textY += 4.5;
    });
    
    if (hasCustomBudget) {
      textY += 1;
      const variance = userBudgetAmount - total;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(fonts.small);
      
      if (variance >= 0) {
        // Under budget - positive green
        pdf.setTextColor(22, 101, 52); // Green-800
        pdf.text(
          `[OK] Great! You're ${fmtPHP(Math.abs(variance))} under your budget limit`,
          margin + 6,
          textY
        );
      } else {
        // Over budget - warning red
        pdf.setTextColor(153, 27, 27); // Red-800
        pdf.text(
          `[!] Note: This exceeds your budget by ${fmtPHP(Math.abs(variance))}`,
          margin + 6,
          textY
        );
      }
    }
    
    y += boxHeight + 3;
  }
  
  return y;
};

// ========================================
// DAILY ITINERARY SECTION - COMPACT 2-COLUMN TABLE FORMAT
// ========================================
const addDailyItinerary = (pdf, tripData, startY) => {
  const { margin, colors, fonts, pageHeight, contentWidth } = PDF_CONFIG;
  let y = startY;
  
  // Section title - compact
  pdf.setFillColor(...colors.secondary);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fonts.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Itinerary', margin + 3, y + 5.5);
  
  y += 10; // Reduced from 18mm to 10mm
  
  // Parse itinerary
  const itinerary = parseDataArray(tripData?.tripData?.itinerary);
  
  if (!itinerary || itinerary.length === 0) {
    pdf.setFontSize(fonts.body);
    pdf.setTextColor(...colors.lightText);
    pdf.text('No itinerary data available', margin, y);
    return y + 10;
  }
  
  // Add each day
  itinerary.forEach((day, dayIndex) => {
    // Check if we need a new page for day header
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = margin;
    }
    
    // ✅ BALANCED Day Header (8mm total - clear and prominent)
    pdf.setFillColor(...colors.primary);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    
    // Day number (left) - BOLD and readable
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.subheading); // Full subheading size for boldness
    pdf.text(`DAY ${dayIndex + 1}`, margin + 3, y + 5.5);
    
    // Date (right)
    const dayDate = getDayDate(tripData, dayIndex);
    if (dayDate) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fonts.small); // Larger for readability
      const dateWidth = pdf.getTextWidth(String(dayDate));
      pdf.text(String(dayDate), margin + contentWidth - dateWidth - 3, y + 5.5);
    }
    
    y += 12; // ✅ IMPROVED: More breathing room after day header (4mm gap instead of 2mm)
    
    // Day activities - keep all but optimize display
    let activities = day.plan || [];
    
    // ✅ SMART CATEGORIZATION: Identify activity types for optimized rendering
    activities = activities.map((activity) => {
      const activityText = (
        activity.placeName || 
        activity.placeDetails || 
        activity.activity || 
        ''
      ).toLowerCase();
      
      // Categorize for smart rendering
      const isMeal = 
        activityText.includes('breakfast') ||
        activityText.includes('lunch') ||
        activityText.includes('dinner');
      
      const isTravel = 
        activityText.includes('travel to') ||
        activityText.includes('drive to') ||
        activityText.includes('fly to') ||
        activityText.includes('transfer to');
      
      // ✅ EXPANDED: Detect hotel operations including specific hotel names
      const isHotelOps = 
        activityText.includes('check-in') ||
        activityText.includes('check-out') ||
        activityText.includes('return to hotel') ||
        activityText.includes('back to hotel') ||
        activityText.includes('return to') && (activityText.includes('inn') || activityText.includes('resort') || activityText.includes('hotel'));
      
      return {
        ...activity,
        isCompact: isMeal || isTravel || isHotelOps, // These get condensed format
        isMeal,
        isTravel,
        isHotelOps
      };
    });
    
    // ✅ ENHANCED DEDUPLICATION: Merge ALL consecutive duplicate activities
    activities = activities.reduce((acc, activity) => {
      if (acc.length === 0) return [activity];
      
      const prevActivity = acc[acc.length - 1];
      
      // ✅ NORMALIZE TIMES: Convert to comparable format (HH:MM)
      const normalizeTime = (timeStr) => {
        if (!timeStr) return '';
        const str = String(timeStr).trim().toUpperCase();
        // Extract time portion (handles "8:00 AM", "08:00", "8:00AM", etc.)
        const match = str.match(/(\d{1,2}):(\d{2})/);
        if (!match) return str;
        
        let hours = parseInt(match[1]);
        const minutes = match[2];
        
        // Convert to 24-hour if AM/PM present
        if (str.includes('PM') && hours !== 12) hours += 12;
        if (str.includes('AM') && hours === 12) hours = 0;
        
        // Return normalized HH:MM format
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      };
      
      const currTime = normalizeTime(activity.time);
      const prevTime = normalizeTime(prevActivity.time);
      
      // ✅ SMART MATCHING: Check if activities are duplicates
      const sameTime = currTime && prevTime && currTime === prevTime;
      const bothHotelOps = activity.isHotelOps && prevActivity.isHotelOps;
      const bothTravel = activity.isTravel && prevActivity.isTravel;
      const bothMeal = activity.isMeal && prevActivity.isMeal;
      
      // Merge if same time AND same type (hotel/travel/meal)
      if (sameTime && (bothHotelOps || bothTravel || bothMeal)) {
        // ✅ MERGE DETAILS: Combine unique information
        const prevDetails = String(prevActivity.placeDetails || '').trim();
        const currDetails = String(activity.placeDetails || '').trim();
        
        if (currDetails && currDetails !== prevDetails) {
          // Append details with separator if both exist
          if (prevDetails) {
            prevActivity.placeDetails = `${prevDetails}. ${currDetails}`;
          } else {
            prevActivity.placeDetails = currDetails;
          }
        }
        
        // Don't add duplicate to accumulator
        return acc;
      }
      
      // Not a duplicate - add to accumulator
      acc.push(activity);
      return acc;
    }, []);
    
    // ✅ COMPACT: 2-Column Table Layout
    if (activities.length === 0) {
      pdf.setFontSize(fonts.small);
      pdf.setTextColor(...colors.lightText);
      pdf.text('No activities scheduled', margin + 3, y);
      y += 6;
    } else {
      activities.forEach((activity, actIndex) => {
        // Check page break (need less space now)
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }
        
        // ✅ SMART RENDERING: Compact format for logistics, full format for attractions
        const isCompactType = activity.isCompact || false;
        
        // ✅ CONSISTENT SEPARATOR: ALL activities get divider lines for clear visual separation
        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(0.1);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 1.5; // Breathing room after separator
        
        // ✅ TIME COLUMN (Left - 20mm for better spacing)
        const timeX = margin + 2;
        // Set color: Orange for meals, primary blue for others
        if (activity.isMeal) {
          pdf.setTextColor(245, 158, 11); // Amber-500 for meals
        } else {
          pdf.setTextColor(...colors.primary); // Primary blue for others
        }
        // ✅ CONSISTENT: All times use same font size for uniform appearance
        pdf.setFontSize(fonts.body); // Consistent 9pt for all times
        pdf.setFont('helvetica', 'bold');
        const displayTime = normalizeTime(activity.time);
        const compactTime = String(displayTime).replace(/\s*(AM|PM)/, '');
        pdf.text(compactTime, timeX, y + 3.5);
        
        // ✅ ACTIVITY COLUMN (Right - expanded width)
        const actX = margin + 22; // More space from time column
        
        // ✅ CONSISTENT STYLING: ALL activity names are BOLD for easy scanning
        pdf.setFont('helvetica', 'bold'); // Always bold for consistency
        pdf.setTextColor(...colors.text);
        pdf.setFontSize(fonts.body); // Consistent 9pt size for all activities
        
        // ✅ FIX: Ensure activityName is a STRING not an array
        let activityName = activity.placeName || activity.placeDetails || `Activity ${actIndex + 1}`;
        // Force to string and handle undefined/null
        activityName = String(activityName || '').trim() || `Activity ${actIndex + 1}`;
        
        // ✅ SELECTIVE PRICE DISPLAY: Only show prices for paid attractions (not meals/transfers/hotels)
        let priceText = '';
        const shouldShowPrice = !activity.isMeal && !activity.isTravel && !activity.isHotelOps;
        
        if (shouldShowPrice && activity.ticketPricing && 
            String(activity.ticketPricing) !== 'P 0' && 
            String(activity.ticketPricing) !== '₱0' && 
            String(activity.ticketPricing).toLowerCase() !== 'free') {
          const cleanPrice = String(activity.ticketPricing || '')
            .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013()]/g, '')
            .trim();
          const priceNum = parseFloat(cleanPrice.replace(/,/g, ''));
          if (!isNaN(priceNum) && priceNum > 0) {
            priceText = ` (P${priceNum.toLocaleString()})`;
          }
        }
        
        // Truncate based on type (more generous limits)
        const maxNameLength = isCompactType ? 75 : 60;
        if (activityName.length > maxNameLength) {
          activityName = activityName.substring(0, maxNameLength - 3) + '...';
        }
        
        // ✅ FIX: Force string concatenation with safety checks
        const fullTitle = activityName + priceText;
        // Safety: ensure fullTitle is not empty
        if (fullTitle && fullTitle.trim()) {
          pdf.text(fullTitle, actX, y + 3.5); // Aligned with time
        }
        
        // ✅ SMART DETAILS: Show details if they add value (not just duplicate the name)
        if (activity.placeDetails && activity.placeDetails !== activity.placeName) {
          // Check if details are meaningfully different from the name
          const cleanName = String(activityName).toLowerCase().replace(/[^a-z0-9\s]/g, '');
          const detailsLower = String(activity.placeDetails).toLowerCase();
          const nameWords = cleanName.split(/\s+/).filter(w => w.length > 3);
          
          // Details are valuable if they're not just repeating the name
          const isRedundant = nameWords.length > 0 && 
            nameWords.every(word => detailsLower.includes(word));
          
          if (!isRedundant) {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...colors.lightText);
            pdf.setFontSize(fonts.tiny);
            
            let cleanDetails = String(activity.placeDetails || '')
              .replace(/[±₱\u00B1\u2213\u00D8\u00DE\u2014\u2013]/g, '')
              .trim();
            
            // ✅ INCREASED LIMIT: 120 chars for better context (was 90)
            if (cleanDetails.length > 120) {
              cleanDetails = cleanDetails.substring(0, 117) + '...';
            }
            
            // ✅ Only add spacing if we actually have valid details to render
            if (cleanDetails && cleanDetails.trim()) {
              y += 4.5; // Add space before details
              pdf.text(cleanDetails, actX, y + 1.5);
              y += 5; // Add space after details
            }
          }
        }
        
        // ✅ CONSISTENT SPACING: All activities use same spacing for uniform layout
        y += 7; // 7mm spacing between all activities (balanced and readable)
      });
    }
    
    // ✅ IMPROVED: More breathing room between days for clear visual separation
    y += 5;
  });
  
  return y;
};

// ========================================
// FOOTER (Added to all pages)
// ========================================
const addFooterToAllPages = (pdf) => {
  const { pageHeight, margin, colors, fonts, pageWidth } = PDF_CONFIG;
  const totalPages = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(...colors.border);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(...colors.lightText);
    pdf.setFont('helvetica', 'normal');
    
    // Left: TravelRover
    pdf.text('Generated by TravelRover', margin, pageHeight - 10);
    
    // Right: Page number (properly aligned)
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

const parseDataArray = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
};

const getTripDates = (tripData) => {
  const startDate = tripData?.userSelection?.startDate;
  const endDate = tripData?.userSelection?.endDate;
  
  if (!startDate) return 'Dates not specified';
  
  const start = new Date(startDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  if (!endDate) return start;
  
  const end = new Date(endDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${start} - ${end}`;
};

const getTripDuration = (tripData) => {
  const startDate = tripData?.userSelection?.startDate;
  const endDate = tripData?.userSelection?.endDate;
  
  if (!startDate || !endDate) {
    const itinerary = parseDataArray(tripData?.tripData?.itinerary);
    return itinerary.length || 'N/A';
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  return days;
};

const getDayDate = (tripData, dayIndex) => {
  const startDate = tripData?.userSelection?.startDate;
  if (!startDate) return null;
  
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const generateFilename = (tripData) => {
  const destination = (tripData?.userSelection?.location || 'Trip')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `TravelRover_${destination}_${date}.pdf`;
};

// ========================================
// EXPORT JSON BACKUP
// ========================================
export const exportTripJSON = (tripData) => {
  try {
    const jsonString = JSON.stringify(tripData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravelRover_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('JSON export failed:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// PRINT VIEW
// ========================================
export const openPrintView = () => {
  window.print();
  return { success: true };
};
