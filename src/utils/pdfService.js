import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateOnboardingPDF = async (onboarding, htmlElement) => {
  try {
    // Get dimensions
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF, handling multiple pages if needed
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    const filename = `onboarding-${onboarding.unit_reference}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    return { success: true, error: null };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

// Simple text-based PDF (fallback if html2canvas fails)
export const generateSimpleOnboardingPDF = (onboarding) => {
  try {
    const pdf = new jsPDF();
    let yPosition = 10;

    // Title
    pdf.setFontSize(16);
    pdf.text('Tenant Onboarding Summary', 10, yPosition);
    yPosition += 10;

    // Basic Info
    pdf.setFontSize(12);
    pdf.text(`Property: ${onboarding.properties?.name || 'N/A'}`, 10, yPosition);
    yPosition += 7;
    pdf.text(`Unit: ${onboarding.unit_reference}`, 10, yPosition);
    yPosition += 7;
    pdf.text(`Tenant: ${onboarding.tenant_names}`, 10, yPosition);
    yPosition += 7;
    pdf.text(`Start Date: ${onboarding.start_date}`, 10, yPosition);
    yPosition += 7;
    pdf.text(`Status: ${onboarding.status}`, 10, yPosition);
    yPosition += 10;

    // Compliance Documents
    if (onboarding.compliance_documents?.length > 0) {
      pdf.setFontSize(11);
      pdf.text('Compliance Documents:', 10, yPosition);
      yPosition += 6;
      pdf.setFontSize(10);
      onboarding.compliance_documents.forEach(doc => {
        pdf.text(`- ${doc.doc_type} (${doc.document_date})${doc.notes ? ': ' + doc.notes : ''}`, 15, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Meters
    if (onboarding.meters?.length > 0) {
      pdf.setFontSize(11);
      pdf.text('Meters:', 10, yPosition);
      yPosition += 6;
      pdf.setFontSize(10);
      onboarding.meters.forEach(meter => {
        const reading = meter.meter_readings?.[0];
        const readingValue = reading ? `${reading.reading_value}` : 'No reading';
        pdf.text(`- ${meter.meter_type}: ${meter.meter_number} (${readingValue})`, 15, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Workflow Status
    if (onboarding.compliance_workflow_steps?.length > 0) {
      pdf.setFontSize(11);
      pdf.text('Workflow Status:', 10, yPosition);
      yPosition += 6;
      pdf.setFontSize(10);
      onboarding.compliance_workflow_steps.forEach(step => {
        const status = step.is_complete ? '✓' : '○';
        pdf.text(`${status} ${step.step_name}`, 15, yPosition);
        yPosition += 5;
      });
    }

    // Save PDF
    const filename = `onboarding-${onboarding.unit_reference}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    return { success: true, error: null };
  } catch (error) {
    console.error('Simple PDF generation error:', error);
    return { success: false, error: error.message };
  }
};
