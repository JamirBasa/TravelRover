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
  
  // Page dimensions
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 20,
  contentWidth: 170, // pageWidth - (margin * 2)
  
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
  
  // Typography
  fonts: {
    title: 24,
    heading: 18,
    subheading: 14,
    body: 10,
    small: 8,
    tiny: 7,
  }
};

// ========================================
// MAIN EXPORT FUNCTION
// ========================================
export const generateTripPDF = async (tripData) => {
  try {
    console.log('📄 Starting professional PDF generation...', tripData);
    
    const pdf = new jsPDF({
      orientation: PDF_CONFIG.orientation,
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format,
      compress: PDF_CONFIG.compress
    });
    
    let currentY = PDF_CONFIG.margin;
    
    // 1. Add Cover Page
    addCoverPage(pdf, tripData);
    
    // 2. Add Trip Overview & Details
    pdf.addPage();
    currentY = PDF_CONFIG.margin;
    currentY = addTripOverview(pdf, tripData, currentY);
    
    // 3. Hotels & Must-See Places - Removed for clean, focused itinerary
    // Note: Hotel and attraction details remain in the app for booking reference
    
    // 4. Add Budget Breakdown (Accurate calculation from itinerary)
    currentY = addBudgetSection(pdf, tripData, currentY);
    
    // 5. Add Daily Itinerary
    pdf.addPage();
    currentY = PDF_CONFIG.margin;
    addDailyItinerary(pdf, tripData, currentY);
    
    // 6. Add Footer & Page Numbers to all pages
    addFooterToAllPages(pdf, tripData);
    
    // 7. Save PDF
    const filename = generateFilename(tripData);
    pdf.save(filename);
    
    console.log('✅ Professional PDF generated successfully:', filename);
    return { success: true, filename };
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// COVER PAGE - Professional Design
// ========================================
const addCoverPage = (pdf, tripData) => {
  const { pageWidth, pageHeight, margin, colors, fonts } = PDF_CONFIG;
  const centerX = pageWidth / 2;
  
  // ===== Header Section with Gradient Effect =====
  // Top gradient bar
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 80, 'F');
  
  // Accent gradient overlay
  pdf.setFillColor(...colors.secondary);
  pdf.setGState(new pdf.GState({opacity: 0.3}));
  pdf.rect(0, 40, pageWidth, 40, 'F');
  pdf.setGState(new pdf.GState({opacity: 1}));
  
  // Diagonal design elements
  pdf.setFillColor(255, 255, 255);
  pdf.setGState(new pdf.GState({opacity: 0.1}));
  pdf.circle(pageWidth - 20, 20, 40, 'F');
  pdf.circle(20, 60, 25, 'F');
  pdf.setGState(new pdf.GState({opacity: 1}));
  
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
  
  // Card 4: Budget - Enhanced split design
  cardX += cardWidth + cardSpacing;
  
  // Get budget info - handle multiple formats
  const budgetType = tripData?.userSelection?.budget || 'Flexible';
  
  // Extract numeric budget from multiple possible sources
  let budgetAmount = null;
  
  // Try userSelection.budgetAmount first
  if (tripData?.userSelection?.budgetAmount) {
    budgetAmount = parseFloat(String(tripData.userSelection.budgetAmount).replace(/[^0-9.]/g, ''));
  }
  // Try userSelection.customBudget
  else if (tripData?.userSelection?.customBudget) {
    budgetAmount = parseFloat(String(tripData.userSelection.customBudget).replace(/[^0-9.]/g, ''));
  }
  // Try tripData.budget
  else if (tripData?.tripData?.budget) {
    if (typeof tripData.tripData.budget === 'string') {
      budgetAmount = parseFloat(tripData.tripData.budget.replace(/[^0-9.]/g, ''));
    } else if (typeof tripData.tripData.budget === 'number') {
      budgetAmount = tripData.tripData.budget;
    }
  }
  // Try extracting from budget string "Custom: ₱18990"
  else if (typeof budgetType === 'string' && budgetType.includes('₱')) {
    const match = budgetType.match(/₱[\d,]+/);
    if (match) {
      budgetAmount = parseFloat(match[0].replace(/[^0-9.]/g, ''));
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
  
  // Label
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.success);
  pdf.text('BUDGET TYPE', budgetCardX + budgetCardWidth / 2, budgetCardY + 10, { align: 'center' });
  
  // Budget type (smaller) - clean tier name only
  pdf.setFontSize(fonts.body);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  // Extract only the tier name (e.g., "Custom" from "Custom: ±18990")
  const cleanBudgetTier = budgetType.split(':')[0].trim();
  pdf.text(cleanBudgetTier, budgetCardX + budgetCardWidth / 2, budgetCardY + 15, { align: 'center' });
  
  // Budget amount (larger, prominent)
  if (budgetAmount) {
    pdf.setFontSize(fonts.subheading);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.success);
    const formattedAmount = `P ${budgetAmount.toLocaleString()}`;
    pdf.text(formattedAmount, budgetCardX + budgetCardWidth / 2, budgetCardY + 21, { align: 'center' });
  }
  
  // ===== Special Preferences Badge (if exists) =====
  if (tripData?.userSelection?.specificRequests) {
    const badgeY = card2Y + cardHeight + 15;
    pdf.setFillColor(...colors.warning);
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    pdf.roundedRect(margin, badgeY, pageWidth - (margin * 2), 20, 3, 3, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.warning);
    pdf.text('CUSTOMIZED ITINERARY', centerX, badgeY + 6, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    const requestText = pdf.splitTextToSize(
      tripData.userSelection.specificRequests.substring(0, 120) + '...',
      pageWidth - (margin * 3)
    );
    pdf.text(requestText, centerX, badgeY + 13, { align: 'center' });
  }
  
  // ===== PDF Contents Info =====
  const infoY = pageHeight - 75;
  const infoBoxHeight = 35; // Increased from 25 to 35
  
  pdf.setFillColor(249, 250, 251); // Gray-50
  pdf.roundedRect(margin, infoY, pageWidth - (margin * 2), infoBoxHeight, 2, 2, 'F');
  
  // Left side: "What's Inside" content
  pdf.setFontSize(fonts.small);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.text);
  pdf.text('What\'s Inside This Guide:', margin + 5, infoY + 7);
  
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.lightText);
  const contents = [
    '✓ Complete daily itinerary with timings',
    '✓ Budget breakdown from activities',
    '✓ Travel logistics and estimated costs',
    '✓ Activity details with pricing'
  ];
  let contentY = infoY + 12;
  contents.forEach(item => {
    pdf.text(item, margin + 5, contentY);
    contentY += 4.5;
  });
  
  // Bottom note - proper spacing
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...colors.lightText);
  const noteText = pdf.splitTextToSize(
    'Complete hotel and attraction details with photos available in the TravelRover app.',
    pageWidth - (margin * 2) - 10
  );
  pdf.text(noteText, centerX, infoY + 30, { align: 'center' });
  
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
  const generatedDate = new Date().toLocaleDateString('en-US', {
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

// Helper function to draw info cards
const drawInfoCard = (pdf, x, y, width, height, label, value, color) => {
  const { fonts } = PDF_CONFIG;
  
  // Card background with subtle shadow effect
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(x + 1, y + 1, width, height, 2, 2, 'F'); // Shadow
  
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 2, 2, 'FD');
  
  // Colored top bar
  pdf.setFillColor(...color);
  pdf.rect(x, y, width, 3, 'F');
  
  // Label
  pdf.setFontSize(fonts.tiny);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...color);
  pdf.text(label, x + width / 2, y + 10, { align: 'center' });
  
  // Value
  pdf.setFontSize(fonts.body + 1);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  const valueLines = pdf.splitTextToSize(value, width - 4);
  pdf.text(valueLines, x + width / 2, y + 17, { align: 'center' });
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
    
    // Extract budget amount from multiple sources
    let displayBudgetAmount = null;
    if (tripData?.userSelection?.budgetAmount) {
      displayBudgetAmount = parseFloat(String(tripData.userSelection.budgetAmount).replace(/[^0-9.]/g, ''));
    } else if (tripData?.userSelection?.customBudget) {
      displayBudgetAmount = parseFloat(String(tripData.userSelection.customBudget).replace(/[^0-9.]/g, ''));
    } else if (tripData?.tripData?.budget) {
      if (typeof tripData.tripData.budget === 'string') {
        displayBudgetAmount = parseFloat(tripData.tripData.budget.replace(/[^0-9.]/g, ''));
      } else if (typeof tripData.tripData.budget === 'number') {
        displayBudgetAmount = tripData.tripData.budget;
      }
    } else if (typeof budgetTypeText === 'string' && budgetTypeText.includes('₱')) {
      const match = budgetTypeText.match(/₱[\d,]+/);
      if (match) {
        displayBudgetAmount = parseFloat(match[0].replace(/[^0-9.]/g, ''));
      }
    }
    
    if (displayBudgetAmount && !isNaN(displayBudgetAmount)) {
      const cleanBudgetType = budgetTypeText.split(':')[0].trim();
      return `${cleanBudgetType} (P ${displayBudgetAmount.toLocaleString()})`;
    }
    
    return budgetTypeText.replace(/[±₱]/g, '').trim();
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
  
  // === Special Preferences Box (if exists) ===
  if (tripData?.userSelection?.specificRequests) {
    y += 5;
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }
    
    // Box with colored border
    pdf.setFillColor(...colors.bgLight);
    pdf.setDrawColor(...colors.warning);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');
    
    // Colored side accent
    pdf.setFillColor(...colors.warning);
    pdf.rect(margin, y, 2, 30, 'F');
    
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.warning);
    pdf.text('YOUR SPECIAL PREFERENCES', margin + 5, y + 6);
    
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    const requestLines = pdf.splitTextToSize(
      tripData.userSelection.specificRequests, 
      contentWidth - 10
    );
    pdf.text(requestLines, margin + 5, y + 12);
    
    y += 35;
  }
  
  return y;
};

