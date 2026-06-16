import emailjs from 'emailjs-com';

// Initialize EmailJS (run once on app start)
export const initEmailJS = () => {
  emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
};

// Send Compliance Documents email
export const sendComplianceDocumentsEmail = async (tenantEmail, tenantName, propertyName, unitRef, complianceDocs) => {
  try {
    // Format compliance documents list
    const docsList = complianceDocs
      .map(doc => `- ${doc.doc_type} (${doc.document_date})`)
      .join('\n');

    const templateParams = {
      to_email: tenantEmail,
      tenant_name: tenantName,
      property: propertyName,
      unit: unitRef,
      document_list: docsList || 'No compliance documents currently available.',
      email_type: 'Compliance Documents'
    };

    const response = await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID,
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return {
      success: true,
      messageId: response.status,
      error: null
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      messageId: null,
      error: error.text || error.message
    };
  }
};

// Send Utilities Information email
export const sendUtilitiesInfoEmail = async (tenantEmail, tenantName, propertyName, unitRef, meterReadings) => {
  try {
    // Format meter readings list
    const readingsList = meterReadings
      .map(meter => {
        const reading = meter.reading ? `${meter.reading.reading_value}` : 'No reading';
        return `- ${meter.meter_type.charAt(0).toUpperCase() + meter.meter_type.slice(1)} (Meter: ${meter.meter_number}): ${reading}`;
      })
      .join('\n');

    const templateParams = {
      to_email: tenantEmail,
      tenant_name: tenantName,
      property: propertyName,
      unit: unitRef,
      meter_readings: readingsList || 'No utility meters currently available.',
      email_type: 'Utilities Information'
    };

    const response = await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID,
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return {
      success: true,
      messageId: response.status,
      error: null
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      messageId: null,
      error: error.text || error.message
    };
  }
};

// Send Contact Information Request email
export const sendContactInfoRequestEmail = async (tenantEmail, tenantName, propertyName) => {
  try {
    const contactForm = `
Please provide the following contact information:

Principal Contact:
- Name:
- Telephone:
- Email:

Accounts Contact:
- Name:
- Telephone:
- Email:

Facilities Contact:
- Name:
- Telephone:
- Email:

Out of Hours Contact:
- Name:
- Telephone:
- Email:

Please reply to this email with the above information filled in.
    `.trim();

    const templateParams = {
      to_email: tenantEmail,
      tenant_name: tenantName,
      property: propertyName,
      unit: '',
      document_list: contactForm,
      email_type: 'Contact Information Request'
    };

    const response = await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID,
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return {
      success: true,
      messageId: response.status,
      error: null
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      messageId: null,
      error: error.text || error.message
    };
  }
};