// Helper function to add section headers
const addSectionHeader = (pdf, title, y, color) => {
  const { margin, contentWidth, fonts } = PDF_CONFIG;
  
  // Colored rectangle background
  pdf.setFillColor(...color);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  
  // White text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fonts.subheading);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin + 3, y + 5.5);
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
  
  // Display budget items with visual bars
  const maxBarWidth = contentWidth - 80;
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
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fonts.body);
    pdf.text(item.label, margin + 3, y + 4);
    
    // Visual bar
    const barY = y + 6;
    const barHeight = 4;
    
    // Bar background
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(margin + 3, barY, maxBarWidth, barHeight, 1, 1, 'F');
    
    // Bar fill (gradient effect with multiple colors)
    const barColors = [
      [14, 165, 233],   // primary
      [2, 132, 199],    // secondary
      [99, 102, 241],   // accent
      [16, 185, 129],   // success
    ];
    const colorIndex = index % barColors.length;
    pdf.setFillColor(...barColors[colorIndex]);
    pdf.roundedRect(margin + 3, barY, barWidth, barHeight, 1, 1, 'F');
    
    // Amount and percentage
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(...colors.text);
    const priceText = `P ${formatNumber(item.value)} (${percentage}%)`;
    pdf.text(priceText, pageWidth - margin - 3, y + 4, { align: 'right' });
    
    y += 14;
  });
  
  // Total budget card (prominent)
  y += 5;
  
  // Check if user provided a custom budget amount - extract from multiple sources
  let userBudgetAmount = null;
  if (tripData?.userSelection?.budgetAmount) {
    userBudgetAmount = parseFloat(String(tripData.userSelection.budgetAmount).replace(/[^0-9.]/g, ''));
  } else if (tripData?.userSelection?.customBudget) {
    userBudgetAmount = parseFloat(String(tripData.userSelection.customBudget).replace(/[^0-9.]/g, ''));
  } else if (tripData?.tripData?.budget && typeof tripData.tripData.budget === 'string') {
    userBudgetAmount = parseFloat(tripData.tripData.budget.replace(/[^0-9.]/g, ''));
  } else if (tripData?.userSelection?.budget && typeof tripData.userSelection.budget === 'string') {
    const match = tripData.userSelection.budget.match(/₱[\d,]+/);
    if (match) {
      userBudgetAmount = parseFloat(match[0].replace(/[^0-9.]/g, ''));
    }
  }
  
  const hasCustomBudget = userBudgetAmount && !isNaN(userBudgetAmount) && userBudgetAmount !== total;
  
  // Large total card with gradient
  const cardHeight = hasCustomBudget ? 30 : 20;
  pdf.setFillColor(...colors.success);
  pdf.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'F');
  
  // Gradient overlay effect
  pdf.setGState(new pdf.GState({opacity: 0.2}));
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, y, contentWidth / 2, cardHeight, 3, 3, 'F');
  pdf.setGState(new pdf.GState({opacity: 1}));
  
  // Total text
  pdf.setFontSize(fonts.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  
  if (hasCustomBudget) {
    // Show custom budget with clear breakdown
    pdf.text('YOUR TRIP BUDGET', margin + 8, y + 8);
    pdf.setFontSize(fonts.title);
    pdf.text(`P ${formatNumber(userBudgetAmount)}`, margin + 8, y + 16);
    
    // Show what's included in simple terms
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'normal');
    const percentUsed = ((total / userBudgetAmount) * 100).toFixed(0);
    pdf.text(
      `Daily Activities: P ${formatNumber(total)} (${percentUsed}% of budget)`,
      margin + 8,
      y + 23
    );
  } else {
    // Show calculated total only
    pdf.text('ESTIMATED DAILY COSTS', margin + 8, y + 8);
    pdf.setFontSize(fonts.title);
    pdf.text(`P ${formatNumber(total)}`, margin + 8, y + 16);
  }
  
  y += cardHeight + 5;
  
  // Clear explanation with visual layout
  if (total > 0) {
    const boxHeight = hasCustomBudget ? 30 : 22;
    pdf.setFillColor(254, 249, 195); // Yellow-100 (attention color)
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');
    
    // Title
    pdf.setFontSize(fonts.small);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(133, 77, 14); // Yellow-800
    pdf.text('ABOUT THIS BUDGET:', margin + 3, y + 5);
    
    pdf.setFontSize(fonts.tiny);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(113, 63, 18); // Yellow-900
    
    // Explain the total calculation
    const duration = tripData?.userSelection?.duration || 1;
    const numNights = Math.max(1, duration - 1);
    const explanationLines = [
      `This is your complete trip cost including:`,
      `- Accommodation: ${numNights} night${numNights > 1 ? 's' : ''} of hotel stays`,
      `- Food & Activities: All meals and attractions in your itinerary`,
      `- Transportation: Flights and local transportation within your trip`
    ];
    
    let textY = y + 10;
    explanationLines.forEach((line) => {
      pdf.text(line, margin + 3, textY);
      textY += 4;
    });
    
    if (hasCustomBudget) {
      const variance = userBudgetAmount - total;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(variance >= 0 ? 22 : 153, variance >= 0 ? 101 : 27, variance >= 0 ? 52 : 27);
      pdf.text(
        variance >= 0 
          ? `Under budget by P ${formatNumber(Math.abs(variance))}` 
          : `Over budget by P ${formatNumber(Math.abs(variance))}`,
        margin + 3,
        textY + 1
      );
    }
    
    y += boxHeight + 3;
  }
  
  return y;
};

// ========================================
// DAILY ITINERARY SECTION
// ========================================
const addDailyItinerary = (pdf, tripData, startY) => {
  const { margin, colors, fonts, pageHeight } = PDF_CONFIG;
  let y = startY;
  
  // Section title
  pdf.setFillColor(...colors.secondary);
  pdf.rect(margin, y, PDF_CONFIG.pageWidth - (margin * 2), 10, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fonts.heading);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Itinerary', margin + 5, y + 7);
  
  y += 18;
  
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
    // Check if we need a new page
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }
    
    // ===== Professional Day Header =====
    const headerHeight = 12;
    
    // Gradient background
    pdf.setFillColor(...colors.primary);
    pdf.roundedRect(margin, y, PDF_CONFIG.pageWidth - (margin * 2), headerHeight, 2, 2, 'F');
    
    // Subtle gradient overlay
    pdf.setGState(new pdf.GState({opacity: 0.2}));
    pdf.setFillColor(...colors.secondary);
    pdf.roundedRect(margin, y + headerHeight / 2, PDF_CONFIG.pageWidth - (margin * 2), headerHeight / 2, 2, 2, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Day number and title
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.subheading);
    
    // Extract theme from day data or use default
    let dayTheme = '';
    if (day.theme) {
      dayTheme = day.theme.replace(/^Day \d+ - /, ''); // Remove "Day X - " prefix if exists
    } else if (day.day && typeof day.day === 'string' && !day.day.match(/^\d+$/)) {
      dayTheme = day.day.replace(/^Day \d+ - /, '');
    }
    
    // Left side: Day number
    pdf.text(`DAY ${dayIndex + 1}`, margin + 5, y + 7.5);
    
    // Right side: Date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fonts.small);
    const dayDate = getDayDate(tripData, dayIndex);
    if (dayDate) {
      const dateWidth = pdf.getTextWidth(dayDate);
      pdf.text(dayDate, PDF_CONFIG.pageWidth - margin - dateWidth - 5, y + 7.5);
    }
    
    // Theme/subtitle (if exists)
    if (dayTheme) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fonts.tiny);
      pdf.setTextColor(255, 255, 255);
      pdf.setGState(new pdf.GState({opacity: 0.9}));
      const themeText = dayTheme.length > 50 ? dayTheme.substring(0, 47) + '...' : dayTheme;
      pdf.text(themeText, margin + 5, y + 10.5);
      pdf.setGState(new pdf.GState({opacity: 1}));
    }
    
    y += headerHeight + 5; // Add spacing after header
    
    // Day activities
    const activities = day.plan || [];
    
    if (activities.length === 0) {
      pdf.setFontSize(fonts.small);
      pdf.setTextColor(...colors.lightText);
      pdf.text('No activities scheduled', margin + 5, y);
      y += 8;
    } else {
      activities.forEach((activity, actIndex) => {
        // Check page break
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }
        
        // Activity number and time on same line
        pdf.setFontSize(fonts.body);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.primary);
        
        // Activity number
        pdf.setFillColor(...colors.primary);
        pdf.circle(margin + 7, y - 1, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(fonts.small);
        pdf.text(`${actIndex + 1}`, margin + 7, y + 1, { align: 'center' });
        
        // Time
        pdf.setTextColor(...colors.primary);
        pdf.setFontSize(fonts.body);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${activity.time || 'Flexible'}`, margin + 15, y);
        
        y += 6;
        
        // Activity name
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.text);
        const activityName = activity.placeName || activity.placeDetails || `Activity ${actIndex + 1}`;
        const splitName = pdf.splitTextToSize(activityName, PDF_CONFIG.pageWidth - (margin * 2) - 10);
        pdf.text(splitName, margin + 5, y);
        y += splitName.length * 5;
        
        // Activity details
        if (activity.placeDetails && activity.placeDetails !== activity.placeName) {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...colors.lightText);
          pdf.setFontSize(fonts.small);
          
          // Clean the details: remove ± symbols (including unicode variants) and pricing info
          let cleanDetails = String(activity.placeDetails)
            .replace(/±/g, '')
            .replace(/[\u00B1\u2213]/g, '') // Remove ± unicode variants (U+00B1, U+2213)
            .replace(/₱/g, 'P')
            .trim();
          
          const splitDetails = pdf.splitTextToSize(
            cleanDetails,
            PDF_CONFIG.pageWidth - (margin * 2) - 10
          );
          pdf.text(splitDetails, margin + 5, y);
          y += splitDetails.length * 4;
        }
        
        // Activity metadata
        const metadata = [];
        if (activity.ticketPricing && activity.ticketPricing !== 'P 0' && activity.ticketPricing !== '₱0' && activity.ticketPricing.toLowerCase() !== 'free') {
          // Clean price: remove ± and ₱, parentheses, replace with P, add comma formatting
          let cleanPrice = String(activity.ticketPricing)
            .replace(/±/g, '')
            .replace(/₱/g, '')
            .replace(/[()]/g, '') // Remove parentheses
            .replace(/[\u00B1\u2213]/g, '') // Remove ± unicode variants
            .trim();
          
          // Try to parse and format with commas
          const priceNum = parseFloat(cleanPrice.replace(/,/g, ''));
          if (!isNaN(priceNum) && priceNum > 0) {
            cleanPrice = `P ${priceNum.toLocaleString()}`;
            metadata.push(`Price: ${cleanPrice}`);
          } else if (cleanPrice && cleanPrice.toLowerCase() !== 'free' && cleanPrice !== '0' && !cleanPrice.includes('???')) {
            metadata.push(`Price: P ${cleanPrice}`);
          }
        }
        if (activity.timeTravel && activity.timeTravel !== 'Varies' && activity.timeTravel !== '0 minutes') {
          // Clean travel time: remove ± and parentheses, unicode variants
          let cleanTravel = String(activity.timeTravel)
            .replace(/±/g, '')
            .replace(/[()]/g, '')
            .replace(/[\u00B1\u2213]/g, '') // Remove ± unicode variants
            .replace(/free$/i, '') // Remove "free" suffix
            .trim();
          
          // Only add if not "0 minutes" or empty after cleaning
          if (cleanTravel && cleanTravel !== '0 minutes' && !cleanTravel.match(/^0\s*minutes?\s*$/i)) {
            metadata.push(`Travel: ${cleanTravel}`);
          }
        }
        if (activity.rating) {
          metadata.push(`Rating: ${activity.rating}/5`);
        }
        
        if (metadata.length > 0) {
          pdf.setFontSize(fonts.small);
          pdf.setTextColor(...colors.lightText);
          // Ensure proper string formatting and clean any remaining special chars
          const metadataText = metadata
            .map(item => String(item).replace(/[\u00B1\u2213]/g, ''))
            .join('  |  ');
          pdf.text(metadataText, margin + 5, y);
          y += 5;
        }
        
        y += 5; // Spacing between activities
      });
    }
    
    y += 5; // Spacing between days
  });
  
  return y;
};

// ========================================
// FOOTER (Added to all pages)
// ========================================
const addFooterToAllPages = (pdf) => {
  const { pageHeight, margin, colors, fonts } = PDF_CONFIG;
  const totalPages = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(...colors.border);
    pdf.line(margin, pageHeight - 15, PDF_CONFIG.pageWidth - margin, pageHeight - 15);
    
    // Footer text
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(...colors.lightText);
    pdf.setFont('helvetica', 'normal');
    
    // Left: TravelRover
    pdf.text('Generated by TravelRover', margin, pageHeight - 10);
    
    // Right: Page number
    pdf.text(`Page ${i} of ${totalPages}`, PDF_CONFIG.pageWidth - margin - 20, pageHeight - 10);
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

const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
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
